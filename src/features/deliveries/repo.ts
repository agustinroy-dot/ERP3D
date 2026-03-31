import { getDb } from "@/db/client";
import { deliveries, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDeliveries(orgId: string) {
  const db = getDb();
  return db
    .select({
      delivery: deliveries,
      order: orders,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .where(eq(orders.orgId, orgId))
    .orderBy(desc(deliveries.createdAt));
}

export async function getDeliveryDetail(orgId: string, deliveryId: string) {
  const db = getDb();
  const result = await db
    .select({
      delivery: deliveries,
      order: orders,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .where(eq(deliveries.id, deliveryId));

  if (!result.length || result[0].order.orgId !== orgId) {
    return null;
  }

  return result[0];
}

export async function getOrderDelivery(orderId: string) {
  const db = getDb();
  const results = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.orderId, orderId))
    .limit(1);

  return results[0] || null;
}

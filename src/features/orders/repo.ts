import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, orderItems, customers, quotes, payments } from "@/db/schema";

export async function listOrders(orgId: string) {
  const db = getDb();
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      priority: orders.priority,
      createdAt: orders.createdAt,
      promisedAt: orders.promisedAt,
      customerName: customers.name,
      quoteNumber: quotes.quoteNumber,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(quotes, eq(orders.quoteId, quotes.id))
    .where(eq(orders.orgId, orgId))
    .orderBy(desc(orders.orderNumber))
    .limit(100);
}

export async function getOrderDetail(orgId: string, orderId: string) {
  const db = getDb();

  const orderData = await db
    .select({
      order: orders,
      customerName: customers.name,
      quoteNumber: quotes.quoteNumber
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(quotes, eq(orders.quoteId, quotes.id))
    .where(and(eq(orders.orgId, orgId), eq(orders.id, orderId)))
    .limit(1);

  if (!orderData || orderData.length === 0) return null;

  const rawItems = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const itemIds = rawItems.map(i => i.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allCosts: any[] = [];
  if (itemIds.length > 0) {
      const costsQuery = await db.query.orderItemCosts.findMany();
      allCosts = costsQuery.filter(c => itemIds.includes(c.orderItemId));
  }

  const items = rawItems.map(item => {
      return {
          ...item,
          costs: allCosts.filter(c => c.orderItemId === item.id)
      };
  });

  const paymentsData = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt));

  return { ...orderData[0], items, payments: paymentsData };
}

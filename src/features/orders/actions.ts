"use server";

import { createOrderSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, orders, orderItems } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";
import { writeActivity } from "@/services/activity/write-activity";

async function requireOrgContext(userId: string) {
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, userId)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

async function generateNextOrderNumber(orgId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ maxNumber: max(orders.orderNumber) })
    .from(orders)
    .where(eq(orders.orgId, orgId));
  const currentMax = result[0]?.maxNumber ?? 0;
  return currentMax + 1;
}

export async function createOrderAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "orders:write")) throw new Error("FORBIDDEN");

  const input = createOrderSchema.parse(raw);
  const db = getDb();
  const orderNumber = await generateNextOrderNumber(orgId);

  const promisedAt = input.promisedAt ? new Date(input.promisedAt) : null;

  // Insert Order
  const [order] = await db.insert(orders).values({
    orgId,
    orderNumber,
    customerId: input.customerId,
    quoteId: input.quoteId || null,
    status: "pending",
    priority: input.priority,
    promisedAt,
    notes: input.notes || null,
  }).returning();

  // Insert Items
  const itemsToInsert = input.items.map(item => ({
    orderId: order.id,
    name: item.name,
    technology: item.technology,
    color: item.color || null,
    materialId: item.materialId || null,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toString(),
  }));

  await db.insert(orderItems).values(itemsToInsert);

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "order_created_manually",
    entityType: "order",
    entityId: order.id,
    summary: `Order #${order.orderNumber} created manually`
  });

  return order;
}

export async function updateOrderStatusAction(orderId: string, status: "pending" | "approved" | "in_production" | "qc" | "ready_for_delivery" | "delivered" | "canceled") {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "orders:write")) throw new Error("FORBIDDEN");

  const db = getDb();
  const [order] = await db.update(orders)
    .set({ status })
    .where(eq(orders.id, orderId))
    .returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "order_status_updated",
    entityType: "order",
    entityId: orderId,
    summary: `Order #${order.orderNumber} marked as ${status.replace(/_/g, ' ')}`
  });
}
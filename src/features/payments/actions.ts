"use server";

import { createPaymentSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, payments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
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

export async function createPaymentAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "payments:write")) throw new Error("FORBIDDEN");

  const input = createPaymentSchema.parse(raw);
  const db = getDb();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
  if (!order || order.orgId !== orgId) throw new Error("Order not found");

  const [payment] = await db.insert(payments).values({
    orderId: input.orderId,
    amount: input.amount.toString(),
    method: input.method,
    reference: input.reference || null,
    status: "paid",
    paidAt: new Date(),
  }).returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "payment_recorded",
    entityType: "order",
    entityId: order.id,
    summary: `Payment of $${Number(payment.amount).toFixed(2)} recorded for Order #${order.orderNumber}`
  });

  return payment;
}
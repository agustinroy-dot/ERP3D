"use server";

import { createDeliverySchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, deliveries, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";
import { writeActivity } from "@/services/activity/write-activity";
import { createNotification } from "@/features/notifications/repo";

async function requireOrgContext(userId: string) {
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, userId)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

export async function createDeliveryAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "deliveries:write")) throw new Error("FORBIDDEN");

  const input = createDeliverySchema.parse(raw);
  const db = getDb();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
  if (!order || order.orgId !== orgId) throw new Error("Order not found");

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;

  const [delivery] = await db.insert(deliveries).values({
    orderId: input.orderId,
    type: input.type,
    scheduledAt,
    notes: input.notes || null,
    status: "pending",
  }).returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "delivery_created",
    entityType: "order",
    entityId: order.id,
    summary: `Delivery created for Order #${order.orderNumber}`,
    action: "DELIVERY_CREATED",
    metadata: {
      deliveryId: delivery.id,
      type: input.type,
      scheduledAt
    }
  });

  return delivery;
}

export async function updateDeliveryStatusAction(deliveryId: string, status: "pending" | "coordinated" | "dispatched" | "delivered" | "failed") {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "deliveries:write")) throw new Error("FORBIDDEN");

  const db = getDb();

  const deliveryResult = await db.select({ delivery: deliveries, order: orders }).from(deliveries).innerJoin(orders, eq(deliveries.orderId, orders.id)).where(eq(deliveries.id, deliveryId));
  if (!deliveryResult.length || deliveryResult[0].order.orgId !== orgId) {
    throw new Error("Delivery not found");
  }

  const { delivery, order } = deliveryResult[0];

  const deliveredAt = (status === "delivered" && delivery.status !== "delivered") ? new Date() : delivery.deliveredAt;

  await db.update(deliveries)
    .set({ status, deliveredAt })
    .where(eq(deliveries.id, deliveryId));

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "delivery_status_updated",
    entityType: "order",
    entityId: order.id,
    summary: `Delivery for Order #${order.orderNumber} marked as ${status.replace(/_/g, ' ')}`,
    action: `DELIVERY_${status.toUpperCase()}`,
    metadata: {
      deliveryId: delivery.id,
      fromStatus: delivery.status,
      toStatus: status
    }
  });

  if (status === "delivered" && order.status !== "delivered") {
    await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, order.id));
    await writeActivity({
      orgId,
      actorUserId: user.id,
      type: "order_delivered",
      entityType: "order",
      entityId: order.id,
      summary: `Order #${order.orderNumber} marked as delivered via logistics`,
      action: "ORDER_DELIVERED",
      metadata: {
        deliveryId: delivery.id
      }
    });
  }

  if (status === "failed") {
    // Let's notify the user who created the delivery/order, but for now we don't have who created the order reliably
    // We will just create a generic admin notification conceptually or skip it if too complex
    // Adding a generic notification back to the current user as an audit trail record
    await createNotification({
      orgId,
      userId: user.id,
      title: "Delivery Failed",
      message: `Delivery for Order #${order.orderNumber} has failed.`,
      type: "error",
      targetUrl: `/deliveries/${delivery.id}`
    });
  }
}

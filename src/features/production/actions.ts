"use server";

import { createWorkOrderSchema, updateWorkOrderStatusSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, workOrders, workOrderEvents, orders, printers } from "@/db/schema";
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

async function generateNextWorkOrderNumber(orgId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ maxNumber: max(workOrders.workOrderNumber) })
    .from(workOrders)
    .where(eq(workOrders.orgId, orgId));
  const currentMax = result[0]?.maxNumber ?? 0;
  return currentMax + 1;
}

export async function createWorkOrderAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "production:write") && !can(role, "orders:write")) throw new Error("FORBIDDEN");

  const input = createWorkOrderSchema.parse(raw);
  const db = getDb();

  const orderExists = await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) });
  if (!orderExists || orderExists.orgId !== orgId) throw new Error("Invalid Order ID");

  const workOrderNumber = await generateNextWorkOrderNumber(orgId);

  const [wo] = await db.insert(workOrders).values({
    orgId,
    orderId: input.orderId,
    workOrderNumber,
    printerId: input.printerId || null,
    operatorId: input.operatorId || null,
    materialId: input.materialId || null,
    color: input.color || null,
    quantity: input.quantity,
    estimatedHours: input.estimatedHours.toString(),
    technicalNotes: input.technicalNotes || null,
    status: "pending",
  }).returning();

  await db.insert(workOrderEvents).values({
    workOrderId: wo.id,
    actorUserId: user.id,
    type: "status_change",
    message: "Work order created",
    toStatus: "pending",
  });

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "work_order_created",
    entityType: "work_order",
    entityId: wo.id,
    summary: `Work Order WO-${wo.workOrderNumber} created for Order #${orderExists.orderNumber}`
  });

  return wo;
}

export async function updateWorkOrderStatusAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "production:update-status") && !can(role, "production:write")) throw new Error("FORBIDDEN");

  const input = updateWorkOrderStatusSchema.parse(raw);
  const db = getDb();

  const woData = await db.query.workOrders.findFirst({ where: eq(workOrders.id, input.workOrderId) });
  if (!woData || woData.orgId !== orgId) throw new Error("Work order not found");

  const fromStatus = woData.status;

  const [wo] = await db.update(workOrders)
    .set({
      status: input.status,
      actualHours: input.actualHours !== undefined ? input.actualHours.toString() : woData.actualHours,
      failureReason: input.status === 'failed' ? (input.failureReason || null) : woData.failureReason
    })
    .where(eq(workOrders.id, input.workOrderId))
    .returning();

  let eventType = "status_change";
  if (input.status === "failed") eventType = "incident";

  let msg = input.message || `Status updated to ${input.status}`;
  if (input.status === "failed" && input.failureReason) {
    msg += ` - Reason: ${input.failureReason}`;
  }

  await db.insert(workOrderEvents).values({
    workOrderId: wo.id,
    actorUserId: user.id,
    type: eventType,
    message: msg,
    fromStatus,
    toStatus: input.status,
  });

  // Automatically update printer status if assigned
  if (wo.printerId) {
    if (input.status === "printing") {
      await db.update(printers).set({ status: "in_use" }).where(eq(printers.id, wo.printerId));
    } else if (["done", "failed", "paused", "qc"].includes(input.status)) {
      await db.update(printers).set({ status: "available" }).where(eq(printers.id, wo.printerId));
    }
  }

  return wo;
}
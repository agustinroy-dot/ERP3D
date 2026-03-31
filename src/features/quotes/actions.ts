"use server";

import { createQuoteSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, quotes, quoteItems } from "@/db/schema";
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

async function generateNextQuoteNumber(orgId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ maxNumber: max(quotes.quoteNumber) })
    .from(quotes)
    .where(eq(quotes.orgId, orgId));
  const currentMax = result[0]?.maxNumber ?? 0;
  return currentMax + 1;
}

export async function createQuoteAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "quotes:write")) throw new Error("FORBIDDEN");

  const input = createQuoteSchema.parse(raw);

  if (!input.customerId && !input.leadId) {
    throw new Error("A quote must be linked to a customer or lead");
  }

  const db = getDb();
  const quoteNumber = await generateNextQuoteNumber(orgId);

  // Calculate totals
  let subtotal = 0;
  let estimatedCost = 0;

  for (const item of input.items) {
    subtotal += Number(item.priceFinal) * item.quantity;
    estimatedCost += Number(item.costEstimated) * item.quantity;
  }

  const margin = subtotal - estimatedCost;

  const validUntil = input.validUntil ? new Date(input.validUntil) : null;

  // Insert Quote
  const [quote] = await db.insert(quotes).values({
    orgId,
    quoteNumber,
    customerId: input.customerId || null,
    leadId: input.leadId || null,
    status: "draft",
    validUntil,
    subtotal: subtotal.toString(),
    margin: margin.toString(),
    total: subtotal.toString(), // Simplified for now (no tax)
    notes: input.notes || null,
  }).returning();

  // Insert Items
  const itemsToInsert = input.items.map(item => ({
    quoteId: quote.id,
    name: item.name,
    technology: item.technology,
    color: item.color || null,
    materialId: item.materialId || null,
    quantity: item.quantity,
    estimatedMinutes: item.estimatedMinutes,
    costEstimated: item.costEstimated.toString(),
    priceFinal: item.priceFinal.toString(),
  }));

  await db.insert(quoteItems).values(itemsToInsert);

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "quote_created",
    entityType: "quote",
    entityId: quote.id,
    summary: `Quotation Q-${quote.quoteNumber} created`
  });

  return quote;
}

export async function updateQuoteStatusAction(quoteId: string, status: "sent" | "approved" | "rejected") {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "quotes:write")) throw new Error("FORBIDDEN");

  const db = getDb();
  const [quote] = await db.update(quotes)
    .set({ status })
    .where(eq(quotes.id, quoteId))
    .returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "quote_status_updated",
    entityType: "quote",
    entityId: quoteId,
    summary: `Quotation Q-${quote.quoteNumber} marked as ${status}`
  });
}

export async function convertQuoteToOrderAction(quoteId: string) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "orders:write")) throw new Error("FORBIDDEN");

  const db = getDb();

  // Need to import order stuff here to avoid circular dep if any, or just use db
  const { orders, orderItems } = await import("@/db/schema");

  const quoteResult = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId)
  });

  if (!quoteResult || quoteResult.orgId !== orgId) throw new Error("Quote not found");
  if (quoteResult.status !== "approved") throw new Error("Quote must be approved to convert to order");
  if (!quoteResult.customerId) throw new Error("Quote must be linked to a customer to convert to order");

  const itemsResult = await db.query.quoteItems.findMany({
    where: eq(quoteItems.quoteId, quoteId)
  });

  const result = await db.select({ maxNumber: max(orders.orderNumber) }).from(orders).where(eq(orders.orgId, orgId));
  const currentMax = result[0]?.maxNumber ?? 0;
  const orderNumber = currentMax + 1;

  const [order] = await db.insert(orders).values({
    orgId,
    orderNumber,
    customerId: quoteResult.customerId,
    quoteId: quoteResult.id,
    status: "pending",
    notes: quoteResult.notes || null,
  }).returning();

  const itemsToInsert = itemsResult.map(item => ({
    orderId: order.id,
    name: item.name,
    technology: item.technology,
    color: item.color || null,
    materialId: item.materialId || null,
    quantity: item.quantity,
    unitPrice: item.priceFinal,
  }));

  await db.insert(orderItems).values(itemsToInsert);

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "order_created_from_quote",
    entityType: "order",
    entityId: order.id,
    summary: `Order #${order.orderNumber} created from Quotation Q-${quoteResult.quoteNumber}`,
    action: "CREATED_FROM_QUOTE",
    metadata: {
      quoteId: quoteResult.id
    }
  });

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "quote_converted",
    entityType: "quote",
    entityId: quoteResult.id,
    summary: `Quotation Q-${quoteResult.quoteNumber} converted to Order #${order.orderNumber}`,
    action: "CONVERTED_TO_ORDER",
    metadata: {
      orderId: order.id
    }
  });

  return order;
}

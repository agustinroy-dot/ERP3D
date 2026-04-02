"use server";

import { createQuoteSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, quotes, quoteItems, quoteItemCosts } from "@/db/schema";
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

    // Support advanced costing if costs exist
    if (item.costs && item.costs.length > 0) {
      for (const cost of item.costs) {
         estimatedCost += (Number(cost.unitCost) * Number(cost.quantity)) * item.quantity;
      }
    } else {
       // fallback for old costEstimated mapping
       estimatedCost += 0; // The old form used costEstimated, but we removed it. Assume 0 if no costs array
    }
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

  // Insert Items and their costs
  for (const item of input.items) {
      let itemEstimatedCost = 0;
      if (item.costs && item.costs.length > 0) {
         for (const cost of item.costs) {
            itemEstimatedCost += Number(cost.unitCost) * Number(cost.quantity);
         }
      }

      const [insertedItem] = await db.insert(quoteItems).values({
        quoteId: quote.id,
        name: item.name,
        technology: item.technology,
        color: item.color || null,
        materialId: item.materialId || null,
        quantity: item.quantity,
        estimatedMinutes: item.estimatedMinutes,
        costEstimated: itemEstimatedCost.toString(),
        priceFinal: item.priceFinal.toString(),
      }).returning();

      if (item.costs && item.costs.length > 0) {
         const costsToInsert = item.costs.map(c => ({
            quoteItemId: insertedItem.id,
            type: c.type,
            description: c.description || null,
            quantity: c.quantity.toString(),
            unitCost: c.unitCost.toString(),
            totalCost: (Number(c.quantity) * Number(c.unitCost)).toString()
         }));
         await db.insert(quoteItemCosts).values(costsToInsert);
      }
  }

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

  const { orders, orderItems, orderItemCosts } = await import("@/db/schema");

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

  for (const item of itemsResult) {
      const [insertedOrderItem] = await db.insert(orderItems).values({
          orderId: order.id,
          name: item.name,
          technology: item.technology,
          color: item.color || null,
          materialId: item.materialId || null,
          quantity: item.quantity,
          unitPrice: item.priceFinal,
      }).returning();

      const itemCosts = await db.query.quoteItemCosts.findMany({
          where: eq(quoteItemCosts.quoteItemId, item.id)
      });

      if (itemCosts.length > 0) {
          const orderItemCostsToInsert = itemCosts.map(c => ({
              orderItemId: insertedOrderItem.id,
              type: c.type,
              description: c.description,
              quantity: c.quantity,
              unitCost: c.unitCost,
              totalCost: c.totalCost
          }));
          await db.insert(orderItemCosts).values(orderItemCostsToInsert);
      }
  }

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

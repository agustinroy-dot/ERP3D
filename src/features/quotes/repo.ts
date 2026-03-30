import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { quotes, quoteItems, customers, leads } from "@/db/schema";

export async function listQuotes(orgId: string) {
  const db = getDb();
  return db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      total: quotes.total,
      createdAt: quotes.createdAt,
      customerName: customers.name,
      leadName: leads.name,
    })
    .from(quotes)
    .leftJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .where(eq(quotes.orgId, orgId))
    .orderBy(desc(quotes.quoteNumber))
    .limit(100);
}

export async function getQuoteDetail(orgId: string, quoteId: string) {
  const db = getDb();

  const quoteData = await db
    .select({
      quote: quotes,
      customerName: customers.name,
      leadName: leads.name
    })
    .from(quotes)
    .leftJoin(customers, eq(quotes.customerId, customers.id))
    .leftJoin(leads, eq(quotes.leadId, leads.id))
    .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
    .limit(1);

  if (!quoteData || quoteData.length === 0) return null;

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, quoteId));

  return { ...quoteData[0], items };
}
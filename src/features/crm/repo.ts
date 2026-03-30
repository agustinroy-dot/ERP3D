import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { customers, leads } from "@/db/schema";

export async function listCustomers(orgId: string) {
  const db = getDb();
  return db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, orgId), isNull(customers.deletedAt)))
    .orderBy(desc(customers.createdAt))
    .limit(100);
}

export async function insertCustomer(orgId: string, input: { name: string; taxId?: string; email?: string; phone?: string; address?: string; isCompany: boolean; }) {
  const db = getDb();
  const [row] = await db
    .insert(customers)
    .values({ orgId, ...input })
    .returning();
  return row;
}

export async function getLeadById(orgId: string, leadId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)));
  return row;
}

export async function getCustomerById(orgId: string, customerId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.orgId, orgId), eq(customers.id, customerId)));
  return row;
}

export async function listLeads(orgId: string) {
  const db = getDb();
  return db
    .select()
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .orderBy(desc(leads.createdAt))
    .limit(100);
}

export async function insertLead(orgId: string, input: { name: string; email?: string; phone?: string; source?: string; }) {
  const db = getDb();
  const [row] = await db
    .insert(leads)
    .values({ orgId, ...input })
    .returning();
  return row;
}
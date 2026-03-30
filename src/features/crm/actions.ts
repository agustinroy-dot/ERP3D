"use server";

import { createCustomerSchema, createLeadSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { insertCustomer, insertLead } from "./repo";
import { customers, leads } from "@/db/schema";
import { can, type Role } from "@/lib/auth/permissions";
import { writeActivity } from "@/services/activity/write-activity";

async function requireOrgContext(userId: string) {
  const db = getDb();
  // MVP: one-org-per-user, or pick "current org" later
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, userId)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

export async function createCustomerAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "crm:write")) throw new Error("FORBIDDEN");

  const input = createCustomerSchema.parse(raw);
  const customer = await insertCustomer(orgId, {
    name: input.name,
    taxId: input.taxId || undefined,
    email: input.email || undefined,
    phone: input.phone || undefined,
    address: input.address || undefined,
    isCompany: input.isCompany
  });

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "customer_created",
    entityType: "customer",
    entityId: customer.id,
    summary: `Customer created: ${customer.name}`
  });

  return customer;
}

export async function createLeadAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "crm:write")) throw new Error("FORBIDDEN");

  const input = createLeadSchema.parse(raw);
  const lead = await insertLead(orgId, {
    name: input.name,
    email: input.email || undefined,
    phone: input.phone || undefined,
    source: input.source || undefined
  });

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "lead_created",
    entityType: "lead",
    entityId: lead.id,
    summary: `Lead created: ${lead.name}`
  });

  return lead;
}

export async function convertLeadToCustomerAction(leadId: string) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "crm:write")) throw new Error("FORBIDDEN");

  const db = getDb();

  // Get lead
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId)
  });

  if (!lead || lead.orgId !== orgId) throw new Error("Lead not found");
  if (lead.status === "converted") throw new Error("Lead already converted");

  // Create customer
  const [customer] = await db.insert(customers).values({
    orgId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    isCompany: false, // Defaulting to false, could be updated later
  }).returning();

  // Update lead
  await db.update(leads)
    .set({
      status: "converted",
      convertedCustomerId: customer.id
    })
    .where(eq(leads.id, leadId));

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "lead_converted",
    entityType: "lead",
    entityId: lead.id,
    summary: `Lead ${lead.name} converted to customer`
  });

  return customer;
}
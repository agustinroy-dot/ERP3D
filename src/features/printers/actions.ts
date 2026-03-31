"use server";

import { printerSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, printers } from "@/db/schema";
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

export async function createPrinterAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "printers:write")) throw new Error("FORBIDDEN");

  const input = printerSchema.parse(raw);
  const db = getDb();

  const [printer] = await db.insert(printers).values({
    orgId,
    name: input.name,
    model: input.model || null,
    technology: input.technology,
    status: input.status,
    notes: input.notes || null,
  }).returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "printer_created",
    entityType: "printer",
    entityId: printer.id,
    summary: `Printer ${printer.name} created`,
    action: "PRINTER_CREATED"
  });

  return printer;
}

export async function updatePrinterAction(printerId: string, raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "printers:write")) throw new Error("FORBIDDEN");

  const input = printerSchema.parse(raw);
  const db = getDb();

  const [printer] = await db.update(printers)
    .set({
      name: input.name,
      model: input.model || null,
      technology: input.technology,
      status: input.status,
      notes: input.notes || null,
      updatedAt: new Date()
    })
    .where(eq(printers.id, printerId))
    .returning();

  await writeActivity({
    orgId,
    actorUserId: user.id,
    type: "printer_updated",
    entityType: "printer",
    entityId: printer.id,
    summary: `Printer ${printer.name} updated`,
    action: "PRINTER_UPDATED"
  });

  return printer;
}

"use server";

import { uploadAttachmentSchema } from "./schemas";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, attachments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";

async function requireOrgContext(userId: string) {
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, userId)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

export async function saveAttachmentMetadataAction(raw: unknown) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "attachments:write") && !can(role, "attachments:*")) throw new Error("FORBIDDEN");

  const input = uploadAttachmentSchema.parse(raw);
  const db = getDb();

  const [attachment] = await db.insert(attachments).values({
    orgId,
    entityType: input.entityType,
    entityId: input.entityId,
    bucket: "files", // Using a default private bucket
    path: input.path,
    fileName: input.fileName,
    mimeType: input.mimeType || null,
    sizeBytes: input.sizeBytes || null,
    uploadedBy: user.id
  }).returning();

  return attachment;
}

export async function listAttachmentsForEntityAction(entityType: string, entityId: string) {
  const user = await requireUser();
  const { orgId, role } = await requireOrgContext(user.id);

  if (!can(role, "attachments:read") && !can(role, "attachments:*")) throw new Error("FORBIDDEN");

  const db = getDb();
  const files = await db.select()
    .from(attachments)
    .where(and(
      eq(attachments.orgId, orgId),
      eq(attachments.entityType, entityType),
      eq(attachments.entityId, entityId)
    ));

  return files;
}
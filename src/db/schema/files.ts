import { pgTable, text, timestamp, uuid, index, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs, profiles } from "./auth";

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    entityType: text("entity_type").notNull(), // customer|lead|quote|order|work_order|delivery|payment
    entityId: uuid("entity_id").notNull(),

    bucket: text("bucket").notNull(),
    path: text("path").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),

    uploadedBy: uuid("uploaded_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("attachments_org_idx").on(t.orgId),
    entityIdx: index("attachments_entity_idx").on(t.entityType, t.entityId)
  })
);
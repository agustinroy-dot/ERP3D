import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs, profiles } from "./auth";

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),
    actorUserId: uuid("actor_user_id").references(() => profiles.id),

    type: text("type").notNull(), // lead_created | quote_sent | order_created | work_order_status | payment_recorded ...
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    summary: text("summary").notNull(),
    action: text("action"),
    metadata: text("metadata"), // Storing stringified JSON
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("activity_events_org_idx").on(t.orgId),
    createdIdx: index("activity_events_created_idx").on(t.createdAt)
  })
);
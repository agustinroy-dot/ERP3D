import { pgTable, text, timestamp, uuid, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles, orgs } from "./auth";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),
    userId: uuid("user_id").notNull().references(() => profiles.id),

    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(), // info, success, warning, error
    targetUrl: text("target_url"),

    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.isRead)
  })
);

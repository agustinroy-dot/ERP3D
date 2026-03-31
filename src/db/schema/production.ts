import { pgEnum, pgTable, text, timestamp, uuid, integer, numeric, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs, profiles } from "./auth";
import { orders } from "./sales";
import { materials } from "./inventory";

export const printerStatusEnum = pgEnum("printer_status", ["available", "in_use", "maintenance", "offline"]);
export const workOrderStatusEnum = pgEnum("work_order_status", ["pending", "assigned", "printing", "postprocess", "qc", "done", "paused", "failed"]);

export const printers = pgTable(
  "printers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    name: text("name").notNull(),
    model: text("model"),
    technology: text("technology").notNull(), // FDM/SLA...
    status: printerStatusEnum("status").notNull().default("available"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("printers_org_idx").on(t.orgId),
    statusIdx: index("printers_status_idx").on(t.status)
  })
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),
    orderId: uuid("order_id").notNull().references(() => orders.id),

    workOrderNumber: integer("work_order_number").notNull(),

    printerId: uuid("printer_id").references(() => printers.id),
    operatorId: uuid("operator_id").references(() => profiles.id),

    materialId: uuid("material_id").references(() => materials.id),
    color: text("color"),

    quantity: integer("quantity").notNull().default(1),
    estimatedHours: numeric("estimated_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    actualHours: numeric("actual_hours", { precision: 8, scale: 2 }).notNull().default("0"),
    materialConsumed: numeric("material_consumed", { precision: 14, scale: 3 }).notNull().default("0"),

    status: workOrderStatusEnum("status").notNull().default("pending"),
    priority: text("priority").notNull().default("normal"), // Using text to match priorityEnum definition locally, actually we should use priorityEnum
    failureReason: text("failure_reason"),
    technicalNotes: text("technical_notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("work_orders_org_idx").on(t.orgId),
    orderIdx: index("work_orders_order_idx").on(t.orderId),
    statusIdx: index("work_orders_status_idx").on(t.status)
  })
);

export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workOrderId: uuid("work_order_id").notNull().references(() => workOrders.id),
    actorUserId: uuid("actor_user_id").references(() => profiles.id),

    type: text("type").notNull(), // status_change | incident | note | consumption | qc
    message: text("message"),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    workOrderIdx: index("work_order_events_work_order_idx").on(t.workOrderId)
  })
);
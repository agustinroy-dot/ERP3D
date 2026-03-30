import { pgEnum, pgTable, text, timestamp, uuid, integer, numeric, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs } from "./auth";
import { customers, leads } from "./crm";
import { materials } from "./inventory";

export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "approved", "rejected", "expired"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "in_production", "qc", "ready_for_delivery", "delivered", "canceled"]);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    quoteNumber: integer("quote_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    leadId: uuid("lead_id").references(() => leads.id),

    status: quoteStatusEnum("status").notNull().default("draft"),
    validUntil: timestamp("valid_until", { withTimezone: true }),

    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    margin: numeric("margin", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("quotes_org_idx").on(t.orgId),
    numberIdx: index("quotes_number_idx").on(t.quoteNumber),
    statusIdx: index("quotes_status_idx").on(t.status)
  })
);

export const quoteItems = pgTable(
  "quote_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    quoteId: uuid("quote_id").notNull().references(() => quotes.id),
    name: text("name").notNull(),

    technology: text("technology").notNull(), // FDM/SLA/SLS...
    color: text("color"),
    materialId: uuid("material_id").references(() => materials.id),

    quantity: integer("quantity").notNull().default(1),
    estimatedMinutes: integer("estimated_minutes").notNull().default(0),

    costEstimated: numeric("cost_estimated", { precision: 12, scale: 2 }).notNull().default("0"),
    priceFinal: numeric("price_final", { precision: 12, scale: 2 }).notNull().default("0")
  },
  (t) => ({
    quoteIdx: index("quote_items_quote_idx").on(t.quoteId)
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    orderNumber: integer("order_number").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    quoteId: uuid("quote_id").references(() => quotes.id),

    status: orderStatusEnum("status").notNull().default("pending"),
    priority: text("priority").notNull().default("normal"),
    promisedAt: timestamp("promised_at", { withTimezone: true }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("orders_org_idx").on(t.orgId),
    numberIdx: index("orders_number_idx").on(t.orderNumber),
    statusIdx: index("orders_status_idx").on(t.status)
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id").notNull().references(() => orders.id),

    name: text("name").notNull(),
    technology: text("technology").notNull(),
    color: text("color"),
    materialId: uuid("material_id").references(() => materials.id),

    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0")
  },
  (t) => ({
    orderIdx: index("order_items_order_idx").on(t.orderId)
  })
);
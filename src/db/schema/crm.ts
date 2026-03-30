import { pgEnum, pgTable, text, timestamp, uuid, index, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs } from "./auth";

export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "unqualified", "converted", "lost"]);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    name: text("name").notNull(),
    taxId: text("tax_id"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),

    isCompany: boolean("is_company").notNull().default(false),
    status: text("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true })
  },
  (t) => ({
    orgIdx: index("customers_org_idx").on(t.orgId),
    nameIdx: index("customers_name_idx").on(t.name)
  })
);

export const customerContacts = pgTable(
  "customer_contacts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    customerIdx: index("customer_contacts_customer_idx").on(t.customerId)
  })
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    source: text("source"),
    status: leadStatusEnum("status").notNull().default("new"),

    convertedCustomerId: uuid("converted_customer_id").references(() => customers.id),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("leads_org_idx").on(t.orgId),
    statusIdx: index("leads_status_idx").on(t.status)
  })
);
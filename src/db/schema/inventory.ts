import { pgTable, text, timestamp, uuid, numeric, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orgs } from "./auth";

import { pgEnum } from "drizzle-orm/pg-core";
import { profiles } from "./auth";

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", ["in", "out", "adjust"]);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid("org_id").notNull().references(() => orgs.id),

    name: text("name").notNull(),
    category: text("category").notNull(), // filament/resin/spare/postprocess/packaging
    unit: text("unit").notNull(),         // g/ml/unit
    onHandQty: numeric("on_hand_qty", { precision: 14, scale: 3 }).notNull().default("0"),
    minQty: numeric("min_qty", { precision: 14, scale: 3 }).notNull().default("0"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orgIdx: index("materials_org_idx").on(t.orgId),
    nameIdx: index("materials_name_idx").on(t.name)
  })
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    materialId: uuid("material_id").notNull().references(() => materials.id),
    type: inventoryMovementTypeEnum("type").notNull(),
    qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),

    referenceType: text("reference_type"), // work_order | purchase | adjustment
    referenceId: uuid("reference_id"),

    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    materialIdx: index("inventory_movements_material_idx").on(t.materialId)
  })
);
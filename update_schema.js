const fs = require('fs');
let content = fs.readFileSync('src/db/schema/sales.ts', 'utf8');

// Add quote_item_costs and order_item_costs tables

const newTables = `

export const quoteItemCosts = pgTable(
  "quote_item_costs",
  {
    id: uuid("id").primaryKey().default(sql\`gen_random_uuid()\`),
    quoteItemId: uuid("quote_item_id").notNull().references(() => quoteItems.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // material, labor, postprocessing, etc.
    description: text("description"),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0")
  },
  (t) => ({
    itemIdx: index("quote_item_costs_item_idx").on(t.quoteItemId)
  })
);

export const orderItemCosts = pgTable(
  "order_item_costs",
  {
    id: uuid("id").primaryKey().default(sql\`gen_random_uuid()\`),
    orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // material, labor, postprocessing, etc.
    description: text("description"),
    quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull().default("1"),
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0")
  },
  (t) => ({
    itemIdx: index("order_item_costs_item_idx").on(t.orderItemId)
  })
);
`;

content = content + newTables;

fs.writeFileSync('src/db/schema/sales.ts', content);

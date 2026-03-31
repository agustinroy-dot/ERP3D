import { pgEnum, pgTable, text, timestamp, uuid, index, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orders } from "./sales";

export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "coordinated", "dispatched", "delivered", "failed"]);
export const deliveryTypeEnum = pgEnum("delivery_type", ["pickup", "shipping", "courier"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "partial", "paid", "overdue"]);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id").notNull().references(() => orders.id),

    type: deliveryTypeEnum("type").notNull(), // pickup/shipping/courier
    status: deliveryStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orderIdx: index("deliveries_order_idx").on(t.orderId),
    statusIdx: index("deliveries_status_idx").on(t.status)
  })
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id").notNull().references(() => orders.id),

    status: paymentStatusEnum("status").notNull().default("pending"),
    method: text("method").notNull(), // cash/bank/transfer/card/etc
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    reference: text("reference"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (t) => ({
    orderIdx: index("payments_order_idx").on(t.orderId),
    statusIdx: index("payments_status_idx").on(t.status)
  })
);
import { z } from "zod";

export const orderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  technology: z.string().min(1, "Technology is required"),
  color: z.string().optional(),
  materialId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid().min(1, "Customer is required"),
  quoteId: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  promisedAt: z.string().optional().or(z.literal("")), // YYYY-MM-DD
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
import { z } from "zod";

export const createDeliverySchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(["pickup", "shipping", "courier"]),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(["pending", "coordinated", "dispatched", "delivered", "failed"]),
});
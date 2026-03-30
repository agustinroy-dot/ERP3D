import { z } from "zod";

export const createWorkOrderSchema = z.object({
  orderId: z.string().uuid("Order ID is required"),
  printerId: z.string().uuid().optional().or(z.literal("")),
  operatorId: z.string().uuid().optional().or(z.literal("")),
  materialId: z.string().uuid().optional().or(z.literal("")),
  color: z.string().optional(),
  quantity: z.coerce.number().min(1, "Must be at least 1"),
  estimatedHours: z.coerce.number().min(0, "Must be at least 0"),
  technicalNotes: z.string().optional(),
});

export const updateWorkOrderStatusSchema = z.object({
  workOrderId: z.string().uuid(),
  status: z.enum(["pending", "assigned", "printing", "postprocess", "qc", "done", "paused", "failed"]),
  actualHours: z.coerce.number().min(0).optional(),
  failureReason: z.string().optional(),
  message: z.string().optional(), // For the event log
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>;
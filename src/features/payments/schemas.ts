import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
import { z } from "zod";

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  technology: z.string().min(1, "Technology is required"),
  color: z.string().optional(),
  materialId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().min(1),
  estimatedMinutes: z.coerce.number().min(0),
  costEstimated: z.coerce.number().min(0),
  priceFinal: z.coerce.number().min(0),
});

export const createQuoteSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")), // YYYY-MM-DD
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "At least one item is required"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
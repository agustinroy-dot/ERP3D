import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  taxId: z.string().trim().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  isCompany: z.boolean()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  source: z.string().trim().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
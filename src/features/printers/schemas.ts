import { z } from "zod";

export const printerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model: z.string().optional(),
  technology: z.string().min(1, "Technology is required"),
  status: z.enum(["available", "in_use", "maintenance", "offline"]),
  notes: z.string().optional()
});

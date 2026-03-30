import { z } from "zod";

export const createMaterialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  onHandQty: z.coerce.number().min(0, "Cannot be negative"),
  minQty: z.coerce.number().min(0, "Cannot be negative"),
});

export const adjustInventorySchema = z.object({
  materialId: z.string().uuid(),
  type: z.enum(["in", "out", "adjust"]),
  qty: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0).optional(),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
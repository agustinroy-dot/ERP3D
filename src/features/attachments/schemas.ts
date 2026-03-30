import { z } from "zod";

export const uploadAttachmentSchema = z.object({
  entityType: z.enum(["customer", "lead", "quote", "order", "work_order", "delivery", "payment"]),
  entityId: z.string().uuid(),
  path: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().min(0).optional(),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
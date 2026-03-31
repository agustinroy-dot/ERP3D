"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { createDeliverySchema } from "../schemas";
import { createDeliveryAction } from "../actions";
import { z } from "zod";
import { X } from "lucide-react";

type FormValues = z.infer<typeof createDeliverySchema>;

export function CreateDeliveryDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(createDeliverySchema),
    defaultValues: {
      orderId,
      type: "shipping",
      scheduledAt: "",
      notes: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError("");
    try {
      await createDeliveryAction(data);
      setOpen(false);
      reset();
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create delivery");
      } else {
        setError("Failed to create delivery");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="text-zinc-700">Create Delivery</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-zinc-900">Create Delivery</Dialog.Title>
            <Dialog.Close className="text-zinc-400 hover:text-zinc-600">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
              <select {...register("type")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="pickup">Pickup</option>
                <option value="shipping">Shipping</option>
                <option value="courier">Courier</option>
              </select>
              {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Scheduled Date (Optional)</label>
              <input type="date" {...register("scheduledAt")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Coordination Notes (Optional)</label>
              <textarea {...register("notes")} rows={3} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Leave package at front desk..."></textarea>
            </div>

            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Create Delivery"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

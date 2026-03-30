"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustInventoryAction } from "@/features/inventory/actions";
import { adjustInventorySchema } from "@/features/inventory/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";

export function AdjustInventoryDialog({ materialId, currentQty, unit }: { materialId: string, currentQty: number, unit: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.input<typeof adjustInventorySchema>>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      materialId,
      type: "adjust",
      qty: currentQty,
      unitCost: 0,
    }
  });

  const onSubmit = (values: z.input<typeof adjustInventorySchema>) => {
    startTransition(async () => {
      try {
        setError(null);
        await adjustInventoryAction(values);
        setIsOpen(false);
        router.refresh();
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to adjust inventory");
        }
      }
    });
  };

  if (!isOpen) {
    return <Button onClick={() => setIsOpen(true)}>Adjust Stock</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white p-6 shadow-xl relative">
        <h2 className="text-xl font-bold mb-4">Adjust Inventory</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="adjust">Set exact new total</option>
                      <option value="in">Add to stock (Inbound)</option>
                      <option value="out">Remove from stock (Consume/Waste)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity ({unit})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost ($) <span className="text-zinc-400 font-normal ml-1">Optional</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Confirm Adjustment"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
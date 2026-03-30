"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createQuoteSchema } from "@/features/quotes/schemas";
import { z } from "zod";
import { createQuoteAction } from "@/features/quotes/actions";
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
import { Trash2, Plus } from "lucide-react";

export default function NewQuotePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.input<typeof createQuoteSchema>>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      customerId: "",
      leadId: "",
      validUntil: "",
      notes: "",
      items: [
        {
          name: "",
          technology: "",
          color: "",
          materialId: "",
          quantity: 1 as unknown as number,
          estimatedMinutes: 0 as unknown as number,
          costEstimated: 0 as unknown as number,
          priceFinal: 0 as unknown as number,
        } as unknown as z.input<typeof createQuoteSchema>["items"][0]
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  async function onSubmit(values: z.input<typeof createQuoteSchema>) {
    try {
      setError(null);
      await createQuoteAction(values);
      router.push("/quotes");
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to create quote");
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">New Quotation</h1>
        <p className="mt-1 text-sm text-zinc-600">Create a multi-item estimate.</p>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer ID (UUID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Leave blank if lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead ID (UUID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Leave blank if customer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Internal notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 border-t border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Quote Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", technology: "", color: "", materialId: "", quantity: 1 as unknown as number, estimatedMinutes: 0 as unknown as number, costEstimated: 0 as unknown as number, priceFinal: 0 as unknown as number } as unknown as z.input<typeof createQuoteSchema>["items"][0])}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative rounded-lg border border-zinc-200 bg-white/50 p-4 shadow-sm group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Item Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Custom 3D Print Part" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.technology`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Technology *</FormLabel>
                            <FormControl>
                              <Input placeholder="FDM, SLA, SLS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.color`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Color</FormLabel>
                            <FormControl>
                              <Input placeholder="Black" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} value={field.value as string | number} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.estimatedMinutes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Mins</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} value={field.value as string | number} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.costEstimated`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Cost *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} value={field.value as string | number} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.priceFinal`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Final Price *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} value={field.value as string | number} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Create Quotation"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
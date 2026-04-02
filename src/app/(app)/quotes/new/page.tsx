"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuoteSchema } from "@/features/quotes/schemas";
import { createQuoteAction } from "@/features/quotes/actions";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Plus, Trash2, Calculator } from "lucide-react";

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
          quantity: 1,
          estimatedMinutes: 0,
          priceFinal: 0,
          costs: [
             { type: "material", description: "", quantity: 1, unitCost: 0 }
          ]
        }
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
        <p className="mt-1 text-sm text-zinc-600">Create a quote with advanced cost structure.</p>
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
                  onClick={() => append({ name: "", technology: "", color: "", materialId: "", quantity: 1, estimatedMinutes: 0, priceFinal: 0, costs: [{ type: "material", description: "", quantity: 1, unitCost: 0 }] })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="space-y-6">
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

                    {/* Nested Cost Components List */}
                    <div className="mt-4 mb-6 bg-zinc-50/50 p-4 rounded-md border border-zinc-100">
                        <QuoteItemCostFields form={form} itemIndex={index} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
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
                        name={`items.${index}.priceFinal`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Final Price (Per Item) *</FormLabel>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuoteItemCostFields({ form, itemIndex }: { form: any, itemIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `items.${itemIndex}.costs`
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
         <h4 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
           <Calculator className="h-4 w-4" /> Cost Components
         </h4>
         <Button
           type="button"
           variant="ghost"
           size="sm"
           onClick={() => append({ type: "labor", description: "", quantity: 1, unitCost: 0 })}
         >
           <Plus className="mr-1 h-3 w-3" /> Add Cost
         </Button>
      </div>

      <div className="space-y-3">
         {fields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-start">
               <FormField
                  control={form.control}
                  name={`items.${itemIndex}.costs.${idx}.type`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Type (material, labor...)" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${itemIndex}.costs.${idx}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Description" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${itemIndex}.costs.${idx}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="Qty" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${itemIndex}.costs.${idx}.unitCost`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="Unit Cost" {...field} className="h-8 text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-500"
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
            </div>
         ))}
      </div>
    </div>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { printerSchema } from "../schemas";
import { createPrinterAction, updatePrinterAction } from "../actions";
import { z } from "zod";
import { Button } from "@/components/ui/button";

type FormValues = z.infer<typeof printerSchema>;

interface PrinterFormProps {
  initialData?: FormValues & { id: string };
}

export function PrinterForm({ initialData }: PrinterFormProps) {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: initialData || {
      name: "",
      model: "",
      technology: "FDM",
      status: "available",
      notes: ""
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (initialData) {
        await updatePrinterAction(initialData.id, data);
        router.push(`/printers/${initialData.id}`);
      } else {
        const printer = await createPrinterAction(data);
        router.push(`/printers/${printer.id}`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save printer");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
          <input {...register("name")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Prusa MK3S+ #1" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Model</label>
          <input {...register("model")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. MK3S+" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Technology *</label>
          <select {...register("technology")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="FDM">FDM</option>
            <option value="SLA">SLA</option>
            <option value="SLS">SLS</option>
            <option value="Other">Other</option>
          </select>
          {errors.technology && <p className="mt-1 text-xs text-red-600">{errors.technology.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status *</label>
          <select {...register("status")} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Maintenance Notes / Logs</label>
        <textarea {...register("notes")} rows={4} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Log any maintenance or issues here..."></textarea>
      </div>

      <div className="flex gap-3 pt-4 border-t border-zinc-200">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? "Saving..." : initialData ? "Update Printer" : "Create Printer"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateWorkOrderStatusAction } from "@/features/production/actions";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function WorkOrderQuickActions({ workOrderId, currentStatus, actualHours }: { workOrderId: string, currentStatus: string, actualHours: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [materialConsumed, setMaterialConsumed] = useState("0");

  const updateStatus = async (status: string) => {
    startTransition(async () => {
      try {
        setError(null);
        await updateWorkOrderStatusAction({ workOrderId, status, actualHours });
        router.refresh();
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to update status");
        }
      }
    });
  };

  const handleFail = async () => {
    const reason = window.prompt("Enter failure reason:");
    if (reason === null) return;

    startTransition(async () => {
      try {
        setError(null);
        await updateWorkOrderStatusAction({ workOrderId, status: "failed", actualHours, failureReason: reason });
        router.refresh();
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to update status");
        }
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {error && <span className="text-sm text-red-500 mr-2">{error}</span>}

      {currentStatus === "pending" && (
        <Button disabled={isPending} onClick={() => updateStatus("assigned")}>Assign Job</Button>
      )}

      {(currentStatus === "pending" || currentStatus === "assigned" || currentStatus === "paused") && (
        <Button disabled={isPending} onClick={() => updateStatus("printing")} className="bg-indigo-600 hover:bg-indigo-700">Start Printing</Button>
      )}

      {currentStatus === "printing" && (
        <>
          <Button disabled={isPending} onClick={() => updateStatus("postprocess")} className="bg-purple-600 hover:bg-purple-700">Move to Post-process</Button>
          <Button disabled={isPending} onClick={() => updateStatus("paused")} variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">Pause Job</Button>
        </>
      )}

      {currentStatus === "postprocess" && (
        <Button disabled={isPending} onClick={() => updateStatus("qc")} className="bg-amber-600 hover:bg-amber-700">Send to QC</Button>
      )}

      {currentStatus === "qc" && (
        <Dialog.Root open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
          <Dialog.Trigger asChild>
            <Button disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">Mark Completed</Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-lg font-semibold text-zinc-900">Complete Job</Dialog.Title>
                <Dialog.Close className="text-zinc-400 hover:text-zinc-600">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Material Consumed</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={materialConsumed}
                    onChange={(e) => setMaterialConsumed(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Enter the amount of material actually consumed (can be 0).</p>
                </div>

                {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}

                <div className="flex justify-end gap-3 pt-4">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    type="button"
                    onClick={() => {
                      const amount = parseFloat(materialConsumed);
                      if (isNaN(amount) || amount < 0) {
                        setError("Invalid material consumed amount");
                        return;
                      }
                      startTransition(async () => {
                        try {
                          setError(null);
                          await updateWorkOrderStatusAction({ workOrderId, status: "done", actualHours, materialConsumed: amount });
                          setCompleteDialogOpen(false);
                          router.refresh();
                        } catch (e: unknown) {
                          if (e instanceof Error) {
                            setError(e.message);
                          } else {
                            setError("Failed to mark completed");
                          }
                        }
                      });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isPending}
                  >
                    {isPending ? "Completing..." : "Confirm"}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {currentStatus !== "done" && currentStatus !== "failed" && (
        <Button disabled={isPending} onClick={handleFail} variant="destructive">Report Failure</Button>
      )}

      {currentStatus === "failed" && (
        <Button disabled={isPending} onClick={() => updateStatus("printing")} variant="outline">Restart Job</Button>
      )}
    </div>
  );
}
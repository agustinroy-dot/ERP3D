"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateWorkOrderStatusAction } from "@/features/production/actions";
import { Button } from "@/components/ui/button";

export function WorkOrderQuickActions({ workOrderId, currentStatus, actualHours }: { workOrderId: string, currentStatus: string, actualHours: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        <Button disabled={isPending} onClick={() => updateStatus("done")} className="bg-emerald-600 hover:bg-emerald-700">Mark Completed</Button>
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
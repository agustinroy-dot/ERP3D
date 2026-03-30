import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWorkOrderDetail } from "@/features/production/repo";
import { notFound } from "next/navigation";
import { WorkOrderStatusBadge } from "@/features/production/components/status-badge";
import { WorkOrderQuickActions } from "@/features/production/components/quick-actions";
import Link from "next/link";
import { UserCircle, Printer, Box, AlertTriangle, Clock } from "lucide-react";

export default async function JobCardPage({ params }: { params: Promise<{ workOrderId: string }> }) {
  const { workOrderId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const detail = await getWorkOrderDetail(membership.orgId, workOrderId);
  if (!detail) notFound();

  const { workOrder, orderNumber, printerName, operatorName, materialName, events } = detail;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* A. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              WO-{String(workOrder.workOrderNumber).padStart(6, '0')}
            </h1>
            <WorkOrderStatusBadge status={workOrder.status} />
          </div>
          <p className="mt-2 text-sm text-zinc-600 flex items-center gap-2">
            <span>Linked to <Link href={`/orders/${workOrder.orderId}`} className="text-blue-600 hover:underline">Order #{String(orderNumber).padStart(6, '0')}</Link></span>
            <span className="text-zinc-300">•</span>
            <span>Created {new Date(workOrder.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        {/* B. Quick Actions */}
        <WorkOrderQuickActions
          workOrderId={workOrder.id}
          currentStatus={workOrder.status}
          actualHours={Number(workOrder.actualHours)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* C. Job Details */}
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Job Specification</h2>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex items-start gap-3">
                <Box className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Material & Color</p>
                  <p className="font-medium text-zinc-900">{materialName || "Not assigned"}</p>
                  <p className="text-sm text-zinc-600">{workOrder.color || "No color specified"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 text-zinc-400 mt-0.5 flex items-center justify-center font-bold text-xs">x{workOrder.quantity}</div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Quantity</p>
                  <p className="font-medium text-zinc-900">{workOrder.quantity} Units</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Printer className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Printer</p>
                  <p className="font-medium text-zinc-900">{printerName || "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase">Operator</p>
                  <p className="font-medium text-zinc-900">{operatorName || "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 col-span-2 border-t border-zinc-100 pt-4 mt-2">
                <Clock className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div className="w-full flex justify-between items-center pr-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase">Time Tracking</p>
                    <p className="font-medium text-zinc-900">
                      Estimated: {Number(workOrder.estimatedHours).toFixed(1)}h
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-500 uppercase">Actual Hours</p>
                    <p className={`font-bold text-lg ${Number(workOrder.actualHours) > Number(workOrder.estimatedHours) ? 'text-amber-600' : 'text-zinc-900'}`}>
                      {Number(workOrder.actualHours).toFixed(1)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D. Technical Notes */}
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Technical Instructions</h2>
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-4 text-sm text-zinc-700 whitespace-pre-wrap min-h-[100px]">
              {workOrder.technicalNotes || "No specific technical instructions provided for this job."}
            </div>
          </div>

          {/* E. Failure Reason */}
          {workOrder.failureReason && (
             <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm">
               <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5" />
                 Failure Report
               </h2>
               <p className="text-sm text-red-700 bg-white/50 p-4 rounded-lg border border-red-200">
                 {workOrder.failureReason}
               </p>
             </div>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">

          {/* F. Attachments Placeholder */}
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
             <h2 className="text-sm font-semibold text-zinc-900 mb-4">Files & References</h2>
             <p className="text-xs text-zinc-500 italic">Attachments module coming next.</p>
          </div>

          {/* G. Activity Timeline */}
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {events.length === 0 ? (
                <p className="text-xs text-zinc-500">No recorded events.</p>
              ) : (
                events.map((evt) => (
                  <div key={evt.event.id} className="relative pl-6 pb-4 border-l border-zinc-200 last:border-0 last:pb-0">
                    <div className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white ${
                      evt.event.type === 'incident' ? 'bg-red-500' :
                      evt.event.toStatus === 'done' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="text-xs text-zinc-500 mb-1">
                      {new Date(evt.event.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {evt.actorName && <span className="ml-1 font-medium text-zinc-700">· {evt.actorName}</span>}
                    </div>
                    <p className="text-sm text-zinc-900 font-medium">{evt.event.message}</p>
                    {evt.event.fromStatus && evt.event.toStatus && (
                      <p className="text-xs text-zinc-500 mt-1 uppercase">
                        {evt.event.fromStatus} → {evt.event.toStatus}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
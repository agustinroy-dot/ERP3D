import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPrinterDetail } from "@/features/printers/repo";
import { notFound } from "next/navigation";
import { can, type Role } from "@/lib/auth/permissions";
import { PrinterForm } from "@/features/printers/components/printer-form";

export default async function PrinterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  if (!can(role, "printers:read")) notFound();

  const detail = await getPrinterDetail(membership.orgId, id);
  if (!detail) notFound();

  const { printer, usageHistory } = detail;
  const canUpdate = can(role, "printers:write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{printer.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Printer Details</h2>
          {canUpdate ? (
            <PrinterForm initialData={{
              id: printer.id,
              name: printer.name,
              model: printer.model || "",
              technology: printer.technology,
              status: printer.status,
              notes: printer.notes || ""
            }} />
          ) : (
            <div className="space-y-4 text-sm">
               <div className="flex justify-between">
                 <span className="text-zinc-500">Name</span>
                 <span className="font-medium">{printer.name}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-zinc-500">Model</span>
                 <span className="font-medium">{printer.model || "—"}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-zinc-500">Technology</span>
                 <span className="font-medium">{printer.technology}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-zinc-500">Status</span>
                 <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    printer.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                    printer.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                    printer.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {printer.status.replace('_', ' ')}
                  </span>
               </div>
               <div className="pt-4 border-t border-zinc-200">
                 <span className="text-zinc-500 block mb-2">Maintenance Notes</span>
                 <p className="whitespace-pre-wrap">{printer.notes || "No notes."}</p>
               </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-6">Recent Usage History</h2>

          <div className="space-y-4">
            {usageHistory.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No recent usage recorded.</p>
            ) : (
              usageHistory.map((wo) => (
                <div key={wo.id} className="flex justify-between items-center p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                  <div>
                    <a href={`/production/work-orders/${wo.id}`} className="font-medium text-blue-600 hover:underline">
                      WO-{String(wo.workOrderNumber).padStart(6, '0')}
                    </a>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(wo.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      wo.status === 'done' ? 'bg-emerald-100 text-emerald-800' :
                      wo.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-zinc-200 text-zinc-800'
                    }`}>
                      {wo.status}
                    </span>
                    <p className="text-xs font-medium text-zinc-600 mt-1">{Number(wo.actualHours)}h logged</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

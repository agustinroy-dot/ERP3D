import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMaterialDetail } from "@/features/inventory/repo";
import { notFound } from "next/navigation";
import { AdjustInventoryDialog } from "@/features/inventory/components/adjust-dialog";
import { Package, AlertCircle } from "lucide-react";
import { can, type Role } from "@/lib/auth/permissions";

export default async function MaterialDetailPage({ params }: { params: Promise<{ materialId: string }> }) {
  const { materialId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  const canAdjustInventory = can(role, "inventory:write") || can(role, "inventory:consume");

  const detail = await getMaterialDetail(membership.orgId, materialId);
  if (!detail) notFound();

  const { material, movements } = detail;
  const isLow = Number(material.onHandQty) <= Number(material.minQty);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isLow ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'}`}>
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{material.name}</h1>
              {isLow && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                  Low Stock
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600">Category: {material.category.charAt(0).toUpperCase() + material.category.slice(1)}</p>
          </div>
        </div>

        {canAdjustInventory && (
          <AdjustInventoryDialog
            materialId={material.id}
            currentQty={Number(material.onHandQty)}
            unit={material.unit}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="md:col-span-1 space-y-6">
          {/* Stock Level Card */}
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-6">Current Stock</h2>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase">On Hand</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${isLow ? 'text-red-600' : 'text-zinc-900'}`}>
                    {Number(material.onHandQty).toFixed(2)}
                  </span>
                  <span className="text-lg text-zinc-500">{material.unit}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase">Minimum Required</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-zinc-700">
                    {Number(material.minQty).toFixed(2)}
                  </span>
                  <span className="text-sm text-zinc-500">{material.unit}</span>
                </div>
              </div>

              {isLow && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-100 mt-2">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Attention Needed</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Stock is below minimum thresholds. Consider reordering soon.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Movements History */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Inventory Movements</h2>
              <p className="text-sm text-zinc-500 mt-1">Recent history of stock changes and adjustments.</p>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50 sticky top-0 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-500">Date</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Type</th>
                    <th className="px-6 py-3 font-medium text-zinc-500 text-right">Quantity ({material.unit})</th>
                    <th className="px-6 py-3 font-medium text-zinc-500">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No movement history.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.movement.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-3 text-zinc-600 whitespace-nowrap">
                          {new Date(m.movement.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            m.movement.type === 'in' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                            m.movement.type === 'out' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                            'bg-blue-50 text-blue-700 ring-blue-600/20'
                          }`}>
                            {m.movement.type === 'in' ? '+ Inbound' : m.movement.type === 'out' ? '- Outbound' : 'Adjustment'}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${
                          m.movement.type === 'in' ? 'text-emerald-600' :
                          m.movement.type === 'out' ? 'text-amber-600' :
                          'text-zinc-900'
                        }`}>
                          {m.movement.type === 'out' ? '-' : m.movement.type === 'in' ? '+' : ''}
                          {Number(m.movement.qty).toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-zinc-500">{m.actorName || "System"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
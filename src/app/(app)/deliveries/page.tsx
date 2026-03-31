import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDeliveries } from "@/features/deliveries/repo";
import { can, type Role } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";

export default async function DeliveriesPage() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  if (!can(role, "deliveries:read")) notFound();

  const deliveriesList = await getDeliveries(membership.orgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Deliveries</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-500">Order</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Type</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Scheduled At</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {deliveriesList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p>No deliveries found</p>
                </td>
              </tr>
            ) : (
              deliveriesList.map(({ delivery, order }) => (
                <tr key={delivery.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-blue-600 hover:underline">
                    <a href={`/orders/${order.id}`}>#{String(order.orderNumber).padStart(6, '0')}</a>
                  </td>
                  <td className="px-6 py-4 capitalize">{delivery.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      delivery.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      delivery.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    {delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleDateString() : 'Not Set'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/deliveries/${delivery.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">View</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

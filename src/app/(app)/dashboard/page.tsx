import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDashboardData } from "@/features/analytics/repo";
import Link from "next/link";
import { Package, AlertCircle } from "lucide-react";

async function getContext() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId };
}

export default async function DashboardPage() {
  const { orgId } = await getContext();
  const { kpis, recentOrders, recentActivity, productionSnapshot, criticalStockList } = await getDashboardData(orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">Your operational snapshot.</p>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">Active Orders</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{kpis.activeOrders}</p>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">WO in Progress</h3>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{kpis.workOrdersInProgress}</p>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">Pending Quotes</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{kpis.pendingQuotes}</p>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">New Leads</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600">{kpis.newLeads}</p>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">Critical Stock</h3>
          <p className={`mt-2 text-2xl font-bold ${kpis.criticalStock > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
            {kpis.criticalStock}
          </p>
        </div>
        <div className="rounded-xl border border-white/40 bg-white/60 p-5 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-500 uppercase">Sales (Delivered)</h3>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{kpis.totalOrders}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Orders & Stock) */}
        <div className="lg:col-span-2 space-y-6">

          {/* 2. Recent Orders */}
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50 border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-3 font-medium text-zinc-500">Order #</th>
                    <th className="px-5 py-3 font-medium text-zinc-500">Client</th>
                    <th className="px-5 py-3 font-medium text-zinc-500">Promised Date</th>
                    <th className="px-5 py-3 font-medium text-zinc-500">Status</th>
                    <th className="px-5 py-3 font-medium text-zinc-500">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-zinc-500">No recent orders</td></tr>
                  ) : recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-zinc-50/50">
                      <td className="px-5 py-3 font-medium">
                        <Link href={`/orders/${o.id}`} className="text-blue-600 hover:underline">
                          #{String(o.orderNumber).padStart(6, '0')}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{o.customerName || '—'}</td>
                      <td className="px-5 py-3">{o.promisedAt ? new Date(o.promisedAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        <span className="capitalize px-2 py-1 text-xs font-medium bg-zinc-100 rounded-full">{o.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`capitalize px-2 py-1 text-xs font-medium rounded-full ${o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : o.paymentStatus === 'Partial' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'}`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Critical Stock */}
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden flex flex-col">
             <div className="p-5 border-b border-zinc-200 flex justify-between items-center">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${kpis.criticalStock > 0 ? 'text-red-500' : 'text-zinc-400'}`} />
                Critical Stock
              </h2>
            </div>
            <div className="p-5">
              {criticalStockList.length === 0 ? (
                <p className="text-sm text-zinc-500">Inventory levels are healthy.</p>
              ) : (
                <div className="space-y-4">
                  {criticalStockList.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-zinc-400" />
                        <div>
                          <Link href={`/inventory/${item.id}`} className="text-sm font-medium text-zinc-900 hover:underline">{item.name}</Link>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-red-600">{Number(item.onHandQty).toFixed(1)} {item.unit}</span>
                        <span className="text-xs text-zinc-500 ml-1">/ Min: {Number(item.minQty).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Production & Activity) */}
        <div className="space-y-6">

          {/* 4. Production Snapshot */}
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">Production Snapshot</h2>
            </div>
            <div className="p-5 space-y-3">
              {productionSnapshot.length === 0 ? (
                <p className="text-sm text-zinc-500">No active work orders.</p>
              ) : (
                productionSnapshot.map(snap => (
                  <div key={snap.status} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-zinc-600">{snap.status.replace('_', ' ')}</span>
                    <span className="font-semibold text-zinc-900">{Number(snap.count)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Recent Activity */}
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200">
              <h2 className="font-semibold text-zinc-900">Recent Activity</h2>
            </div>
            <div className="p-5 space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-500">No activity yet.</p>
              ) : (
                recentActivity.map(event => (
                  <div key={event.id} className="text-sm">
                    <p className="text-zinc-900 font-medium">{event.summary}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(event.createdAt).toLocaleDateString()} {event.actorName && `· ${event.actorName}`}
                    </p>
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
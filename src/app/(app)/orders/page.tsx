import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listOrders } from "@/features/orders/repo";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

async function getContext() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-zinc-100 text-zinc-700 ring-zinc-500/10",
    approved: "bg-blue-50 text-blue-700 ring-blue-600/20",
    in_production: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    qc: "bg-purple-50 text-purple-700 ring-purple-600/20",
    ready_for_delivery: "bg-teal-50 text-teal-700 ring-teal-600/20",
    delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    canceled: "bg-red-50 text-red-700 ring-red-600/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.pending}`}>
      {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>
  );
}

export default async function OrdersPage() {
  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  try {
    const { orgId } = await getContext();
    orders = await listOrders(orgId);
  } catch (error) {
    console.error("Error loading orders:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Orders</h1>
          <p className="mt-1 text-sm text-zinc-600">Track and manage client orders.</p>
        </div>
        <Link href="/orders/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Quote Ref</TableHead>
              <TableHead>Promised Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No orders found. Convert a quote or create one manually.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline text-blue-600">
                      #{String(o.orderNumber).padStart(6, '0')}
                    </Link>
                  </TableCell>
                  <TableCell>{o.customerName || "—"}</TableCell>
                  <TableCell>{o.quoteNumber ? `Q-${String(o.quoteNumber).padStart(6, '0')}` : "—"}</TableCell>
                  <TableCell>{o.promisedAt ? new Date(o.promisedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium uppercase ${o.priority === 'urgent' ? 'text-red-600' : o.priority === 'high' ? 'text-amber-600' : 'text-zinc-500'}`}>
                      {o.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrderDetail } from "@/features/orders/repo";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/features/orders/actions";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";
import { CreditCard, Truck } from "lucide-react";
import { can, type Role } from "@/lib/auth/permissions";
import { getOrderDelivery } from "@/features/deliveries/repo";
import { CreateDeliveryDialog } from "@/features/deliveries/components/create-delivery-dialog";
import { ActivityTimeline } from "@/features/activity/components/activity-timeline";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  const canUpdateOrders = can(role, "orders:write");
  const canRecordPayments = can(role, "payments:write");

  const detail = await getOrderDetail(membership.orgId, orderId);
  if (!detail) notFound();

  const { order, customerName, quoteNumber, items, payments } = detail;

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingBalance = totalAmount - paidAmount;

  const delivery = await getOrderDelivery(order.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Order #{String(order.orderNumber).padStart(6, '0')}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {customerName || "Unknown Client"} — {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canUpdateOrders && order.status === 'pending' && (
            <form action={async () => {
              "use server";
              await updateOrderStatusAction(order.id, "approved");
              redirect(`/orders/${order.id}`);
            }}>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Approve Order</Button>
            </form>
          )}
          {can(role, "production:write") && order.status === 'approved' && (
            <Button asChild>
              <a href={`/production/work-orders/new?orderId=${order.id}`}>Create Work Order</a>
            </Button>
          )}
          {can(role, "deliveries:write") && !delivery && (
            <CreateDeliveryDialog orderId={order.id} />
          )}
          {can(role, "deliveries:read") && delivery && (
            <Button asChild variant="outline" className="text-zinc-700">
              <a href={`/deliveries/${delivery.id}`}><Truck className="h-4 w-4 mr-2" /> View Delivery</a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900">Order Items</h3>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                {order.status.toUpperCase()}
              </span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-500">Description</th>
                  <th className="px-4 py-3 font-medium text-zinc-500">Tech/Color</th>
                  <th className="px-4 py-3 font-medium text-zinc-500 text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-zinc-500 text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-zinc-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{item.technology} {item.color ? `/ ${item.color}` : ''}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50 border-t border-zinc-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-zinc-900">Order Total</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900">${totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payments</h3>
              {remainingBalance > 0 ? (
                canRecordPayments && <RecordPaymentDialog orderId={order.id} remainingBalance={remainingBalance} />
              ) : (
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">Fully Paid</span>
              )}
            </div>

            <div className="p-4 bg-white flex justify-between items-center border-b border-zinc-100">
              <div className="text-center px-4 border-r border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase">Total</p>
                <p className="text-lg font-semibold text-zinc-900">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center px-4 border-r border-zinc-100">
                <p className="text-xs font-medium text-zinc-500 uppercase">Paid</p>
                <p className="text-lg font-semibold text-emerald-600">${paidAmount.toFixed(2)}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs font-medium text-zinc-500 uppercase">Balance</p>
                <p className={`text-lg font-semibold ${remainingBalance > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>${remainingBalance.toFixed(2)}</p>
              </div>
            </div>

            {payments.length > 0 && (
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="px-4 py-2 font-medium text-zinc-500">Date</th>
                    <th className="px-4 py-2 font-medium text-zinc-500">Method</th>
                    <th className="px-4 py-2 font-medium text-zinc-500">Reference</th>
                    <th className="px-4 py-2 font-medium text-zinc-500 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-zinc-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="px-4 py-2 text-zinc-500">{p.reference || "—"}</td>
                      <td className="px-4 py-2 text-right font-medium text-emerald-600">${Number(p.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-[400px]">
            <AttachmentsPanel entityType="order" entityId={order.id} />
          </div>

          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Priority</span>
                <span className={`font-medium uppercase ${order.priority === 'urgent' ? 'text-red-600' : ''}`}>{order.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Promised Date</span>
                <span className="font-medium">{order.promisedAt ? new Date(order.promisedAt).toLocaleDateString() : 'Not Set'}</span>
              </div>
              {quoteNumber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">From Quote</span>
                  <span className="font-medium text-blue-600 hover:underline">
                    <a href={`/quotes/${order.quoteId}`}>Q-{String(quoteNumber).padStart(6, '0')}</a>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Notes</h2>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{order.notes || "No additional notes provided."}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm max-w-3xl">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Activity History</h2>
        <ActivityTimeline entityType="order" entityId={order.id} />
      </div>
    </div>
  );
}
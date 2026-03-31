import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDeliveryDetail } from "@/features/deliveries/repo";
import { notFound } from "next/navigation";
import { can, type Role } from "@/lib/auth/permissions";
import { AttachmentsPanel } from "@/features/attachments/components/attachments-panel";
import { UpdateDeliveryStatusDialog } from "@/features/deliveries/components/update-delivery-status-dialog";
import { Truck } from "lucide-react";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  if (!can(role, "deliveries:read")) notFound();

  const detail = await getDeliveryDetail(membership.orgId, deliveryId);
  if (!detail) notFound();

  const { delivery, order } = detail;
  const canUpdate = can(role, "deliveries:write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-zinc-500" /> Delivery
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            For Order <a href={`/orders/${order.id}`} className="text-blue-600 hover:underline">#{String(order.orderNumber).padStart(6, '0')}</a>
          </p>
        </div>
        <div className="flex gap-2">
          {canUpdate && (
            <UpdateDeliveryStatusDialog deliveryId={delivery.id} currentStatus={delivery.status} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${
                  delivery.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  delivery.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {delivery.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Type</span>
                <span className="font-medium capitalize">{delivery.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Scheduled At</span>
                <span className="font-medium">{delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleDateString() : 'Not Set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivered At</span>
                <span className="font-medium">{delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Coordination Notes</h2>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{delivery.notes || "No coordination notes provided."}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-[400px]">
            <AttachmentsPanel entityType="delivery" entityId={delivery.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listWorkOrders } from "@/features/production/repo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { WorkOrderStatusBadge } from "@/features/production/components/status-badge";

async function getContext() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId };
}

export default async function ProductionPage() {
  let workOrders: Awaited<ReturnType<typeof listWorkOrders>> = [];
  try {
    const { orgId } = await getContext();
    workOrders = await listWorkOrders(orgId);
  } catch (error) {
    console.error("Error loading work orders:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Production Queue</h1>
          <p className="mt-1 text-sm text-zinc-600">Workshop job control panel.</p>
        </div>
        <Button asChild>
          <Link href="/production/work-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Work Order
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>WO #</TableHead>
              <TableHead>Order Ref</TableHead>
              <TableHead>Printer</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Time (Est/Act)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                  No jobs in the queue.
                </TableCell>
              </TableRow>
            ) : (
              workOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell className="font-medium">
                    <Link href={`/production/work-orders/${wo.id}`} className="hover:underline text-blue-600 font-bold">
                      WO-{String(wo.workOrderNumber).padStart(6, '0')}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${wo.orderId || ''}`} className="hover:underline text-zinc-600">
                      #{String(wo.orderNumber).padStart(6, '0')}
                    </Link>
                  </TableCell>
                  <TableCell>{wo.printerName || "—"}</TableCell>
                  <TableCell>{wo.operatorName || "—"}</TableCell>
                  <TableCell>
                    <span className="text-zinc-600">{Number(wo.estimatedHours).toFixed(1)}h</span>
                    <span className="mx-1 text-zinc-300">/</span>
                    <span className={Number(wo.actualHours) > Number(wo.estimatedHours) ? "text-amber-600 font-medium" : "text-zinc-900 font-medium"}>
                      {Number(wo.actualHours).toFixed(1)}h
                    </span>
                  </TableCell>
                  <TableCell>
                    <WorkOrderStatusBadge status={wo.status} />
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
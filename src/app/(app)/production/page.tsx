import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listWorkOrders } from "@/features/production/repo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
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

import { can, type Role } from "@/lib/auth/permissions";

async function getContext() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId, role: membership.role as Role };
}

export default async function ProductionPage() {
  let workOrders: Awaited<ReturnType<typeof listWorkOrders>> = [];
  let canCreate = false;
  try {
    const { orgId, role } = await getContext();
    canCreate = can(role, "production:write");
    workOrders = await listWorkOrders(orgId);
  } catch (error) {
    console.error("Error loading work orders:", error);
  }

  const groupWorkOrders = (wos: typeof workOrders) => {
    const grouped = wos.reduce((acc, wo) => {
      const printer = wo.printerName || "Unassigned";
      if (!acc[printer]) {
        acc[printer] = [];
      }
      acc[printer].push(wo);
      return acc;
    }, {} as Record<string, typeof workOrders>);
    return grouped;
  };

  const groupedWorkOrders = groupWorkOrders(workOrders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Production Queue</h1>
          <p className="mt-1 text-sm text-zinc-600">Workshop job control panel grouped by printer/assignment.</p>
        </div>
        {canCreate && (
          <Link href="/production/work-orders/new" className={buttonVariants({ variant: "default" })}>
              <Plus className="mr-2 h-4 w-4" />
              New Work Order
            </Link>
        )}
      </div>

      {workOrders.length === 0 ? (
        <div className="rounded-xl border border-white/40 bg-white/60 p-12 text-center text-zinc-500 shadow-sm">
          No jobs in the queue.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedWorkOrders).map(([printerName, jobs]) => (
            <div key={printerName} className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3 flex justify-between items-center">
                <h2 className="font-semibold text-zinc-900">{printerName}</h2>
                <span className="text-sm text-zinc-500 bg-zinc-200 px-2.5 py-0.5 rounded-full">{jobs.length} jobs</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO #</TableHead>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Time (Est/Act)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((wo) => (
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
                      <TableCell>{wo.operatorName || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                          wo.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          wo.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          wo.priority === 'low' ? 'bg-zinc-100 text-zinc-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {wo.priority}
                        </span>
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
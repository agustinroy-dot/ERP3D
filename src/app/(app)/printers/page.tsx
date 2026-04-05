import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";
import { getPrinters } from "@/features/printers/repo";
import { notFound } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import Link from "next/link";

export default async function PrintersPage() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  if (!can(role, "printers:read")) notFound();

  const printers = await getPrinters(membership.orgId);
  const canCreate = can(role, "printers:write");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Printers & Equipment</h1>
        {canCreate && (
          <Link href="/printers/new" className={buttonVariants({ variant: "default", className: "bg-blue-600 hover:bg-blue-700 text-white" })}><Plus className="h-4 w-4 mr-2" /> New Printer</Link>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-500">Name</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Model</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Technology</th>
              <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {printers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  <Printer className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                  <p>No printers added yet</p>
                </td>
              </tr>
            ) : (
              printers.map((printer) => (
                <tr key={printer.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{printer.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{printer.model || "—"}</td>
                  <td className="px-6 py-4 text-zinc-600">{printer.technology}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      printer.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                      printer.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                      printer.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {printer.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a href={`/printers/${printer.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">Manage</a>
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

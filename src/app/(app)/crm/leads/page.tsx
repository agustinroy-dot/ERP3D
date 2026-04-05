import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships, leads as leadsSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listLeads } from "@/features/crm/repo";
import type { InferSelectModel } from "drizzle-orm";
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

export default async function LeadsPage() {
  let leads: InferSelectModel<typeof leadsSchema>[] = [];
  try {
    const { orgId } = await getContext();
    leads = await listLeads(orgId);
  } catch (error) {
    console.error("Error loading leads:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Leads</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage potential customers and inquiries.</p>
        </div>
        <Link href="/crm/leads/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Link>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  No leads found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    <Link href={`/crm/leads/${l.id}`} className="hover:underline text-blue-600">
                      {l.name}
                    </Link>
                  </TableCell>
                  <TableCell>{l.email || "—"}</TableCell>
                  <TableCell>{l.phone || "—"}</TableCell>
                  <TableCell>{l.source || "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {l.status}
                    </span>
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
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLeadById } from "@/features/crm/repo";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { convertLeadToCustomerAction } from "@/features/crm/actions";

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const lead = await getLeadById(membership.orgId, leadId);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{lead.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">Lead Detail</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          {lead.status !== "converted" && (
            <form action={async () => {
              "use server";
              const customer = await convertLeadToCustomerAction(lead.id);
              redirect(`/crm/customers/${customer.id}`);
            }}>
              <Button type="submit">Convert to Customer</Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Contact Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium">{lead.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phone</span>
              <span className="font-medium">{lead.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Source</span>
              <span className="font-medium">{lead.source || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="font-medium inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-inset ring-blue-600/20">{lead.status}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
           <h2 className="text-lg font-semibold text-zinc-900 mb-4">Activity</h2>
           <p className="text-sm text-zinc-500 italic">No recent activity.</p>
        </div>
      </div>
    </div>
  );
}
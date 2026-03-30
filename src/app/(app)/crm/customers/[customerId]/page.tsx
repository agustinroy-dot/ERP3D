import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCustomerById } from "@/features/crm/repo";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const customer = await getCustomerById(membership.orgId, customerId);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{customer.name}</h1>
          <p className="mt-1 text-sm text-zinc-600">{customer.isCompany ? "Company Customer" : "Individual Customer"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button>New Quote</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Contact Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium">{customer.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Phone</span>
              <span className="font-medium">{customer.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Tax ID</span>
              <span className="font-medium">{customer.taxId || "—"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500">Address</span>
              <span className="font-medium">{customer.address || "—"}</span>
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
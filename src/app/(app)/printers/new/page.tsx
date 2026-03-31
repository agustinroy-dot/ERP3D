import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { can, type Role } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { PrinterForm } from "@/features/printers/components/printer-form";

export default async function NewPrinterPage() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  if (!can(role, "printers:write")) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Add New Printer</h1>
        <p className="mt-1 text-sm text-zinc-600">Register a new 3D printer or equipment.</p>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
        <PrinterForm />
      </div>
    </div>
  );
}

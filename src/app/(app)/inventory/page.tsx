import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listMaterials } from "@/features/inventory/repo";
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
import { Plus, AlertCircle } from "lucide-react";

async function getContext() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");
  return { orgId: membership.orgId };
}

export default async function InventoryPage() {
  let materials: Awaited<ReturnType<typeof listMaterials>> = [];
  try {
    const { orgId } = await getContext();
    materials = await listMaterials(orgId);
  } catch (error) {
    console.error("Error loading inventory:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventory</h1>
          <p className="mt-1 text-sm text-zinc-600">Track and adjust materials and components.</p>
        </div>
        <Link href="/inventory/new" className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Material
          </Link>
      </div>

      <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">Min Qty</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  No materials found. Create your first material.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((m) => {
                const isLow = Number(m.onHandQty) <= Number(m.minQty);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <Link href={`/inventory/${m.id}`} className="hover:underline text-blue-600">
                          {m.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-500/10">
                        {m.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-zinc-500">{m.unit}</TableCell>
                    <TableCell className="text-right">{Number(m.minQty).toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${isLow ? 'text-red-600' : 'text-zinc-900'}`}>
                      {Number(m.onHandQty).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
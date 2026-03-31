import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getQuoteDetail } from "@/features/quotes/repo";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateQuoteStatusAction } from "@/features/quotes/actions";
import { can, type Role } from "@/lib/auth/permissions";

export default async function QuoteDetailPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });
  if (!membership) throw new Error("NO_ORG_MEMBERSHIP");

  const role = membership.role as Role;
  const canUpdateQuotes = can(role, "quotes:write");

  const detail = await getQuoteDetail(membership.orgId, quoteId);
  if (!detail) notFound();

  const { quote, customerName, leadName, items } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Quotation Q-{String(quote.quoteNumber).padStart(6, '0')}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {customerName || leadName || "Unknown Client"} — {new Date(quote.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canUpdateQuotes && quote.status === 'draft' && (
            <form action={async () => {
              "use server";
              await updateQuoteStatusAction(quote.id, "sent");
              redirect(`/quotes/${quote.id}`);
            }}>
              <Button type="submit" variant="outline">Mark as Sent</Button>
            </form>
          )}
          {canUpdateQuotes && quote.status === 'sent' && (
            <>
              <form action={async () => {
                "use server";
                await updateQuoteStatusAction(quote.id, "approved");
                redirect(`/quotes/${quote.id}`);
              }}>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
              </form>
              <form action={async () => {
                "use server";
                await updateQuoteStatusAction(quote.id, "rejected");
                redirect(`/quotes/${quote.id}`);
              }}>
                <Button type="submit" variant="destructive">Reject</Button>
              </form>
            </>
          )}
          {can(role, "orders:write") && quote.status === 'approved' && (
            <form action={async () => {
              "use server";
              const { convertQuoteToOrderAction } = await import("@/features/quotes/actions");
              const order = await convertQuoteToOrderAction(quote.id);
              redirect(`/orders/${order.id}`);
            }}>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Convert to Order</Button>
            </form>
          )}
          <Button variant="outline" asChild>
            <a href={`/quotes/${quote.id}/pdf`} target="_blank">View PDF</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900">Line Items</h3>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
              {quote.status.toUpperCase()}
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
                  <td className="px-4 py-3 text-right">${Number(item.priceFinal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${(Number(item.priceFinal) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-medium text-zinc-700">Total</td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900">${Number(quote.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-medium">${Number(quote.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Margin</span>
                <span className="font-medium text-emerald-600">${Number(quote.margin).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                <span className="text-zinc-900 font-semibold">Total</span>
                <span className="font-bold text-lg text-zinc-900">${Number(quote.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/40 bg-white/60 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-2">Notes & Terms</h2>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap">{quote.notes || "No additional notes provided."}</p>
            {quote.validUntil && (
              <p className="text-sm text-amber-600 mt-4 font-medium">
                Valid until: {new Date(quote.validUntil).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { getQuoteDetail } from "@/features/quotes/repo";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";

export async function GET(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });

  if (!membership) {
    return new Response("Unauthorized", { status: 401 });
  }

  const detail = await getQuoteDetail(membership.orgId, quoteId);

  if (!detail) {
    return new Response("Quote not found", { status: 404 });
  }

  const { quote, customerName, leadName, items } = detail;
  const quoteNumber = String(quote.quoteNumber).padStart(6, '0');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quote Q-${quoteNumber}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; padding: 40px; margin: 0 auto; max-width: 800px; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e4e4e7; padding-bottom: 20px; margin-bottom: 40px; }
        .title { font-size: 24px; font-weight: bold; margin: 0; }
        .subtitle { color: #71717a; margin-top: 4px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .details div { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 600; }
        td { padding: 12px 8px; border-bottom: 1px solid #f4f4f5; }
        .right { text-align: right; }
        .totals { float: right; width: 300px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .totals-row.total { border-top: 2px solid #e4e4e7; font-weight: bold; font-size: 18px; margin-top: 8px; padding-top: 16px; }
        .notes { margin-top: 80px; padding-top: 20px; border-top: 1px solid #e4e4e7; color: #52525b; font-size: 14px; white-space: pre-wrap; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <div>
          <h1 class="title">QUOTATION</h1>
          <p class="subtitle">Q-${quoteNumber}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin:0; font-size: 18px;">3D ERP System</h2>
          <p class="subtitle" style="margin:0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div class="details">
        <div>
          <p style="margin:0; font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase;">PREPARED FOR</p>
          <p style="margin: 8px 0 0 0; font-size: 16px;">${customerName || leadName || "Unknown Client"}</p>
        </div>
        <div class="right">
          <p style="margin:0; font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase;">VALID UNTIL</p>
          <p style="margin: 8px 0 0 0; font-size: 16px;">${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Technology</th>
            <th class="right">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.technology} ${item.color ? `(${item.color})` : ''}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">$${Number(item.priceFinal).toFixed(2)}</td>
              <td class="right">$${(Number(item.priceFinal) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>$${Number(quote.subtotal).toFixed(2)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>$${Number(quote.total).toFixed(2)}</span>
        </div>
      </div>

      <div style="clear: both;"></div>

      ${quote.notes ? `
        <div class="notes">
          <strong>Notes & Terms:</strong><br/>
          ${quote.notes}
        </div>
      ` : ''}
    </body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    }
  });
}
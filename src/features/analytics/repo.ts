import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents, orders, workOrders, materials, profiles, quotes, leads, customers, payments, orderItems } from "@/db/schema";

export async function getDashboardKPIs(orgId: string) {
  const db = getDb();

  // Active Orders (pending, approved, in_production, qc, ready_for_delivery)
  const activeOrdersCount = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.orgId, orgId), inArray(orders.status, ["pending", "approved", "in_production", "qc", "ready_for_delivery"])));

  // Work orders in progress (printing, assigned, postprocess)
  const workOrdersCount = await db.select({ count: sql<number>`count(*)` })
    .from(workOrders)
    .where(and(eq(workOrders.orgId, orgId), inArray(workOrders.status, ["printing", "assigned", "postprocess", "qc"])));

  // Critical stock (materials where onHand <= minQty)
  const criticalStockCount = await db.select({ count: sql<number>`count(*)` })
    .from(materials)
    .where(and(eq(materials.orgId, orgId), sql`${materials.onHandQty} <= ${materials.minQty}`));

  // Pending Quotes
  const pendingQuotesCount = await db.select({ count: sql<number>`count(*)` })
    .from(quotes)
    .where(and(eq(quotes.orgId, orgId), inArray(quotes.status, ["draft", "sent"])));

  // New Leads
  const newLeadsCount = await db.select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.status, "new")));

  // Sales Volume (Requires a join with items or simplified tracking. Since we don't have total cached on orders natively yet, we will count approved+ orders)
  const salesQuery = await db.select()
    .from(orders)
    .where(and(eq(orders.orgId, orgId), eq(orders.status, "delivered"))); // Simplified metric: delivered orders

  return {
    activeOrders: Number(activeOrdersCount[0].count),
    workOrdersInProgress: Number(workOrdersCount[0].count),
    criticalStock: Number(criticalStockCount[0].count),
    pendingQuotes: Number(pendingQuotesCount[0].count),
    newLeads: Number(newLeadsCount[0].count),
    totalOrders: salesQuery.length,
  };
}

export async function getDashboardData(orgId: string) {
  const db = getDb();

  const kpis = await getDashboardKPIs(orgId);
  const recentActivity = await getRecentActivity(orgId);

  const recentOrdersRaw = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    status: orders.status,
    priority: orders.priority,
    promisedAt: orders.promisedAt,
    customerName: customers.name,
  })
  .from(orders)
  .leftJoin(customers, eq(orders.customerId, customers.id))
  .where(eq(orders.orgId, orgId))
  .orderBy(desc(orders.createdAt))
  .limit(5);

  // Hydrate payment status manually for recent orders to avoid complex dynamic SQL grouping logic on Cloudflare Postgres
  const recentOrders = await Promise.all(recentOrdersRaw.map(async (o) => {
    const items = await db.select({ quantity: orderItems.quantity, unitPrice: orderItems.unitPrice }).from(orderItems).where(eq(orderItems.orderId, o.id));
    const orderPayments = await db.select({ amount: payments.amount }).from(payments).where(eq(payments.orderId, o.id));

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
    const paidAmount = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    let paymentStatus = "Unpaid";
    if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = "Paid";
    else if (paidAmount > 0) paymentStatus = "Partial";
    else if (totalAmount === 0) paymentStatus = "No Charge";

    return { ...o, paymentStatus };
  }));

  const productionSnapshot = await db.select({
    status: workOrders.status,
    count: sql<number>`count(*)`
  })
  .from(workOrders)
  .where(eq(workOrders.orgId, orgId))
  .groupBy(workOrders.status);

  const criticalStockList = await db.select()
  .from(materials)
  .where(and(eq(materials.orgId, orgId), sql`${materials.onHandQty} <= ${materials.minQty}`))
  .limit(5);

  return {
    kpis,
    recentActivity,
    recentOrders,
    productionSnapshot,
    criticalStockList
  };
}

export async function getRecentActivity(orgId: string) {
  const db = getDb();
  return db.select({
    id: activityEvents.id,
    type: activityEvents.type,
    summary: activityEvents.summary,
    createdAt: activityEvents.createdAt,
    actorName: profiles.fullName,
  })
  .from(activityEvents)
  .leftJoin(profiles, eq(activityEvents.actorUserId, profiles.id))
  .where(eq(activityEvents.orgId, orgId))
  .orderBy(desc(activityEvents.createdAt))
  .limit(10);
}

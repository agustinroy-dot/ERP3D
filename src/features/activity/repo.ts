import { getDb } from "@/db/client";
import { activityEvents, profiles } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

export async function getActivityForEntity(orgId: string, entityType: string, entityId: string) {
  const db = getDb();

  // If we're looking at a customer, we also want to see activities for their orders and quotes
  let relatedConditions = undefined;
  if (entityType === "customer") {
    const { orders, quotes } = await import("@/db/schema");
    const ordersList = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, entityId));
    const quotesList = await db.select({ id: quotes.id }).from(quotes).where(eq(quotes.customerId, entityId));

    const relatedIds = [...ordersList.map(o => o.id), ...quotesList.map(q => q.id)];

    if (relatedIds.length > 0) {
      // Find activities where entity is customer, OR entity is in the related ids list
      const conditions = [
        and(eq(activityEvents.entityType, "customer"), eq(activityEvents.entityId, entityId))
      ];

      for (const id of relatedIds) {
        conditions.push(eq(activityEvents.entityId, id));
      }

      relatedConditions = or(...conditions);
    }
  }

  const baseCondition = and(
    eq(activityEvents.orgId, orgId),
    relatedConditions || and(eq(activityEvents.entityType, entityType), eq(activityEvents.entityId, entityId))
  );

  return db
    .select({
      event: activityEvents,
      actorName: profiles.fullName
    })
    .from(activityEvents)
    .leftJoin(profiles, eq(activityEvents.actorUserId, profiles.id))
    .where(baseCondition)
    .orderBy(desc(activityEvents.createdAt));
}

import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";

export async function writeActivity(args: {
  orgId: string;
  actorUserId?: string;
  type: string;
  entityType: string;
  entityId: string;
  summary: string;
  action?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}) {
  const db = getDb();
  await db.insert(activityEvents).values({
    orgId: args.orgId,
    actorUserId: args.actorUserId ?? null,
    type: args.type,
    entityType: args.entityType,
    entityId: args.entityId,
    summary: args.summary,
    action: args.action ?? null,
    metadata: args.metadata ? JSON.stringify(args.metadata) : null,
  });
}
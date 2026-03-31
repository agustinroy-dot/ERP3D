import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getUserNotifications(orgId: string, userId: string, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.orgId, orgId), eq(notifications.userId, userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(orgId: string, userId: string) {
  const db = getDb();
  const result = await db
    .select({ count: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.orgId, orgId), eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

export async function createNotification(args: {
  orgId: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  targetUrl?: string;
}) {
  const db = getDb();
  await db.insert(notifications).values({
    orgId: args.orgId,
    userId: args.userId,
    title: args.title,
    message: args.message,
    type: args.type,
    targetUrl: args.targetUrl,
  });
}

"use server";

import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function markNotificationAsRead(notificationId: string) {
  const user = await requireUser();
  const db = getDb();

  // We don't check orgId strictly here since userId is unique enough for the notification ownership
  // but let's ensure the notification belongs to the user
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));
}

export async function markAllNotificationsAsRead() {
  const user = await requireUser();
  const db = getDb();

  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
}

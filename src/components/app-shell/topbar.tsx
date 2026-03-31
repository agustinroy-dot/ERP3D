import { Search, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { orgMemberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserNotifications, getUnreadNotificationCount } from "@/features/notifications/repo";

export async function Topbar() {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.query.orgMemberships.findFirst({
    where: eq(orgMemberships.userId, user.id)
  });

  let unreadCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let notifications: any[] = [];

  if (membership) {
    unreadCount = await getUnreadNotificationCount(membership.orgId, user.id);
    notifications = await getUserNotifications(membership.orgId, user.id);
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 rounded-xl border border-white/30 bg-white/60 px-4 shadow-sm backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-2 md:max-w-md">
        <Search className="h-4 w-4 text-zinc-500" />
        <Input
          type="search"
          placeholder="Search customers, quotes, orders..."
          className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-2"
        />
      </div>

      <div className="flex items-center gap-4">
        {membership && (
          <NotificationBell unreadCount={unreadCount} initialNotifications={notifications} />
        )}
        <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-200">
          <UserCircle className="h-full w-full text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
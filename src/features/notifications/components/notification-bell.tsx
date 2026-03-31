"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { markNotificationAsRead, markAllNotificationsAsRead } from "../actions";
import { useRouter } from "next/navigation";

export type NotificationType = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationBell({ unreadCount, initialNotifications }: { unreadCount: number, initialNotifications: NotificationType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>(initialNotifications);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const [, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setLocalUnreadCount(prev => Math.max(0, prev - 1));
    startTransition(async () => {
      await markNotificationAsRead(id);
      router.refresh();
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setLocalUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  };

  const handleNotificationClick = (n: NotificationType) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    if (n.targetUrl) {
      setOpen(false);
      router.push(n.targetUrl);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="relative p-2 rounded-full text-zinc-500 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Bell className="h-5 w-5" />
          {localUnreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white ring-0"></span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-80 rounded-xl bg-white p-0 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="font-semibold text-zinc-900">Notifications</h3>
            {localUnreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-zinc-300 opacity-50" />
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50/30'} hover:bg-zinc-50 cursor-pointer flex gap-3`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${n.isRead ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <p className={`text-sm font-medium ${n.isRead ? 'text-zinc-700' : 'text-zinc-900'}`}>{n.title}</p>
                        <p className="text-[10px] text-zinc-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${n.isRead ? 'text-zinc-500' : 'text-zinc-600'}`}>{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

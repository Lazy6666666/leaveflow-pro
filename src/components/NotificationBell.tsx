import { useId, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { Bell, CheckCheck } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/convexApi";
import type { NotificationId } from "@/lib/convexTypes";

interface AppNotification {
  id: NotificationId;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const { track } = useAnalytics();
  const notifications = (useQuery(api.notifications.listCurrent, user ? {} : "skip") ?? []) as AppNotification[];
  const markReadMutation = useMutation(api.notifications.markRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const notificationButtonLabel = unreadCount > 0
    ? `Open notifications (${unreadCount} unread)`
    : "Open notifications";

  const markAsRead = async (id: NotificationId) => {
    await markReadMutation({ notificationId: id });
  };

  const markAllRead = async () => {
    if (!notifications.some((notification) => !notification.is_read)) return;
    await markAllReadMutation({});
    void track("notifications_mark_all_read", {
      unread_count: unreadCount,
    });
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (notification.is_read) return;
    await markAsRead(notification.id);
    void track("notification_marked_read", {
      notification_type: notification.type,
      notification_age_bucket: getNotificationAgeBucket(notification.created_at),
    });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "success": return "🟢";
      case "error": return "🔴";
      case "warning": return "🟡";
      default: return "🔵";
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          void track("notification_center_opened", {
            unread_count: unreadCount,
          });
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={notificationButtonLabel}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <>
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
              <span className="sr-only">{unreadCount} unread notifications</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" aria-labelledby={headingId}>
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h4 id={headingId} className="text-sm font-semibold text-foreground">
              Notifications
            </h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" aria-hidden="true" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            <div role="list">
              {notifications.map((notification) => {
                const relativeTime = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => void handleNotificationClick(notification)}
                    aria-label={`${notification.title}. ${notification.message}. ${relativeTime}. ${notification.is_read ? "Read" : "Unread. Activate to mark as read."}`}
                  >
                    <span className="mt-0.5 text-sm" aria-hidden="true">{typeIcon(notification.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm", !notification.is_read && "font-semibold")}>{notification.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{relativeTime}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

function getNotificationAgeBucket(createdAt: string) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageHours = ageMs / 3_600_000;

  if (ageHours < 1) return "under_1h";
  if (ageHours < 24) return "under_24h";
  if (ageHours < 72) return "under_72h";
  return "72h_plus";
}

export default NotificationBell;

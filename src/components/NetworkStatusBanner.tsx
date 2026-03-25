import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface OfflineQueueStatus {
  pending: number;
}

interface NetworkStatusBannerProps {
  /** Optional queue status — shows pending count when offline */
  queueStatus?: OfflineQueueStatus;
  /** Called when reconnect is detected — use this to trigger queue drain */
  onReconnect?: () => void;
}

/**
 * NetworkStatusBanner
 *
 * Appears as a fixed top banner when the browser detects an offline state.
 * - Shows pending queue count if provided
 * - Auto-dismisses when the browser goes back online
 * - Calls onReconnect() when connectivity is restored (use to drain offline queue)
 * - Uses role="status" + aria-live="polite" for screen reader compatibility
 */
export function NetworkStatusBanner({ queueStatus, onReconnect }: NetworkStatusBannerProps) {
  const { isOnline } = useNetworkStatus();
  const isOffline = !isOnline;
  const [visible, setVisible] = useState(() => !isOnline);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      return;
    }

    if (!visible) {
      return;
    }

    const id = window.setTimeout(() => setVisible(false), 1800);
    onReconnect?.();

    return () => window.clearTimeout(id);
  }, [isOffline, onReconnect, visible]);

  if (!visible) return null;

  const pendingCount = queueStatus?.pending ?? 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`
        fixed left-0 right-0 top-0 z-50
        flex items-center justify-between
        px-4 py-2.5
        text-sm font-medium
        transition-all duration-200 ease-out
        ${isOffline
          ? "bg-amber-950 text-amber-200 dark:bg-amber-900/80"
          : "bg-emerald-950 text-emerald-200 dark:bg-emerald-900/80"
        }
      `}
    >
      <div className="flex items-center gap-2">
        {isOffline ? (
          <CloudOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        )}
        <span>
          {isOffline
            ? pendingCount > 0
              ? `You're offline · ${pendingCount} attendance event${pendingCount !== 1 ? "s" : ""} queued for sync`
              : "You're offline · Attendance will be queued locally"
            : "Reconnected · Syncing queued events…"
          }
        </span>
      </div>
    </div>
  );
}

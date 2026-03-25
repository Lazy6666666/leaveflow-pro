import { CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OfflineSyncStatusBadgeProps {
  pendingCount: number;
}

/**
 * OfflineSyncStatusBadge
 * Shows a red dot and pending count when offline attendance events exist.
 * Placed in mobile top nav or user dropdown.
 */
export function OfflineSyncStatusBadge({ pendingCount }: OfflineSyncStatusBadgeProps) {
  if (pendingCount === 0) return null;

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500"
    >
      <CloudOff className="h-3 w-3" />
      <span>{pendingCount}</span>
      <span className="sr-only">pending offline syncs</span>
    </Badge>
  );
}

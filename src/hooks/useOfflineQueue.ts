import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  enqueueAttendanceEvent,
  getPendingEvents,
  dequeueAttendanceEvent,
  getQueueStatus,
  OfflineAttendanceEvent,
} from "@/lib/offlineQueue";
import { uploadFileToConvex } from "@/lib/convexUpload";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isDraining, setIsDraining] = useState(false);
  const drainingRef = useRef(false);
  const replayLog = useMutation(api.attendanceEmployee.replayOfflineLog);
  const { isOnline } = useNetworkStatus();

  const updateStatus = useCallback(async () => {
    const status = await getQueueStatus();
    setPendingCount(status.pending);
  }, []);

  useEffect(() => {
    updateStatus();
    // Re-check periodically just in case other tabs update it
    const id = setInterval(updateStatus, 10000);
    return () => clearInterval(id);
  }, [updateStatus]);

  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    if (!isOnline) return; // Wait until online

    const pending = await getPendingEvents();
    if (pending.length === 0) return;

    drainingRef.current = true;
    setIsDraining(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const event of pending) {
        try {
          let selfieStorageId;
          if (event.selfieBlob) {
            const uploadRes = await uploadFileToConvex(event.selfieBlob, "attendance_selfie");
            selfieStorageId = uploadRes.storageId;
          }

          await replayLog({
            offlineSyncId: event.offlineSyncId,
            eventType: event.eventType,
            timestamp: event.timestamp,
            selfieStorageId,
            locationData: event.locationData,
            logId: event.logId ? (event.logId as Id<"attendanceLogs">) : undefined,
          });

          // Delete from local queue after successful sync.
          await dequeueAttendanceEvent(event.offlineSyncId);
          successCount++;
          await updateStatus();
        } catch (err) {
          console.error("Failed to sync offline event:", err);
          failureCount++;
          // We do not break the loop. If one fails, we try the next.
          // If it constantly fails, Convex replay limits or manual intervention might be needed.
        }
      }
    } finally {
      drainingRef.current = false;
      setIsDraining(false);
    }

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline attendance event(s).`);
    }
    if (failureCount > 0) {
      toast.error(`Failed to sync ${failureCount} offline attendance event(s). Check your connection and try again.`);
    }
  }, [isOnline, replayLog, updateStatus]);

  const enqueue = useCallback(
    async (event: OfflineAttendanceEvent) => {
      await enqueueAttendanceEvent(event);
      await updateStatus();
      if (!isOnline) {
        toast.info("You are offline. Event saved and will sync when reconnected.");
      } else {
        // Enqueued while online? Should probably try to drain immediately.
        void drain();
      }
    },
    [drain, isOnline, updateStatus],
  );

  useEffect(() => {
    if (!isOnline) {
      return;
    }
    // Small delay to ensure true connectivity
    const id = window.setTimeout(drain, 2000);
    return () => window.clearTimeout(id);
  }, [drain, isOnline]);

  return {
    pendingCount,
    isDraining,
    enqueue,
    drain,
  };
}

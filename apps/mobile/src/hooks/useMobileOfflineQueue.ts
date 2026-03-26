import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import * as Network from "expo-network";

import { api } from "../../../../convex/_generated/api";
import {
  createOfflineEventId,
  dequeueOfflineAttendanceEvent,
  enqueueOfflineAttendanceEvent,
  getOfflineQueueStatus,
  getPendingOfflineAttendanceEvents,
  type MobileOfflineAttendanceEvent,
  type MobileOfflineEventType,
  type MobileOfflineLocationData,
} from "../lib/mobileOfflineQueue";
import { uploadFileToConvex } from "../lib/mobileConvexUpload";
import { deletePersistedSelfie } from "../lib/mobileSelfieStorage";

type QueueAttendanceArgs = {
  eventType: MobileOfflineEventType;
  logId?: string;
  locationData?: MobileOfflineLocationData;
  selfieUri?: string;
};

export function useMobileOfflineQueue(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const replayOfflineLog = useMutation(api.attendanceEmployee.replayOfflineLog);

  const refreshStatus = useCallback(async () => {
    const status = await getOfflineQueueStatus();
    setPendingCount(status.pending);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPendingCount(0);
      setIsOnline(false);
      return;
    }

    void refreshStatus();
  }, [enabled, refreshStatus]);

  const replayPendingActions = useCallback(
    async ({ silentWhenEmpty = false }: { silentWhenEmpty?: boolean } = {}) => {
      if (!enabled || syncingRef.current || !isOnline) {
        return false;
      }

      syncingRef.current = true;
      setIsSyncing(true);
      setQueueMessage(null);
      setQueueError(null);

      try {
        const pending = await getPendingOfflineAttendanceEvents();

        if (pending.length === 0) {
          if (!silentWhenEmpty) {
            setQueueMessage("No queued attendance actions to replay.");
          }
          return true;
        }

        let successCount = 0;
        let failureCount = 0;

        for (const event of pending) {
          try {
            const selfieStorageId = event.selfieUri
              ? (await uploadFileToConvex(event.selfieUri, "attendance_selfie")).storageId
              : undefined;

            await replayOfflineLog({
              offlineSyncId: event.offlineSyncId,
              eventType: event.eventType,
              timestamp: event.timestamp,
              selfieStorageId: selfieStorageId as never,
              locationData: event.locationData,
              logId: event.logId as never,
            });
            await dequeueOfflineAttendanceEvent(event.offlineSyncId);
            await deletePersistedSelfie(event.selfieUri);
            successCount += 1;
          } catch {
            failureCount += 1;
          }
        }

        await refreshStatus();

        if (successCount > 0 && failureCount === 0) {
          setQueueMessage(`Replayed ${successCount} queued attendance action(s).`);
          return true;
        }

        if (successCount > 0 && failureCount > 0) {
          setQueueError(
            `${successCount} queued action(s) replayed, ${failureCount} still need attention.`,
          );
          return false;
        }

        setQueueError("Queued attendance actions could not be replayed.");
        return false;
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [enabled, isOnline, refreshStatus, replayOfflineLog],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    void Network.getNetworkStateAsync().then((state) => {
      if (!active) {
        return;
      }

      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    const subscription = Network.addNetworkStateListener((state) => {
      const nextIsOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(nextIsOnline);

      if (nextIsOnline) {
        setTimeout(() => {
          void replayPendingActions({ silentWhenEmpty: true });
        }, 1200);
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [enabled, replayPendingActions]);

  const queueAttendanceAction = useCallback(
    async ({ eventType, logId, locationData, selfieUri }: QueueAttendanceArgs) => {
      setQueueMessage(null);
      setQueueError(null);

      const event: MobileOfflineAttendanceEvent = {
        offlineSyncId: createOfflineEventId(),
        eventType,
        timestamp: Date.now(),
        logId,
        locationData,
        selfieUri,
      };

      await enqueueOfflineAttendanceEvent(event);
      await refreshStatus();
      setQueueMessage(
        `${eventType === "clock_in" ? "Clock-in" : "Clock-out"} saved locally for replay.`,
      );

      if (isOnline) {
        setTimeout(() => {
          void replayPendingActions({ silentWhenEmpty: true });
        }, 400);
      }
    },
    [isOnline, refreshStatus, replayPendingActions],
  );

  return {
    pendingCount,
    isSyncing,
    isOnline,
    queueMessage,
    queueError,
    queueAttendanceAction,
    replayPendingActions,
    refreshStatus,
  };
}

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { getAttendanceActionBlocker } from "../lib/attendanceFlow";
import { uploadFileToConvex } from "../lib/mobileConvexUpload";
import type { MobileOfflineLocationData } from "../lib/mobileOfflineQueue";
import { useMobileOfflineQueue } from "./useMobileOfflineQueue";
import { useMobileRuntime } from "../providers/useMobileRuntime";

export type AttendanceLogPreview = {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  source: string;
  notes: string | null;
  site_id: string | null;
};

export type AttendanceSettingsPreview = {
  work_start_time: string;
  work_end_time: string;
  require_selfie: boolean;
  require_location: boolean;
  geofence_enabled: boolean;
  geofence_label: string | null;
};

export type LeaveBalancePreview = {
  id: string;
  balance: number;
  leave_types: {
    name: string;
  } | null;
};

type AttendanceCapturePayload = {
  selfieUri?: string;
  locationData?: MobileOfflineLocationData;
};

export function useEmployeeDashboardData() {
  const runtime = useMobileRuntime();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const offlineQueue = useMobileOfflineQueue(runtime.isSignedIn);

  const queryArgs = runtime.isSignedIn && runtime.isLoaded ? {} : "skip";
  const historyArgs = runtime.isSignedIn && runtime.isLoaded ? { monthOffset: 0 } : "skip";

  const clockWidget = useQuery(api.attendance.getClockWidgetData, queryArgs);
  const history = useQuery(api.attendance.getAttendanceHistory, historyArgs);
  const leaveBalances = useQuery(api.leave.getMyBalances, queryArgs);

  const clockIn = useMutation(api.attendance.clockIn);
  const clockOut = useMutation(api.attendance.clockOut);

  const todayLog = (clockWidget?.todayLog ?? null) as AttendanceLogPreview | null;
  const settings = (clockWidget?.settings ?? null) as AttendanceSettingsPreview | null;
  const currentShiftOpen = Boolean(todayLog?.clock_in) && !todayLog?.clock_out;
  const attendanceComplete = Boolean(todayLog?.clock_in) && Boolean(todayLog?.clock_out);
  const requiresSelfie = Boolean(settings?.require_selfie);
  const requiresLocation = Boolean(settings?.require_location || settings?.geofence_enabled);

  const primaryActionLabel = !runtime.isSignedIn
    ? "Sign in to continue"
    : currentShiftOpen
      ? "Clock out"
      : attendanceComplete
        ? "Attendance complete"
        : "Clock in";

  const secondaryStatusLabel = !runtime.isSignedIn
    ? "Not signed in"
    : currentShiftOpen
      ? "Shift in progress"
      : attendanceComplete
        ? "Synced for today"
        : "Ready to start";

  const queueActionLabel = currentShiftOpen ? "Queue clock out" : "Queue clock in";

  function validateActionRequest(evidence?: AttendanceCapturePayload) {
    const validationError = getAttendanceActionBlocker({
      isSignedIn: runtime.isSignedIn,
      hasAttendanceContext: Boolean(todayLog || settings),
      attendanceComplete,
      settings,
      evidence,
    });

    if (validationError === "Attendance complete") {
      setActionMessage("Today's attendance is already complete.");
    }

    return validationError;
  }

  async function triggerPrimaryAction(evidence?: AttendanceCapturePayload) {
    setActionMessage(null);
    setActionError(null);

    const validationError = validateActionRequest(evidence);
    if (validationError) {
      if (validationError !== "Attendance complete") {
        setActionError(validationError);
      }
      return false;
    }

    setIsSubmitting(true);

    try {
      const selfieStorageId = evidence?.selfieUri
        ? (await uploadFileToConvex(evidence.selfieUri, "attendance_selfie")).storageId
        : undefined;

      if (currentShiftOpen && todayLog?.id) {
        await clockOut({
          logId: todayLog.id as never,
          selfieClockOutStorageId: selfieStorageId as never,
          locationClockOut: evidence?.locationData,
        });
        setActionMessage("Clock-out recorded.");
      } else {
        await clockIn({
          selfieClockInStorageId: selfieStorageId as never,
          locationClockIn: evidence?.locationData,
        });
        setActionMessage("Clock-in recorded.");
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Attendance action failed. Check your connection and try again.";
      setActionError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function queuePrimaryAction(evidence?: AttendanceCapturePayload) {
    setActionMessage(null);
    setActionError(null);

    const validationError = validateActionRequest(evidence);
    if (validationError) {
      if (validationError !== "Attendance complete") {
        setActionError(validationError.replace("submitted", "queued"));
      }
      return false;
    }

    if (requiresSelfie && evidence?.selfieUri) {
      setActionError(
        "Offline queueing is unavailable when selfie verification is required. Reconnect or use a supported device.",
      );
      return false;
    }

    try {
      await offlineQueue.queueAttendanceAction({
        eventType: currentShiftOpen ? "clock_out" : "clock_in",
        logId: currentShiftOpen ? todayLog?.id : undefined,
        locationData: evidence?.locationData,
        selfieUri: undefined,
      });
      setActionMessage(
        currentShiftOpen
          ? "Clock-out saved for offline replay."
          : "Clock-in saved for offline replay.",
      );
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save the offline attendance action.";
      setActionError(message);
      return false;
    }
  }

  async function replayQueuedActions() {
    setActionMessage(null);
    setActionError(null);

    try {
      await offlineQueue.replayPendingActions();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Replay failed. Try again once the backend is reachable.";
      setActionError(message);
    }
  }

  return {
    runtime,
    clockWidget,
    todayLog,
    settings,
    history: (history ?? []) as AttendanceLogPreview[],
    leaveBalances: (leaveBalances ?? []) as LeaveBalancePreview[],
    isLoading:
      runtime.isSignedIn &&
      (clockWidget === undefined || history === undefined || leaveBalances === undefined),
    isSubmitting,
    actionMessage,
    actionError,
    requiresSelfie,
    requiresLocation,
    primaryActionLabel,
    queueActionLabel,
    secondaryStatusLabel,
    currentShiftOpen,
    attendanceComplete,
    isOnline: offlineQueue.isOnline,
    pendingQueueCount: offlineQueue.pendingCount,
    isSyncingQueue: offlineQueue.isSyncing,
    queueMessage: offlineQueue.queueMessage,
    queueError: offlineQueue.queueError,
    triggerPrimaryAction,
    queuePrimaryAction,
    replayQueuedActions,
  };
}

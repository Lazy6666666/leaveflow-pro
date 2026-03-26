import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { bucketWorkDurationHours, normalizeAnalyticsError } from "@/lib/analytics";
import { api } from "@/lib/convexApi";
import type { AttendanceLogId, StorageId } from "@/lib/convexTypes";
import { getErrorMessage } from "@/lib/errors";

export interface AttendanceLog {
  id: AttendanceLogId;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  date: string;
}

export type PermissionRecoveryState = "none" | "location_denied" | "camera_denied";

type SelfieType = "clock_in" | "clock_out";

export function useClockInOutController() {
  const { user } = useAuth();
  const { enqueue, pendingCount, isDraining } = useOfflineQueue();
  const { sessionId, roleScope, surface, trackOnce, track } = useAnalytics();

  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [selfieDialog, setSelfieDialog] = useState<{ open: boolean; type: SelfieType }>({
    open: false,
    type: "clock_in",
  });
  const [permissionState, setPermissionState] = useState<PermissionRecoveryState>("none");

  const data = useQuery(api.attendance.getClockWidgetData, user ? {} : "skip");
  const clockInMutation = useMutation(api.attendance.clockIn);
  const clockOutMutation = useMutation(api.attendance.clockOut);

  const todayLog = (data?.todayLog as AttendanceLog | null) ?? null;
  const requireSelfie = !!data?.settings?.require_selfie;
  const requireLocation = !!data?.settings?.require_location;
  const geofenceEnabled = !!data?.settings?.geofence_enabled;
  const requireClockInLocation = requireLocation || geofenceEnabled;
  const requireClockOutLocation = requireLocation;
  const loading = data === undefined;

  useEffect(() => {
    if (!loading) {
      void trackOnce(
        "attendance_widget_viewed",
        "attendance_widget_viewed",
        {
          has_today_log: Boolean(todayLog),
          require_selfie: requireSelfie,
          require_location: requireLocation,
          geofence_enabled: geofenceEnabled,
        },
        { surface: "attendance", path: "/dashboard" },
      );
    }
  }, [geofenceEnabled, loading, requireLocation, requireSelfie, todayLog, trackOnce]);

  useEffect(() => {
    if (!todayLog?.clock_in || todayLog?.clock_out) {
      setElapsed("");
      return;
    }

    const update = () => {
      const minutes = differenceInMinutes(new Date(), new Date(todayLog.clock_in!));
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      setElapsed(`${hours}h ${remainder}m`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [todayLog?.clock_in, todayLog?.clock_out]);

  const getLocation = useCallback(
    (required: boolean): Promise<{ lat: number; lng: number; accuracy: number } | null> =>
      new Promise((resolve, reject) => {
        if (!required) {
          resolve(null);
          return;
        }

        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPermissionState("none");
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              setPermissionState("location_denied");
            } else {
              toast.error("Location access denied. Please enable location permissions to clock in or out.");
            }
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      }),
    [],
  );

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState("none");
      toast.success("Camera access granted. You can now clock in.");
    } catch {
      setPermissionState("camera_denied");
    }
  }, []);

  const processClockIn = useCallback(
    async (selfiePath?: StorageId, selfieBlob?: Blob) => {
      if (!user) return;
      if (requireSelfie && !selfiePath && !selfieBlob) {
        toast.error("A selfie is required before clocking in.");
        return;
      }
      setActing(true);
      try {
        const location = await getLocation(requireClockInLocation);

        if (!navigator.onLine) {
          await enqueue({
            offlineSyncId: crypto.randomUUID(),
            eventType: "clock_in",
            timestamp: Date.now(),
            locationData: location ?? undefined,
            selfieBlob: selfieBlob,
          });
          toast.success("Offline: Clock-in queued for sync");
          return;
        }

        const result = await clockInMutation({
          selfieClockInStorageId: selfiePath,
          locationClockIn: location ?? undefined,
          analytics: {
            sessionId,
            roleScope,
            surface,
            path: "/dashboard",
            hasSelfie: Boolean(selfiePath),
            hasLocation: Boolean(location),
          },
        });
        toast.success(result.status === "late" ? "Clocked in late" : "Clocked in successfully");
      } catch (error) {
        void track(
          "clock_in_failed",
          {
            error_type: normalizeAnalyticsError(getErrorMessage(error, "Failed to clock in")),
            require_selfie: requireSelfie,
            require_location: requireLocation,
            geofence_enabled: geofenceEnabled,
          },
          { surface: "attendance", path: "/dashboard" },
        );
        toast.error(getErrorMessage(error, "Failed to clock in"));
      } finally {
        setActing(false);
      }
    },
    [
      clockInMutation,
      enqueue,
      geofenceEnabled,
      getLocation,
      requireClockInLocation,
      requireLocation,
      requireSelfie,
      roleScope,
      sessionId,
      surface,
      track,
      user,
    ],
  );

  const processClockOut = useCallback(
    async (selfiePath?: StorageId, selfieBlob?: Blob) => {
      if (!todayLog) return;
      if (requireSelfie && !selfiePath && !selfieBlob) {
        toast.error("A selfie is required before clocking out.");
        return;
      }
      setActing(true);
      try {
        const location = await getLocation(requireClockOutLocation);

        if (!navigator.onLine) {
          await enqueue({
            offlineSyncId: crypto.randomUUID(),
            eventType: "clock_out",
            timestamp: Date.now(),
            locationData: location ?? undefined,
            selfieBlob: selfieBlob,
            logId: todayLog.id,
          });
          toast.success("Offline: Clock-out queued for sync");
          return;
        }

        await clockOutMutation({
          logId: todayLog.id,
          selfieClockOutStorageId: selfiePath,
          locationClockOut: location ?? undefined,
          analytics: {
            sessionId,
            roleScope,
            surface,
            path: "/dashboard",
            workDurationBucketHours: todayLog.clock_in
              ? bucketWorkDurationHours(differenceInMinutes(new Date(), new Date(todayLog.clock_in)))
              : undefined,
          },
        });
        toast.success("Clocked out successfully");
      } catch (error) {
        void track(
          "clock_out_failed",
          {
            error_type: normalizeAnalyticsError(getErrorMessage(error, "Failed to clock out")),
          },
          { surface: "attendance", path: "/dashboard" },
        );
        toast.error(getErrorMessage(error, "Failed to clock out"));
      } finally {
        setActing(false);
      }
    },
    [
      clockOutMutation,
      enqueue,
      getLocation,
      requireClockOutLocation,
      requireSelfie,
      roleScope,
      sessionId,
      surface,
      todayLog,
      track,
    ],
  );

  const handleClockIn = useCallback(() => {
    void track(
      "clock_in_attempted",
      {
        has_selfie: requireSelfie,
        has_location: requireClockInLocation,
      },
      { surface: "attendance", path: "/dashboard" },
    );
    if (requireSelfie) {
      setSelfieDialog({ open: true, type: "clock_in" });
      return;
    }
    void processClockIn();
  }, [processClockIn, requireClockInLocation, requireSelfie, track]);

  const handleClockOut = useCallback(() => {
    void track(
      "clock_out_attempted",
      {
        has_selfie: requireSelfie,
        has_location: requireClockOutLocation,
      },
      { surface: "attendance", path: "/dashboard" },
    );
    if (requireSelfie) {
      setSelfieDialog({ open: true, type: "clock_out" });
      return;
    }
    void processClockOut();
  }, [processClockOut, requireClockOutLocation, requireSelfie, track]);

  const handleSelfieCaptureComplete = useCallback(
    (path?: StorageId, blob?: Blob) => {
      if (selfieDialog.type === "clock_in") {
        void processClockIn(path, blob);
        return;
      }
      void processClockOut(path, blob);
    },
    [processClockIn, processClockOut, selfieDialog.type],
  );

  const setSelfieDialogOpen = useCallback((open: boolean) => {
    setSelfieDialog((current) => ({ ...current, open }));
  }, []);

  const acknowledgePermissionRecovered = useCallback(() => {
    setPermissionState("none");
  }, []);

  const handleSelfiePermissionDenied = useCallback(() => {
    setPermissionState("camera_denied");
  }, []);

  const isClockedIn = Boolean(todayLog?.clock_in && !todayLog?.clock_out);
  const sessionTotal = useMemo(() => {
    if (!todayLog?.clock_in || !todayLog?.clock_out) return "";
    const minutes = differenceInMinutes(new Date(todayLog.clock_out), new Date(todayLog.clock_in));
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, [todayLog?.clock_in, todayLog?.clock_out]);

  return {
    acting,
    elapsed,
    loading,
    todayLog,
    permissionState,
    selfieDialog,
    isClockedIn,
    sessionTotal,
    requireSelfie,
    pendingCount,
    isDraining,
    handleClockIn,
    handleClockOut,
    handleSelfieCaptureComplete,
    handleSelfiePermissionDenied,
    requestCameraPermission,
    setSelfieDialogOpen,
    acknowledgePermissionRecovered,
  };
}

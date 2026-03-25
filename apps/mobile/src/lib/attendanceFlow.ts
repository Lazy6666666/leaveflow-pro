type AttendanceSettingsShape = {
  require_selfie: boolean;
  require_location: boolean;
  geofence_enabled: boolean;
  geofence_label: string | null;
};

type PermissionSnapshot = {
  granted?: boolean | null;
  canAskAgain?: boolean | null;
  status?: string | null;
};

type AttendanceActionEvidence = {
  selfieUri?: string;
  locationData?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
};

export type AttendanceCapabilityFallback = {
  key: string;
  title: string;
  body: string;
  blocking: boolean;
};

type AttendanceCapabilityFallbackInput = {
  settings: AttendanceSettingsShape | null | undefined;
  cameraAvailable?: boolean | null;
  cameraPermission?: PermissionSnapshot | null;
  locationPermission?: PermissionSnapshot | null;
  locationServicesEnabled?: boolean | null;
};

type AttendanceActionValidationInput = {
  isSignedIn: boolean;
  hasAttendanceContext: boolean;
  attendanceComplete: boolean;
  settings: AttendanceSettingsShape | null | undefined;
  evidence?: AttendanceActionEvidence;
  capabilityFallbacks?: AttendanceCapabilityFallback[];
};

function getRequiresSelfie(settings: AttendanceSettingsShape | null | undefined) {
  return Boolean(settings?.require_selfie);
}

function getRequiresLocation(settings: AttendanceSettingsShape | null | undefined) {
  return Boolean(settings?.require_location || settings?.geofence_enabled);
}

function getLocationLabel(settings: AttendanceSettingsShape | null | undefined) {
  const trimmedLabel = settings?.geofence_label?.trim();
  if (trimmedLabel) {
    return trimmedLabel;
  }

  return settings?.geofence_enabled ? "your assigned attendance zone" : "this shift";
}

export function getAttendanceFallbackSummary(
  settings: AttendanceSettingsShape | null | undefined,
) {
  const requiresSelfie = getRequiresSelfie(settings);
  const requiresLocation = getRequiresLocation(settings);

  if (!requiresSelfie && !requiresLocation) {
    return "No special device fallback is needed today. This shift can be completed directly from the mobile attendance lane.";
  }

  if (requiresSelfie && requiresLocation) {
    return `This shift needs a live selfie and GPS check for ${getLocationLabel(settings)}. If either capability is unavailable on this phone, switch to the leaveflow web attendance surface or a managed device before you clock in or out.`;
  }

  if (requiresSelfie) {
    return "This shift needs a live selfie. If camera access is unavailable on this phone, use the leaveflow web attendance surface or a supported managed device before submitting attendance.";
  }

  return `This shift needs live location verification for ${getLocationLabel(settings)}. If GPS access is unavailable on this phone, use the leaveflow web attendance surface or a supported managed device before submitting attendance.`;
}

export function buildAttendanceCapabilityFallbacks({
  settings,
  cameraAvailable,
  cameraPermission,
  locationPermission,
  locationServicesEnabled,
}: AttendanceCapabilityFallbackInput): AttendanceCapabilityFallback[] {
  const fallbacks: AttendanceCapabilityFallback[] = [];
  const requiresSelfie = getRequiresSelfie(settings);
  const requiresLocation = getRequiresLocation(settings);

  if (requiresSelfie) {
    if (cameraAvailable === false) {
      fallbacks.push({
        key: "camera-unavailable",
        title: "Camera unavailable on this device",
        body:
          "This attendance flow requires a live selfie, but the camera module is not available here. Use the leaveflow web attendance surface or a managed device that supports camera capture.",
        blocking: true,
      });
    } else if (cameraPermission?.granted === false && cameraPermission?.canAskAgain === false) {
      fallbacks.push({
        key: "camera-settings",
        title: "Camera access is blocked",
        body:
          "Selfie verification is required for attendance. Re-enable camera access in the device settings or switch to a supported device before you continue.",
        blocking: true,
      });
    } else if (cameraPermission?.granted === false && cameraPermission?.status === "denied") {
      fallbacks.push({
        key: "camera-denied",
        title: "Camera permission still needs approval",
        body:
          "Allow camera access when the device prompts you. If the prompt never appears, finish attendance from the leaveflow web surface or another supported device.",
        blocking: true,
      });
    }
  }

  if (requiresLocation) {
    if (locationServicesEnabled === false) {
      fallbacks.push({
        key: "location-services-disabled",
        title: "Location services are turned off",
        body: `Live GPS is required for ${getLocationLabel(settings)}. Turn on location services, then refresh the capture step. If this device still cannot share location, switch to the leaveflow web attendance surface or a managed device.`,
        blocking: true,
      });
    }

    if (locationPermission?.granted === false && locationPermission?.canAskAgain === false) {
      fallbacks.push({
        key: "location-settings",
        title: "Location access is blocked",
        body: `Live location is required for ${getLocationLabel(settings)}. Re-enable location access in the device settings or continue attendance from a supported device.`,
        blocking: true,
      });
    } else if (locationPermission?.granted === false && locationPermission?.status === "denied") {
      fallbacks.push({
        key: "location-denied",
        title: "Location permission still needs approval",
        body:
          "Allow location access when prompted so geofence and attendance checks can run. If the prompt never appears, finish attendance from the leaveflow web surface or another supported device.",
        blocking: true,
      });
    }
  }

  return fallbacks;
}

export function getAttendanceActionBlocker({
  isSignedIn,
  hasAttendanceContext,
  attendanceComplete,
  settings,
  evidence,
  capabilityFallbacks = [],
}: AttendanceActionValidationInput) {
  if (!isSignedIn) {
    return "Sign in with your employee account to load live attendance.";
  }

  if (!hasAttendanceContext) {
    return "Attendance settings are still loading.";
  }

  if (attendanceComplete) {
    return "Attendance complete";
  }

  const blockingFallback = capabilityFallbacks.find((item) => item.blocking);
  if (blockingFallback) {
    return blockingFallback.body;
  }

  if (getRequiresSelfie(settings) && !evidence?.selfieUri) {
    return "Selfie capture is required before attendance can be submitted.";
  }

  if (getRequiresLocation(settings) && !evidence?.locationData) {
    return settings?.geofence_enabled
      ? "Location capture is required so geofence checks can run before attendance is submitted."
      : "Location capture is required before attendance can be submitted.";
  }

  return null;
}

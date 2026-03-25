import { describe, expect, it } from "vitest";

import {
  buildAttendanceCapabilityFallbacks,
  getAttendanceActionBlocker,
  getAttendanceFallbackSummary,
} from "./attendanceFlow";

const baseSettings = {
  require_selfie: true,
  require_location: true,
  geofence_enabled: true,
  geofence_label: "HQ Tower",
};

describe("getAttendanceFallbackSummary", () => {
  it("describes the combined selfie and location fallback plan", () => {
    expect(getAttendanceFallbackSummary(baseSettings)).toContain("live selfie and GPS");
    expect(getAttendanceFallbackSummary(baseSettings)).toContain("HQ Tower");
  });

  it("describes a no-extra-requirements state", () => {
    expect(
      getAttendanceFallbackSummary({
        require_selfie: false,
        require_location: false,
        geofence_enabled: false,
        geofence_label: null,
      }),
    ).toContain("No special device fallback");
  });
});

describe("buildAttendanceCapabilityFallbacks", () => {
  it("flags blocked camera and location services with explicit fallback guidance", () => {
    const fallbacks = buildAttendanceCapabilityFallbacks({
      settings: baseSettings,
      cameraAvailable: false,
      cameraPermission: {
        granted: false,
        canAskAgain: false,
        status: "denied",
      },
      locationPermission: {
        granted: false,
        canAskAgain: false,
        status: "denied",
      },
      locationServicesEnabled: false,
    });

    expect(fallbacks.map((item) => item.key)).toEqual([
      "camera-unavailable",
      "location-services-disabled",
      "location-settings",
    ]);
    expect(fallbacks.every((item) => item.blocking)).toBe(true);
  });
});

describe("getAttendanceActionBlocker", () => {
  it("allows supported attendance submissions once evidence is present", () => {
    expect(
      getAttendanceActionBlocker({
        isSignedIn: true,
        hasAttendanceContext: true,
        attendanceComplete: false,
        settings: baseSettings,
        evidence: {
          selfieUri: "file://selfie.jpg",
          locationData: { lat: 1, lng: 2 },
        },
      }),
    ).toBeNull();
  });

  it("blocks unsupported capability paths before asking for more evidence", () => {
    expect(
      getAttendanceActionBlocker({
        isSignedIn: true,
        hasAttendanceContext: true,
        attendanceComplete: false,
        settings: baseSettings,
        capabilityFallbacks: [
          {
            key: "camera-unavailable",
            title: "Camera unavailable",
            body: "Use a supported device before continuing.",
            blocking: true,
          },
        ],
      }),
    ).toBe("Use a supported device before continuing.");
  });

  it("keeps the existing location validation copy for geofence-backed shifts", () => {
    expect(
      getAttendanceActionBlocker({
        isSignedIn: true,
        hasAttendanceContext: true,
        attendanceComplete: false,
        settings: baseSettings,
        evidence: {
          selfieUri: "file://selfie.jpg",
        },
      }),
    ).toBe(
      "Location capture is required so geofence checks can run before attendance is submitted.",
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  DEFAULT_NOTIFY_DAYS_BEFORE,
  matchNotificationThreshold,
  normalizeThresholds,
  notificationDateKey,
  resolveDaysRemaining,
  resolveDocumentStatus,
} from "./documentExpiryHelpers";

describe("documentExpiryHelpers", () => {
  it("normalizes thresholds and falls back to defaults", () => {
    expect(normalizeThresholds()).toEqual(DEFAULT_NOTIFY_DAYS_BEFORE);
    expect(normalizeThresholds([30, 90, 30, 0, -1])).toEqual([90, 30, 0]);
  });

  it("computes whole-day remaining values in UTC", () => {
    expect(resolveDaysRemaining("2026-04-10", new Date("2026-04-10T13:00:00.000Z"))).toBe(0);
    expect(resolveDaysRemaining("2026-04-10", new Date("2026-04-09T23:59:00.000Z"))).toBe(1);
    expect(resolveDaysRemaining("2026-04-10", new Date("2026-04-12T00:01:00.000Z"))).toBe(-2);
  });

  it("maps days remaining into status bands", () => {
    expect(resolveDocumentStatus(10)).toBe("critical");
    expect(resolveDocumentStatus(60)).toBe("warning");
    expect(resolveDocumentStatus(120)).toBe("good");
  });

  it("matches exact thresholds and collapses overdue docs into the expired alert", () => {
    expect(matchNotificationThreshold(90, [90, 60, 30, 0])).toBe(90);
    expect(matchNotificationThreshold(0, [90, 60, 30, 0])).toBe(0);
    expect(matchNotificationThreshold(-6, [90, 60, 30, 0])).toBe(0);
    expect(matchNotificationThreshold(45, [90, 60, 30, 0])).toBeNull();
  });

  it("emits stable YYYY-MM-DD notification keys", () => {
    expect(notificationDateKey(new Date("2026-03-27T14:00:00.000Z"))).toBe("2026-03-27");
  });
});

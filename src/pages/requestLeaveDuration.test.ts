import { describe, expect, it } from "vitest";

import { normalizeLeaveDuration, toHalfDayType } from "./requestLeaveDuration";

describe("requestLeaveDuration", () => {
  it("omits halfDayType for full day requests", () => {
    expect(toHalfDayType("full")).toBeUndefined();
  });

  it("preserves explicit half day selections", () => {
    expect(toHalfDayType("start")).toBe("start");
    expect(toHalfDayType("end")).toBe("end");
    expect(toHalfDayType("single")).toBe("single");
  });

  it("resets stale single-day selections when the range becomes multi-day", () => {
    expect(normalizeLeaveDuration("single", "2026-03-10", "2026-03-12")).toBe("full");
  });

  it("keeps single-day selections for same-day requests", () => {
    expect(normalizeLeaveDuration("single", "2026-03-10", "2026-03-10")).toBe("single");
  });
});

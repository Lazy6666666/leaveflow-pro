import { describe, expect, it } from "vitest";

import { buildReplayKey, getClientIp, hashString } from "./httpSecurity";

describe("http security helpers", () => {
  it("prefers the first forwarded ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.10, 203.0.113.5",
      "cf-connecting-ip": "203.0.113.8",
    });

    expect(getClientIp(headers)).toBe("198.51.100.10");
  });

  it("produces a stable string hash", () => {
    expect(hashString("payload")).toBe(hashString("payload"));
    expect(hashString("payload")).not.toBe(hashString("payload-2"));
  });

  it("joins replay key parts without empty segments", () => {
    expect(buildReplayKey(["bio", undefined, "abc"])).toBe("bio:abc");
  });
});

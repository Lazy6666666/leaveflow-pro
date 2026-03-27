import { describe, expect, it } from "vitest";

import { resolveMobileRoleState } from "./mobileRoles";

describe("resolveMobileRoleState", () => {
  it("falls back to employee when a signed-in runtime has no mirrored roles yet", () => {
    expect(resolveMobileRoleState([], true)).toEqual({
      roles: ["employee"],
      primaryRole: "employee",
      hasManagerAccess: false,
    });
  });

  it("preserves explicit manager roles and unlocks manager access", () => {
    expect(resolveMobileRoleState(["manager"], true)).toEqual({
      roles: ["manager"],
      primaryRole: "manager",
      hasManagerAccess: true,
    });
  });

  it("prioritizes hr_admin as the primary role", () => {
    expect(resolveMobileRoleState(["employee", "hr_admin"], true)).toEqual({
      roles: ["employee", "hr_admin"],
      primaryRole: "hr_admin",
      hasManagerAccess: true,
    });
  });

  it("keeps signed-out runtimes empty while defaulting primary role safely", () => {
    expect(resolveMobileRoleState(undefined, false)).toEqual({
      roles: [],
      primaryRole: "employee",
      hasManagerAccess: false,
    });
  });
});

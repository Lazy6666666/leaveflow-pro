import { describe, expect, it } from "vitest";

import { EMPLOYEE_TABS, MANAGER_TABS, getMobileTabs } from "./mobileTabs";

describe("getMobileTabs", () => {
  it("returns employee tabs when manager access is off", () => {
    expect(getMobileTabs(false)).toEqual(EMPLOYEE_TABS);
  });

  it("returns manager tabs when manager access is on", () => {
    expect(getMobileTabs(true)).toEqual(MANAGER_TABS);
  });
});

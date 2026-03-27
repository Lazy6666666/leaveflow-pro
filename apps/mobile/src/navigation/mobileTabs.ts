export const EMPLOYEE_TABS = ["Home", "History", "Account"] as const;
export const MANAGER_TABS = ["Team", "Approvals", "Schedule", "Reports"] as const;

export function getMobileTabs(hasManagerAccess: boolean) {
  return hasManagerAccess ? MANAGER_TABS : EMPLOYEE_TABS;
}

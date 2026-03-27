import type { MobileRole } from "./MobileRuntimeContext";

export type MobileRoleState = {
  roles: MobileRole[];
  primaryRole: MobileRole;
  hasManagerAccess: boolean;
};

export function resolveMobileRoleState(
  roles: MobileRole[] | undefined,
  isSignedIn: boolean,
): MobileRoleState {
  const fallbackRoles: MobileRole[] = isSignedIn ? ["employee"] : [];
  const resolvedRoles = roles && roles.length > 0 ? roles : fallbackRoles;
  const primaryRole = resolvedRoles.includes("hr_admin")
    ? "hr_admin"
    : resolvedRoles.includes("manager")
      ? "manager"
      : "employee";

  return {
    roles: resolvedRoles,
    primaryRole,
    hasManagerAccess:
      resolvedRoles.includes("manager") || resolvedRoles.includes("hr_admin"),
  };
}

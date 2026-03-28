import { useCallback, useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "../../convex/constants";

export function useRole() {
  const { roles, hasRole, hasExplicitRole, hasManagerAccess } = useAuth();

  const can = useCallback((role: AppRole) => hasRole(role), [hasRole]);

  const flags = useMemo(() => {
    const isEmployee = roles.includes("employee");
    const isAdmin = roles.includes("hr_admin") || roles.includes("convex_dev") || roles.includes("dev");
    const isDeveloper = roles.includes("convex_dev") || roles.includes("dev");

    return {
      isEmployee,
      isManager: hasManagerAccess,
      isAdmin,
      isDeveloper,
    };
  }, [hasManagerAccess, roles]);

  return {
    roles,
    ...flags,
    can,
    hasExplicitRole,
  };
}


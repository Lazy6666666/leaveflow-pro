import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useConvex } from "convex/react";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { claimTrackOnce, getAnalyticsSessionId, getAnalyticsSurface, getRoleScope } from "@/lib/analytics";

export function useAnalytics() {
  const location = useLocation();
  const convex = useConvex();
  const { roles, hasManagerAccess } = useAuth();

  const track = useCallback(
    async (eventName: string, properties?: Record<string, unknown>, options?: { path?: string; surface?: string }) => {
      if (!convex) {
        return;
      }

      try {
        await convex.mutation(api.analytics.track, {
          eventName,
          sessionId: getAnalyticsSessionId(),
          roleScope: getRoleScope(roles, hasManagerAccess),
          path: options?.path ?? location.pathname,
          surface: options?.surface ?? getAnalyticsSurface(options?.path ?? location.pathname),
          properties,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Analytics must never interrupt product flows.
      }
    },
    [convex, hasManagerAccess, location.pathname, roles],
  );

  const trackOnce = useCallback(
    async (key: string, eventName: string, properties?: Record<string, unknown>, options?: { path?: string; surface?: string }) => {
      if (!claimTrackOnce(key)) {
        return;
      }

      await track(eventName, properties, options);
    },
    [track],
  );

  return {
    sessionId: getAnalyticsSessionId(),
    roleScope: getRoleScope(roles, hasManagerAccess),
    surface: getAnalyticsSurface(location.pathname),
    track,
    trackOnce,
  };
}

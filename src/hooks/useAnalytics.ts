import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "convex/react";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/convexApi";
import { claimTrackOnce, getAnalyticsSessionId, getAnalyticsSurface, getRoleScope } from "@/lib/analytics";

export function useAnalytics() {
  const location = useLocation();
  const { roles, hasManagerAccess } = useAuth();
  const trackMutation = useMutation(api.analytics.track);

  const track = useCallback(
    async (eventName: string, properties?: Record<string, unknown>, options?: { path?: string; surface?: string }) => {
      try {
        await trackMutation({
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
    [hasManagerAccess, location.pathname, roles, trackMutation],
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

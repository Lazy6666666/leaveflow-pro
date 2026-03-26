import { useEffect, useRef, useState } from "react";

import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useAuth } from "@/contexts/AuthContext";

export function useConflictCheck(startDate: string, endDate: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!startDate || !endDate || !userId) {
      setConflictWarning(null);
      setChecking(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setChecking(true);
    setConflictWarning(null);

    const timeout = window.setTimeout(async () => {
      try {
        const data = await convex.query(api.leave.getConflictSummary, { startDate, endDate });
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (data && data.count > 0) {
          const count = data.count;
          const nameList = data.names.filter(Boolean);

          if (count >= 3) {
            setConflictWarning(
              `Warning: ${count} team members are already off during these dates${
                nameList.length > 0
                  ? `: ${nameList.slice(0, 3).join(", ")}${count > 3 ? ` and ${count - 3} more` : ""}`
                  : ""
              }. Consider choosing different dates.`,
            );
          } else {
            setConflictWarning(
              `${count} team member${count > 1 ? "s" : ""} already off during these dates${
                nameList.length > 0 ? `: ${nameList.join(", ")}` : ""
              }.`,
            );
          }
        } else {
          setConflictWarning(null);
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setConflictWarning(null);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setChecking(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [endDate, startDate, userId]);

  return { conflictWarning, checking };
}


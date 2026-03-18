import { useCallback, useEffect, useRef, useState } from "react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

import { convex } from "@/lib/convex";

type QueryRef = FunctionReference<"query">;

export function useConvexQuery<TQuery extends QueryRef>(
  queryFn: TQuery,
  args: FunctionArgs<TQuery>,
  deps: readonly unknown[] = [],
  options?: { enabled?: boolean },
) {
  const argsRef = useRef(args);
  argsRef.current = args;
  const enabled = options?.enabled ?? true;

  const [data, setData] = useState<FunctionReturnType<TQuery> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await convex.query(queryFn, argsRef.current);
      if (requestIdRef.current === requestId) {
        setData(result as FunctionReturnType<TQuery>);
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : "Query failed");
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
    // deps is intentionally variadic: the caller provides the concrete values that should trigger refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryFn, ...deps]);

  useEffect(() => {
    void run();
  }, [enabled, run]);

  return { data, loading, error, refetch: run };
}

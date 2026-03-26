import { useCallback, useEffect, useRef, useState } from "react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

import { convex } from "@/lib/convex";

type QueryRef = FunctionReference<"query">;
type QuerySpec<TQuery extends QueryRef = QueryRef> = readonly [TQuery, FunctionArgs<TQuery>];
type QueryMap = Record<string, QuerySpec>;
type ResultMap<T extends QueryMap> = { [K in keyof T]: FunctionReturnType<T[K][0]> };

export function useConvexParallelQuery<T extends QueryMap>(
  queries: T,
  deps: readonly unknown[] = [],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  const [data, setData] = useState<Partial<ResultMap<T>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) {
      setData({});
      setError(null);
      setLoading(false);
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const keys = Object.keys(queriesRef.current) as (keyof T)[];
      const results = await Promise.all(keys.map((k) => convex.query(queriesRef.current[k][0], queriesRef.current[k][1])));
      if (requestIdRef.current === requestId) {
        const mapped = Object.fromEntries(keys.map((k, i) => [k, results[i]])) as ResultMap<T>;
        setData(mapped);
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
  }, [enabled, ...deps]);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, refetch: run };
}

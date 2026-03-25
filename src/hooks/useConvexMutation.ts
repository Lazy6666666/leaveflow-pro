import { useCallback, useRef, useState } from "react";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { toast } from "sonner";

import { convex } from "@/lib/convex";
import { getErrorMessage } from "@/lib/errors";

type MutationRef = FunctionReference<"mutation">;

export function useConvexMutation<TMutation extends MutationRef>(
  mutationFn: TMutation,
  options?: { successMessage?: string; errorFallback?: string },
) {
  const [loading, setLoading] = useState(false);

  // Avoid re-running the callback just because a caller passes a new options object.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (args: FunctionArgs<TMutation>): Promise<FunctionReturnType<TMutation> | null> => {
      setLoading(true);
      try {
        const result = await convex.mutation(mutationFn, args);
        if (optionsRef.current?.successMessage) {
          toast.success(optionsRef.current.successMessage);
        }
        return result as FunctionReturnType<TMutation>;
      } catch (err) {
        toast.error(getErrorMessage(err, optionsRef.current?.errorFallback ?? "Operation failed"));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn],
  );

  return { mutate, loading };
}


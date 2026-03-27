import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { useMobileRuntime } from "../providers/useMobileRuntime";

export type PendingApprovalPreview = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  manager_comment?: string | null;
  created_at: string;
  leave_types: {
    name: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export function useManagerApprovalsData() {
  const runtime = useMobileRuntime();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryArgs =
    runtime.isSignedIn && runtime.isLoaded && runtime.hasManagerAccess ? {} : "skip";
  const approvals = useQuery(api.leave.getPendingApprovals, queryArgs);
  const updateStatus = useMutation(api.leave.updateRequestStatus);

  async function submitDecision(args: {
    requestId: string;
    status: "approved" | "rejected";
    managerComment?: string;
  }) {
    setActionMessage(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      await updateStatus({
        requestId: args.requestId as never,
        status: args.status,
        managerComment: args.managerComment?.trim() || undefined,
      });
      setActionMessage(
        args.status === "approved" ? "Request approved." : "Request rejected.",
      );
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update the leave request.",
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    approvals: (approvals ?? []) as PendingApprovalPreview[],
    isLoading:
      runtime.isSignedIn && runtime.isLoaded && runtime.hasManagerAccess && approvals === undefined,
    isSubmitting,
    actionMessage,
    actionError,
    submitDecision,
  };
}

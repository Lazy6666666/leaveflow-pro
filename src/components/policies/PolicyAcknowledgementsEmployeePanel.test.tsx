// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PolicyAcknowledgementsEmployeePanel } from "./PolicyAcknowledgementsEmployeePanel";

const queryMock = vi.fn();
const mutationMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/convex", () => ({
  convex: {
    mutation: (...args: unknown[]) => mutationMock(...args),
    query: (...args: unknown[]) => queryMock(...args),
  },
}));

vi.mock("@/lib/wave3Api", () => ({
  wave3Api: {
    policyAcknowledgements: {
      acknowledgePolicy: "policyAcknowledgements:acknowledgePolicy",
      getMyPolicyAcknowledgements: "policyAcknowledgements:getMyPolicyAcknowledgements",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("PolicyAcknowledgementsEmployeePanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [
        {
          acknowledgedAt: null,
          assignedAt: "2026-03-25T10:00:00.000Z",
          dueDate: "2026-03-31",
          documentPreview: "Review the latest remote work guardrails",
          documentUpdatedAt: "2026-03-25T09:00:00.000Z",
          id: "ack_1",
          isOverdue: false,
          note: "Read before your next team sync",
          policyDocumentId: "policy_1",
          policyTitle: "Remote Work Policy",
          status: "pending",
        },
      ],
      summary: { acknowledged: 0, overdue: 0, pending: 1 },
    });
    mutationMock.mockResolvedValue({ id: "ack_1" });
  });

  it("acknowledges a pending policy", async () => {
    render(<PolicyAcknowledgementsEmployeePanel />);

    await waitFor(() => {
      expect(screen.getByText("Remote Work Policy")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /acknowledge/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith("policyAcknowledgements:acknowledgePolicy", {
        acknowledgementId: "ack_1",
      });
      expect(toastSuccessMock).toHaveBeenCalledWith("Policy acknowledged");
    });
  });
});

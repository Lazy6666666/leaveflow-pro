// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PerformanceReviewsPanel } from "./PerformanceReviewsPanel";

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

vi.mock("@/lib/wave2Api", () => ({
  wave2Api: {
    performanceReviews: {
      assignReview: "performanceReviews:assignReview",
      getPerformanceReviewData: "performanceReviews:getPerformanceReviewData",
      saveReviewCycle: "performanceReviews:saveReviewCycle",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("PerformanceReviewsPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [],
      cycles: [],
      profiles: [{ fullName: "Ada Employee", userId: "user_1" }],
    });
    mutationMock.mockResolvedValue({ id: "cycle_1", ok: true });
  });

  it("renders empty states", async () => {
    render(<PerformanceReviewsPanel />);

    expect(screen.getByText("Performance Reviews")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No review cycles yet.")).toBeInTheDocument();
      expect(screen.getByText("No review assignments yet.")).toBeInTheDocument();
    });
  });

  it("creates a review cycle", async () => {
    render(<PerformanceReviewsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new cycle/i }));
    fireEvent.change(screen.getByLabelText(/cycle name/i), { target: { value: "2026 Annual Review" } });
    fireEvent.click(screen.getByRole("button", { name: /create cycle/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "performanceReviews:saveReviewCycle",
        expect.objectContaining({ name: "2026 Annual Review" }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Review cycle created");
    });
  });
});

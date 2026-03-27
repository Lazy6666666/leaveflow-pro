// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CareersPanel } from "./CareersPanel";

const actionMock = vi.fn();
const queryMock = vi.fn();
const mutationMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/convex", () => ({
  convex: {
    action: (...args: unknown[]) => actionMock(...args),
    mutation: (...args: unknown[]) => mutationMock(...args),
    query: (...args: unknown[]) => queryMock(...args),
  },
}));

vi.mock("@/lib/convexApi", () => ({
  api: {
    careers: {
      getCareersData: "careers:getCareersData",
      moveApplicationStage: "careers:moveApplicationStage",
      saveJobApplication: "careers:saveJobApplication",
      saveJobListing: "careers:saveJobListing",
      syncExternalSource: "careers:syncExternalSource",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("CareersPanel", () => {
  beforeEach(() => {
    actionMock.mockReset();
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      applications: [],
      listings: [],
    });
    actionMock.mockResolvedValue({ imported: 3, note: "Imported 3 external listings from greenhouse." });
    mutationMock.mockResolvedValue({ id: "listing_1", ok: true });
  });

  it("renders the careers shell and loads empty state", async () => {
    render(<CareersPanel />);

    expect(screen.getByText("Careers Pipeline")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No careers openings yet.")).toBeInTheDocument();
      expect(screen.getByText("No applicants yet.")).toBeInTheDocument();
    });
  });

  it("creates a new opening", async () => {
    render(<CareersPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new opening/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "People Partner" } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Dubai" } });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith("careers:saveJobListing", expect.objectContaining({ title: "People Partner" }));
      expect(toastSuccessMock).toHaveBeenCalledWith("Career opening created");
    });
  });

  it("syncs an external source", async () => {
    render(<CareersPanel />);

    fireEvent.click(screen.getByRole("button", { name: /sync external/i }));

    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledWith("careers:syncExternalSource", { provider: "greenhouse" });
      expect(toastSuccessMock).toHaveBeenCalledWith("Imported 3 external listings from greenhouse.");
    });
  });
});

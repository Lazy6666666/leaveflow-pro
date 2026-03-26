// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingPanel } from "./OnboardingPanel";

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

vi.mock("@/lib/convexApi", () => ({
  api: {
    admin: {
      getDepartments: "admin:getDepartments",
      saveDepartment: "admin:saveDepartment",
    },
    onboarding: {
      assignTemplate: "onboarding:assignTemplate",
      completeAssignmentTask: "onboarding:completeAssignmentTask",
      getOnboardingData: "onboarding:getOnboardingData",
      saveTemplate: "onboarding:saveTemplate",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("OnboardingPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [],
      profiles: [{ fullName: "Ava Recruit", userId: "user_1" }],
      templates: [],
    });
    mutationMock.mockResolvedValue({ id: "template_1", ok: true });
  });

  it("renders the onboarding shell and loads empty state", async () => {
    render(<OnboardingPanel />);

    expect(screen.getByText("Onboarding Checklists")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No onboarding templates yet.")).toBeInTheDocument();
      expect(screen.getByText("No onboarding assignments yet.")).toBeInTheDocument();
    });
  });

  it("creates an onboarding template", async () => {
    render(<OnboardingPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new template/i }));
    fireEvent.change(screen.getByLabelText(/template name/i), { target: { value: "New Hire Week 1" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Starter checklist" } });
    fireEvent.change(screen.getByLabelText(/tasks/i), { target: { value: "Sign policy" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    fireEvent.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "onboarding:saveTemplate",
        expect.objectContaining({ name: "New Hire Week 1" }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Template created");
    });
  });
});

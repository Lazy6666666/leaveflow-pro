// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecruitmentPanel } from "./RecruitmentPanel";

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
    recruitment: {
      getRecruitmentData: "recruitment:getRecruitmentData",
      moveCandidateStage: "recruitment:moveCandidateStage",
      saveCandidate: "recruitment:saveCandidate",
      saveJob: "recruitment:saveJob",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("RecruitmentPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      candidates: [],
      jobs: [],
    });
    mutationMock.mockResolvedValue({ id: "job_1", ok: true });
  });

  it("renders the recruitment shell and loads empty state", async () => {
    render(<RecruitmentPanel />);

    expect(screen.getByText("Recruitment Pipeline")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No recruitment roles yet.")).toBeInTheDocument();
      expect(screen.getByText("No candidates added yet.")).toBeInTheDocument();
    });
  });

  it("creates a new job", async () => {
    render(<RecruitmentPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new job/i }));
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Recruiter" } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Dubai" } });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith("recruitment:saveJob", expect.objectContaining({ title: "Recruiter" }));
      expect(toastSuccessMock).toHaveBeenCalledWith("Job created");
    });
  });
});

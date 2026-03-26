// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TrainingCenterPanel } from "./TrainingCenterPanel";

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
    training: {
      assignCourse: "training:assignCourse",
      getTrainingData: "training:getTrainingData",
      saveCertification: "training:saveCertification",
      saveCourse: "training:saveCourse",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("TrainingCenterPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [],
      certifications: [],
      courses: [],
      profiles: [{ fullName: "Ava Team", userId: "user_1" }],
    });
    mutationMock.mockResolvedValue({ id: "course_1", ok: true });
  });

  it("renders empty states", async () => {
    render(<TrainingCenterPanel />);

    expect(screen.getByText("Training Center")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No training courses yet.")).toBeInTheDocument();
      expect(screen.getByText("No training assignments yet.")).toBeInTheDocument();
    });
  });

  it("creates a training course", async () => {
    render(<TrainingCenterPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new course/i }));
    fireEvent.change(screen.getByLabelText(/course name/i), { target: { value: "Security Basics" } });
    fireEvent.click(screen.getByRole("button", { name: /create course/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "training:saveCourse",
        expect.objectContaining({ name: "Security Basics" }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Course created");
    });
  });
});

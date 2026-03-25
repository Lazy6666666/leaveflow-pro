// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AIWorkspace from "./AIWorkspace";

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const mockUseAuth = vi.fn();
const { mockToastSuccess, mockToastError, mockWriteText } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockWriteText: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: vi.fn(),
    trackOnce: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock("@/components/AIChatPanel", () => ({
  default: ({ mode }: { mode?: string }) => <div data-testid="ai-chat-panel">chat:{mode ?? "floating"}</div>,
}));

const renderWorkspace = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <AIWorkspace />
    </MemoryRouter>,
  );

const getStatusCard = (label: string) => {
  const cardLabel = screen.getByText(label);
  const card = cardLabel.closest("div");

  expect(card).not.toBeNull();

  return card as HTMLElement;
};

const getQuickLinksSection = () => {
  const quickLinksHeading = screen.getByText("Quick links");
  const quickLinksSection = quickLinksHeading.closest("div");

  expect(quickLinksSection).not.toBeNull();

  return quickLinksSection as HTMLElement;
};

describe("AIWorkspace", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockWriteText.mockReset();

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });
  });

  it("shows only the employee section for a standard user", () => {
    mockUseAuth.mockReturnValue({
      hasRole: () => false,
      hasManagerAccess: false,
    });

    renderWorkspace();

    expect(screen.getByText("Employee workflows")).toBeInTheDocument();
    expect(screen.queryByText("HR admin workflows")).not.toBeInTheDocument();
    expect(screen.getByText("Plan time off")).toBeInTheDocument();
    expect(screen.queryByText("Open policies")).not.toBeInTheDocument();
    expect(screen.getByText("Curated prompts visible from your current role scope.")).toBeInTheDocument();
    expect(within(getStatusCard("Prompt starters")).getByText("3")).toBeInTheDocument();
    expect(within(getStatusCard("Current role access")).getByText("Employee")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-panel")).toHaveTextContent("chat:embedded");
  });

  it("adds the HR admin section and keeps quick links unique when the role is present", () => {
    mockUseAuth.mockReturnValue({
      hasRole: (role: string) => role === "hr_admin",
      hasManagerAccess: true,
    });

    renderWorkspace();

    expect(screen.getByText("Employee workflows")).toBeInTheDocument();
    expect(screen.getByText("HR admin workflows")).toBeInTheDocument();
    expect(screen.getByText("Coverage conflict review")).toBeInTheDocument();
    expect(screen.getAllByText("Open policies").length).toBeGreaterThan(0);

    const quickLinks = within(getQuickLinksSection()).getAllByRole("link");
    expect(quickLinks).toHaveLength(7);
    expect(within(getQuickLinksSection()).getByRole("link", { name: "Open reports" })).toBeInTheDocument();
    expect(within(getQuickLinksSection()).queryByRole("link", { name: "Review payroll insights" })).not.toBeInTheDocument();
  });

  it("shows manager workflows without exposing HR admin workflows to managers", () => {
    mockUseAuth.mockReturnValue({
      hasRole: () => false,
      hasManagerAccess: true,
    });

    renderWorkspace();

    expect(screen.getByText("Manager workflows")).toBeInTheDocument();
    expect(screen.getByText("Prioritize approvals")).toBeInTheDocument();
    expect(screen.getByText("Manager continuity")).toBeInTheDocument();
    expect(screen.queryByText("HR admin workflows")).not.toBeInTheDocument();
    expect(within(getStatusCard("Current role access")).getByText("Employee + Manager")).toBeInTheDocument();
  });

  it("copies a starter prompt and surfaces the last copied prompt", async () => {
    mockUseAuth.mockReturnValue({
      hasRole: () => false,
      hasManagerAccess: false,
    });
    mockWriteText.mockResolvedValue(undefined);

    renderWorkspace();

    fireEvent.click(screen.getAllByRole("button", { name: "Copy prompt" })[0]);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        "Review my leave balance, highlight the best bridge days around upcoming holidays, and suggest the smartest dates for a short break.",
      );
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Prompt copied. Continue in the BALANCE AI copilot.");
    expect(screen.getByText("Last copied prompt")).toBeInTheDocument();
  });

  it("shows an error toast when clipboard access is unavailable", () => {
    mockUseAuth.mockReturnValue({
      hasRole: () => false,
      hasManagerAccess: false,
    });

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    renderWorkspace();

    fireEvent.click(screen.getAllByRole("button", { name: "Copy prompt" })[0]);

    expect(mockToastError).toHaveBeenCalledWith("Clipboard access is not available in this browser.");
    expect(screen.queryByText("Last copied prompt")).not.toBeInTheDocument();
  });
});

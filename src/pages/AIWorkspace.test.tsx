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
  default: ({
    mode,
    initialPromptRequest,
  }: {
    mode?: string;
    initialPromptRequest?: { prompt: string } | null;
  }) => <div data-testid="ai-chat-panel">chat:{mode ?? "floating"}:{initialPromptRequest?.prompt ?? "idle"}</div>,
}));

const renderWorkspace = () =>
  render(
    <MemoryRouter future={routerFuture}>
      <AIWorkspace />
    </MemoryRouter>,
  );

function setAuthState(hasRole: (role: string) => boolean, hasManagerAccess: boolean) {
  mockUseAuth.mockReturnValue({
    hasRole,
    hasManagerAccess,
  });
}

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
    setAuthState(() => false, false);

    renderWorkspace();

    expect(screen.getByText("Employee workflows")).toBeInTheDocument();
    expect(screen.queryByText("HR admin workflows")).not.toBeInTheDocument();
    expect(screen.getByText("Plan time off")).toBeInTheDocument();
    expect(screen.getByText("Bridge-day suggestion ready")).toBeInTheDocument();
    expect(screen.queryByText("Open policies")).not.toBeInTheDocument();
    expect(screen.getByText("Curated prompts visible from your current role scope.")).toBeInTheDocument();
    expect(within(getStatusCard("Prompt starters")).getByText("3")).toBeInTheDocument();
    expect(within(getStatusCard("Current role access")).getByText("Employee")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-panel")).toHaveTextContent("chat:embedded:idle");
  });

  it("adds the HR admin section and keeps quick links unique when the role is present", () => {
    setAuthState((role: string) => role === "hr_admin", true);

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
    setAuthState(() => false, true);

    renderWorkspace();

    expect(screen.getByText("Manager workflows")).toBeInTheDocument();
    expect(screen.getByText("Prioritize approvals")).toBeInTheDocument();
    expect(screen.getByText("Manager continuity")).toBeInTheDocument();
    expect(screen.queryByText("HR admin workflows")).not.toBeInTheDocument();
    expect(within(getStatusCard("Current role access")).getByText("Employee + Manager")).toBeInTheDocument();
  });

  it("copies a starter prompt and surfaces the last copied prompt", async () => {
    setAuthState(() => false, false);
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

  it("sends an action-feed prompt into the embedded copilot", () => {
    setAuthState(() => false, false);

    renderWorkspace();

    const feedCard = screen.getByText("Bridge-day suggestion ready").closest("article");
    expect(feedCard).not.toBeNull();

    fireEvent.click(within(feedCard as HTMLElement).getByRole("button", { name: "Ask BALANCE AI" }));

    expect(screen.getByTestId("ai-chat-panel")).toHaveTextContent(
      "Suggest the smartest leave dates around upcoming holidays and explain the best bridge-day option for me.",
    );
  });

  it("shows an error toast when clipboard access is unavailable", () => {
    setAuthState(() => false, false);

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

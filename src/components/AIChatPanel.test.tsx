// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/convexApi";
import AIChatPanel from "./AIChatPanel";

const mockUseAuth = vi.fn();
const mockTrack = vi.fn();
const mockUseAction = vi.fn();
const mockChatWithPuter = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: mockTrack,
  }),
}));

vi.mock("convex/react", () => ({
  useAction: (...args: unknown[]) => mockUseAction(...args),
}));

vi.mock("@/lib/puterChat", () => ({
  chatWithPuter: (...args: unknown[]) => mockChatWithPuter(...args),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ComponentPropsWithoutRef<"button">) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: ComponentPropsWithoutRef<"input">) => <input {...props} />,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, ...props }: ComponentPropsWithoutRef<"div"> & { children: ReactNode }) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: ComponentPropsWithoutRef<"span">) => <span {...props}>{children}</span>,
}));

function configureProviders({
  chatAction,
  runToolAction,
  puterResponse,
}: {
  chatAction?: ReturnType<typeof vi.fn>;
  runToolAction?: ReturnType<typeof vi.fn>;
  puterResponse: Awaited<ReturnType<typeof mockChatWithPuter>>;
}) {
  const resolvedChatAction = chatAction ?? vi.fn();
  const resolvedRunToolAction = runToolAction ?? vi.fn();

  mockUseAction.mockImplementation((reference) => (
    reference === api.assistant.runTool ? resolvedRunToolAction : resolvedChatAction
  ));
  mockChatWithPuter.mockResolvedValue(puterResponse);

  return {
    chatAction: resolvedChatAction,
    runToolAction: resolvedRunToolAction,
  };
}

describe("AIChatPanel", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockTrack.mockReset();
    mockUseAction.mockReset();
    mockChatWithPuter.mockReset();

    mockUseAuth.mockReturnValue({
      hasRole: () => false,
    });
  });

  it("uses Puter as the primary provider when available", async () => {
    const { chatAction, runToolAction } = configureProviders({
      puterResponse: {
        ok: true,
        message: "Puter handled this.",
        source: "puter",
        sourceReason: "puter",
      },
    });

    render(<AIChatPanel mode="embedded" />);

    fireEvent.change(screen.getByLabelText("Ask the AI assistant a question"), {
      target: { value: "What is my leave balance?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByText("Puter handled this.")).toBeInTheDocument();
    });

    expect(mockChatWithPuter).toHaveBeenCalledTimes(1);
    expect(chatAction).not.toHaveBeenCalled();
    expect(runToolAction).not.toHaveBeenCalled();
    expect(screen.getByText("Puter AI")).toBeInTheDocument();
  });

  it("falls back to the existing assistant action when Puter is unavailable", async () => {
    const chatAction = vi.fn().mockResolvedValue({
      message: "Mistral handled this.",
      source: "mistral",
      sourceReason: "mistral",
    });
    configureProviders({
      chatAction,
      puterResponse: {
        ok: false,
        reason: "auth_failed",
      },
    });

    render(<AIChatPanel mode="embedded" />);

    fireEvent.change(screen.getByLabelText("Ask the AI assistant a question"), {
      target: { value: "Show my leave history." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByText("Mistral handled this.")).toBeInTheDocument();
    });

    expect(mockChatWithPuter).toHaveBeenCalledTimes(1);
    expect(chatAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Mistral AI")).toBeInTheDocument();
  });

  it("shows a system rate-limit message without falling back when Puter tool execution is limited", async () => {
    const { chatAction } = configureProviders({
      puterResponse: {
        ok: false,
        reason: "rate_limited",
        message: "Too many assistant tools in a short period. Please wait about 30 seconds and try again.",
      },
    });

    render(<AIChatPanel mode="embedded" />);

    fireEvent.change(screen.getByLabelText("Ask the AI assistant a question"), {
      target: { value: "Check policy and payroll." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByText("Too many assistant tools in a short period. Please wait about 30 seconds and try again.")).toBeInTheDocument();
    });

    expect(chatAction).not.toHaveBeenCalled();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("auto-submits a workspace prompt request when provided", async () => {
    configureProviders({
      puterResponse: {
        ok: true,
        message: "Prompt request handled.",
        source: "puter",
        sourceReason: "puter",
      },
    });

    render(
      <AIChatPanel
        mode="embedded"
        initialPromptRequest={{
          id: "feed-1",
          prompt: "Check my team coverage for next week.",
        }}
      />,
    );

    await waitFor(() => {
      expect(mockChatWithPuter).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "Check my team coverage for next week." }],
        }),
      );
      expect(screen.getByText("Prompt request handled.")).toBeInTheDocument();
    });
  });
});

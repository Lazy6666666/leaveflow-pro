// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "./CommandPalette";

const trackMock = vi.fn();
const navigateMock = vi.fn();

const ResizeObserverMock = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const authState: {
  hasFeature: (feature: string) => boolean;
  hasManagerAccess: boolean;
  hasRole: (role: string) => boolean;
  needsAdminSetup: boolean;
} = {
  hasFeature: (_feature: string) => false,
  hasManagerAccess: false,
  hasRole: (role: string) => role === "employee",
  needsAdminSetup: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: trackMock,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("CommandPalette", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    trackMock.mockReset();
    authState.hasFeature = (_feature: string) => false;
    authState.hasManagerAccess = false;
    authState.hasRole = (role: string) => role === "employee";
    authState.needsAdminSetup = false;
  });

  it("opens from the keyboard shortcut and ignores editable targets", () => {
    const onOpenChange = vi.fn();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <CommandPalette open={false} onOpenChange={onOpenChange} onRequestLeave={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "k", ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("shows role-aware actions and admin setup when needed", () => {
    authState.hasFeature = (feature: string) =>
      ["manager_hub", "admin_system", "agent_workspace", "document_expiry"].includes(feature);
    authState.hasManagerAccess = true;
    authState.hasRole = (role: string) => role === "hr_admin";
    authState.needsAdminSetup = true;

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <CommandPalette open={true} onOpenChange={vi.fn()} onRequestLeave={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Manager Hub")).toBeInTheDocument();
    expect(screen.getByText("Careers")).toBeInTheDocument();
    expect(screen.getByText("HR Operations")).toBeInTheDocument();
    expect(screen.getByText("Agent Workspace")).toBeInTheDocument();
    expect(screen.getByText("Document Expiry")).toBeInTheDocument();
    expect(screen.queryByText("Admin Setup")).not.toBeInTheDocument();
  });

  it("runs the existing new request action", () => {
    const onRequestLeave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <CommandPalette open={true} onOpenChange={onOpenChange} onRequestLeave={onRequestLeave} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("New Request"));

    expect(onRequestLeave).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trackMock).toHaveBeenCalledWith(
      "command_palette_action_selected",
      expect.objectContaining({ action_id: "new-request" }),
      expect.objectContaining({ surface: "authenticated-shell" }),
    );
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import AppLayout from "./AppLayout";

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

vi.mock("@/components/AppSidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar">sidebar</div>,
  adminItems: [
    { href: "/careers", icon: () => null, label: "Careers" },
    { href: "/admin/hr-operations", icon: () => null, label: "HR Operations" },
    { href: "/admin/system", icon: () => null, label: "System Admin" },
  ],
  employeeItems: [
    { href: "/dashboard", icon: () => null, label: "Dashboard" },
    { href: "/ai-workspace", icon: () => null, label: "AI Workspace" },
    { href: "/my-leave", icon: () => null, label: "Leave & Time Off" },
    { href: "/attendance", icon: () => null, label: "Attendance" },
    { href: "/profile", icon: () => null, label: "Identity & Security" },
  ],
  managerItems: [{ href: "/manager/hub", icon: () => null, label: "Manager Hub" }],
}));

vi.mock("@/components/NotificationBell", () => ({
  default: () => <div data-testid="notification-bell">notifications</div>,
}));

vi.mock("@/components/AIChatPanel", () => ({
  default: ({ mode }: { mode?: string }) => <div data-testid="ai-chat-panel">chat:{mode ?? "floating"}</div>,
}));

vi.mock("@/components/ui/Logo", () => ({
  Logo: () => <div data-testid="app-logo">logo</div>,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    hasManagerAccess: false,
    hasRole: () => false,
    needsAdminSetup: false,
  }),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: vi.fn(),
  }),
}));

vi.mock("@/hooks/useOfflineQueue", () => ({
  useOfflineQueue: () => ({
    pendingCount: 0,
    drain: vi.fn(),
  }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarBody: (props: HTMLAttributes<HTMLDivElement>) => <div {...props} />,
}));

const renderLayoutAt = (pathname: string) =>
  render(
    <MemoryRouter
      initialEntries={[pathname]}
      future={routerFuture}
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<div>Outlet content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("AppLayout", () => {
  it("keeps the floating AI panel on non-workspace routes", () => {
    renderLayoutAt("/dashboard");

    expect(screen.getByText("Outlet content")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-panel")).toHaveTextContent("chat:floating");
    expect(screen.getByRole("button", { name: /open command palette/i })).toBeInTheDocument();
  });

  it("hides the floating AI panel on the dedicated AI workspace route", () => {
    renderLayoutAt("/ai-workspace");

    expect(screen.getByText("Outlet content")).toBeInTheDocument();
    expect(screen.queryByTestId("ai-chat-panel")).not.toBeInTheDocument();
  });

  it("opens the command palette from the keyboard shortcut", () => {
    renderLayoutAt("/dashboard");

    fireEvent.keyDown(window, { ctrlKey: true, key: "k" });

    expect(screen.getByPlaceholderText("Search navigation and actions...")).toBeInTheDocument();
  });
});

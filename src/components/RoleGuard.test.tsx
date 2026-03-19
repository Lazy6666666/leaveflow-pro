// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleGuard from "./RoleGuard";

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("RoleGuard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("redirects users without the required explicit role", () => {
    mockUseAuth.mockReturnValue({
      hasExplicitRole: () => false,
      hasRole: () => false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin/system"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route
            path="/admin/system"
            element={(
              <RoleGuard allowedRoles={["hr_admin"]}>
                <div>Admin system</div>
              </RoleGuard>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("allows delegated manager access when requested", () => {
    mockUseAuth.mockReturnValue({
      hasExplicitRole: () => false,
      hasRole: (role: string) => role === "manager",
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/manager/hub"]}>
        <Routes>
          <Route
            path="/manager/hub"
            element={(
              <RoleGuard allowedRoles={["manager"]} allowDelegatedManagerAccess>
                <div>Manager hub</div>
              </RoleGuard>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Manager hub")).toBeInTheDocument();
  });
});

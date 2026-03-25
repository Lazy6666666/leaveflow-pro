// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthGuard from "./AuthGuard";

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("redirects signed-out users to auth", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: false,
    });

    render(
      <MemoryRouter
        initialEntries={["/dashboard"]}
        future={routerFuture}
      >
        <Routes>
          <Route path="/auth" element={<div>Auth screen</div>} />
          <Route
            path="/dashboard"
            element={(
              <AuthGuard>
                <div>Private dashboard</div>
              </AuthGuard>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Auth screen")).toBeInTheDocument();
  });

  it("renders protected content for signed-in users", () => {
    mockUseAuth.mockReturnValue({
      session: { id: "session_1" },
      loading: false,
    });

    render(
      <MemoryRouter
        initialEntries={["/dashboard"]}
        future={routerFuture}
      >
        <Routes>
          <Route
            path="/dashboard"
            element={(
              <AuthGuard>
                <div>Private dashboard</div>
              </AuthGuard>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Private dashboard")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Auth from "./Auth";

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const mockUseAuth = vi.fn();
const mockUseTheme = vi.fn();
const mockTrackOnce = vi.fn();

vi.mock("@clerk/react", () => ({
  SignIn: () => <div>Mock Clerk Sign In</div>,
  SignUp: () => <div>Mock Clerk Sign Up</div>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackOnce: mockTrackOnce,
  }),
}));

vi.mock("@/components/ui/Logo", () => ({
  Logo: () => <div>Mock Logo</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

describe("Auth", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseTheme.mockReset();
    mockTrackOnce.mockReset();

    mockUseAuth.mockReturnValue({
      session: null,
      loading: false,
    });

    mockUseTheme.mockReturnValue({
      theme: "light",
      toggleTheme: vi.fn(),
    });
  });

  it("renders sign-in mode for the default auth route", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]} future={routerFuture}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Mock Clerk Sign In")).toBeInTheDocument();
  });

  it("renders sign-up mode when signup=true is present in the query string", () => {
    render(
      <MemoryRouter initialEntries={["/auth?signup=true"]} future={routerFuture}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByText("Mock Clerk Sign Up")).toBeInTheDocument();
  });
});

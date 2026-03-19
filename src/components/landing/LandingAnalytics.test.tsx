// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingCTA } from "./LandingCTA";
import { LandingHeroBg } from "./LandingHeroBg";
import { LandingNavbar } from "./LandingNavbar";

const mockTrack = vi.fn();

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: mockTrack,
  }),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: ComponentPropsWithoutRef<"span">) => <span {...props}>{children}</span>,
}));

describe("landing analytics", () => {
  beforeEach(() => {
    mockTrack.mockReset();
  });

  it("tracks current hero and final CTA clicks", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LandingHeroBg />
        <LandingCTA />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: /get started/i }));
    fireEvent.click(screen.getByRole("link", { name: /view infrastructure/i }));
    fireEvent.click(screen.getByRole("link", { name: /start trial/i }));
    fireEvent.click(screen.getByRole("link", { name: /explore engine/i }));

    expect(mockTrack).toHaveBeenCalledWith(
      "landing_cta_clicked",
      expect.objectContaining({ cta_location: "hero_primary", target_path: "/auth/register" }),
      expect.objectContaining({ surface: "landing", path: "/" }),
    );
    expect(mockTrack).toHaveBeenCalledWith(
      "landing_cta_clicked",
      expect.objectContaining({ cta_location: "hero_secondary", target_path: "#engine" }),
      expect.objectContaining({ surface: "landing", path: "/" }),
    );
    expect(mockTrack).toHaveBeenCalledWith(
      "landing_cta_clicked",
      expect.objectContaining({ cta_location: "final_cta_primary", target_path: "/auth/register" }),
      expect.objectContaining({ surface: "landing", path: "/" }),
    );
    expect(mockTrack).toHaveBeenCalledWith(
      "landing_cta_clicked",
      expect.objectContaining({ cta_location: "final_cta_secondary", target_path: "#product" }),
      expect.objectContaining({ surface: "landing", path: "/" }),
    );
  });

  it("tracks the current navbar trial CTA", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LandingNavbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: /start trial/i }));

    expect(mockTrack).toHaveBeenCalledWith(
      "landing_cta_clicked",
      expect.objectContaining({ cta_location: "navbar_primary", target_path: "/auth/register" }),
      expect.objectContaining({ surface: "landing", path: "/" }),
    );
  });
});

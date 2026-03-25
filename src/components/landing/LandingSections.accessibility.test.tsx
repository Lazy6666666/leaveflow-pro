// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { LandingCTA } from "./LandingCTA";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHeroBg } from "./LandingHeroBg";

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: vi.fn(),
  }),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>,
  );

describe("landing section accessibility", () => {
  it("uses links for the hero navigation actions", () => {
    renderWithRouter(<LandingHeroBg />);

    expect(screen.getByRole("link", { name: /deploy infrastructure/i })).toHaveAttribute(
      "href",
      "/auth/register",
    );
    expect(screen.getByRole("button", { name: /view documentation/i })).toBeInTheDocument();
  });

  it("marks below-the-fold landing imagery as lazy and dimensioned", () => {
    renderWithRouter(
      <>
        <LandingCTA />
        <LandingFeatures />
      </>,
    );

    screen.getAllByRole("img").forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("width");
      expect(image).toHaveAttribute("height");
    });
  });
});

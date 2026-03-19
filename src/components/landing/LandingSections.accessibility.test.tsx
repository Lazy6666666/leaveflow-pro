// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { LandingCTA } from "./LandingCTA";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHeroBg } from "./LandingHeroBg";

const renderWithRouter = (ui: React.ReactElement) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>,
  );

describe("landing section accessibility", () => {
  it("uses links for the hero navigation actions", () => {
    renderWithRouter(<LandingHeroBg />);

    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth/register",
    );
    expect(screen.getByRole("link", { name: /view infrastructure/i })).toHaveAttribute(
      "href",
      "#engine",
    );
  });

  it("marks below-the-fold landing imagery as lazy and dimensioned", () => {
    renderWithRouter(
      <>
        <LandingCTA />
        <LandingFeatures />
      </>,
    );

    const imageAlts = [
      "Professional collaboration",
      "Enterprise strategy",
      "Global Resilience Infrastructure",
      "Human Synergy",
    ];

    imageAlts.forEach((alt) => {
      const image = screen.getByAltText(alt);
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("width");
      expect(image).toHaveAttribute("height");
    });
  });
});

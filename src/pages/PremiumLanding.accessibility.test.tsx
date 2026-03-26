// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PremiumLanding } from "./PremiumLanding";

vi.mock("@/components/landing/LandingPreloader", () => ({
  LandingPreloader: () => null,
}));

vi.mock("@/components/landing/LandingNavbar", () => ({
  LandingNavbar: () => <nav aria-label="Primary">navigation</nav>,
}));

vi.mock("@/components/landing/LandingHeroBg", () => ({
  LandingHeroBg: () => <section>hero</section>,
}));

vi.mock("@/components/landing/LandingFeatures", () => ({
  LandingFeatures: () => <section>features</section>,
}));

vi.mock("@/components/landing/LandingTestimonials", () => ({
  LandingTestimonials: () => <section>testimonials</section>,
}));

vi.mock("@/components/landing/LandingCTA", () => ({
  LandingCTA: () => <section>cta</section>,
}));

describe("PremiumLanding accessibility shell", () => {
  it("provides a skip link and avoids placeholder footer links", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PremiumLanding />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute(
      "href",
      "#premium-landing-main",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "premium-landing-main");

    const placeholderLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "#");

    expect(placeholderLinks).toHaveLength(0);
  });
});

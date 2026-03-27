// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/pages/Index", async () => {
  const React = await import("react");
  const { useAnalytics } = await import("@/hooks/useAnalytics");

  return {
    default: function MockIndex() {
      const { trackOnce } = useAnalytics();

      React.useEffect(() => {
        void trackOnce("boot-recovery-landing", "landing_page_viewed", { source: "boot-recovery-test" });
      }, [trackOnce]);

      return <h1>Landing page recovered</h1>;
    },
  };
});

import { BootRecoveryApp } from "./BootRecoveryApp";

describe("BootRecoveryApp", () => {
  it("keeps the public landing route renderable when backend env is missing", () => {
    render(<BootRecoveryApp missing={["VITE_CONVEX_URL", "VITE_CLERK_PUBLISHABLE_KEY"]} />);

    expect(screen.getByText(/startup recovery/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open setup status/i })).toHaveAttribute("href", "/boot-recovery");
    expect(screen.getByRole("heading", { name: /landing page recovered/i })).toBeInTheDocument();
  });
});

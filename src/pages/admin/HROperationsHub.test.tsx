// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import HROperationsHub from "./HROperationsHub";

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children, value }: HTMLAttributes<HTMLDivElement> & { value?: string }) => (
    <div data-tabs-content={value}>{children}</div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: HTMLAttributes<HTMLButtonElement> & { value?: string }) => (
    <button role="tab" data-value={value}>{children}</button>
  ),
}));
vi.mock("./Employees", () => ({ default: () => <div>Employees panel</div> }));
vi.mock("./Departments", () => ({ default: () => <div>Departments panel</div> }));
vi.mock("./Balances", () => ({ default: () => <div>Balances panel</div> }));
vi.mock("./AttendanceDashboard", () => ({ default: () => <div>Attendance panel</div> }));
vi.mock("./Reports", () => ({ default: () => <div>Reports panel</div> }));
vi.mock("./AuditLog", () => ({ default: () => <div>Audit panel</div> }));
vi.mock("./TrustReviewQueue", () => ({ default: () => <div>Trust review panel</div> }));
vi.mock("@/components/careers/CareersPanel", () => ({ CareersPanel: () => <div>Careers panel</div> }));
vi.mock("@/components/onboarding/OnboardingPanel", () => ({ OnboardingPanel: () => <div>Onboarding panel</div> }));
vi.mock("@/components/reviews/PerformanceReviewsPanel", () => ({ PerformanceReviewsPanel: () => <div>Reviews panel</div> }));
vi.mock("@/components/training/TrainingCenterPanel", () => ({ TrainingCenterPanel: () => <div>Training panel</div> }));
vi.mock("@/components/training/CertificationsPanel", () => ({ CertificationsPanel: () => <div>Certifications panel</div> }));

describe("HROperationsHub", () => {
  it("shows Wave 1 tabs and selected tab content", () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/admin/hr-operations?tab=careers"]}>
          <Routes>
            <Route path="/admin/hr-operations" element={<HROperationsHub />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByRole("tab", { name: /careers/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /onboarding/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /reviews/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /training/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /certifications/i })).toBeInTheDocument();
    expect(screen.getByText("Careers panel")).toBeInTheDocument();
  });

  it("maps the legacy recruitment tab to careers content", () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/admin/hr-operations?tab=recruitment"]}>
          <Routes>
            <Route path="/admin/hr-operations" element={<HROperationsHub />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByRole("tab", { name: /careers/i })).toBeInTheDocument();
    expect(screen.getByText("Careers panel")).toBeInTheDocument();
  });
});

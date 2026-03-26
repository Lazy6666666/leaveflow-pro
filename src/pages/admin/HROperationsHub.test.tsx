// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import HROperationsHub from "./HROperationsHub";

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-tabs-content={value}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button role="tab" data-value={value}>{children}</button>,
}));
vi.mock("./Employees", () => ({ default: () => <div>Employees panel</div> }));
vi.mock("./Departments", () => ({ default: () => <div>Departments panel</div> }));
vi.mock("./Balances", () => ({ default: () => <div>Balances panel</div> }));
vi.mock("./AttendanceDashboard", () => ({ default: () => <div>Attendance panel</div> }));
vi.mock("./Reports", () => ({ default: () => <div>Reports panel</div> }));
vi.mock("./AuditLog", () => ({ default: () => <div>Audit panel</div> }));
vi.mock("./TrustReviewQueue", () => ({ default: () => <div>Trust review panel</div> }));
vi.mock("@/components/recruitment/RecruitmentPanel", () => ({ RecruitmentPanel: () => <div>Recruitment panel</div> }));
vi.mock("@/components/onboarding/OnboardingPanel", () => ({ OnboardingPanel: () => <div>Onboarding panel</div> }));
vi.mock("@/components/reviews/PerformanceReviewsPanel", () => ({ PerformanceReviewsPanel: () => <div>Reviews panel</div> }));
vi.mock("@/components/training/TrainingCenterPanel", () => ({ TrainingCenterPanel: () => <div>Training panel</div> }));
vi.mock("@/components/training/CertificationsPanel", () => ({ CertificationsPanel: () => <div>Certifications panel</div> }));

describe("HROperationsHub", () => {
  it("shows Wave 1 tabs and selected tab content", () => {
    render(
      <MemoryRouter initialEntries={["/admin/hr-operations?tab=recruitment"]}>
        <Routes>
          <Route path="/admin/hr-operations" element={<HROperationsHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("tab", { name: /recruitment/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /onboarding/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /reviews/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /training/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /certifications/i })).toBeInTheDocument();
    expect(screen.getByText("Recruitment panel")).toBeInTheDocument();
  });
});

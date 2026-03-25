// @vitest-environment jsdom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import SystemHub from "./SystemHub";

type TabsMockProps = {
  children?: ReactNode;
  value?: string;
};

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: TabsMockProps) => <div>{children}</div>,
  TabsContent: ({ children, value }: TabsMockProps) => <div data-tabs-content={value}>{children}</div>,
  TabsList: ({ children }: TabsMockProps) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: TabsMockProps) => <button role="tab" data-value={value}>{children}</button>,
}));
vi.mock("./Policies", () => ({ default: () => <div>Policies panel</div> }));
vi.mock("@/components/integrations/IntegrationsStatusPanel", () => ({ IntegrationsStatusPanel: () => <div>Integrations panel</div> }));
vi.mock("./SitesManagement", () => ({ default: () => <div>Sites panel</div> }));
vi.mock("./AttendanceSettings", () => ({ default: () => <div>Attendance config panel</div> }));
vi.mock("./BiometricsSettings", () => ({ default: () => <div>Biometrics panel</div> }));
vi.mock("./ShiftManagement", () => ({ default: () => <div>Shifts panel</div> }));
vi.mock("./RosterAssignment", () => ({ default: () => <div>Rosters panel</div> }));

describe("SystemHub", () => {
  it("shows the integrations tab and selected tab content", () => {
    render(
      <MemoryRouter initialEntries={["/admin/system?tab=integrations"]}>
        <Routes>
          <Route path="/admin/system" element={<SystemHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("tab", { name: /policies/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /integrations/i })).toBeInTheDocument();
    expect(screen.getByText("Integrations panel")).toBeInTheDocument();
  });
});

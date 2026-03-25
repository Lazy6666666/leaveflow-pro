// @vitest-environment jsdom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ManagerHub from "./ManagerHub";

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
vi.mock("./Approvals", () => ({ default: () => <div>Leave approvals panel</div> }));
vi.mock("./TeamCalendar", () => ({ default: () => <div>Calendar panel</div> }));
vi.mock("./TeamAttendance", () => ({ default: () => <div>Attendance panel</div> }));
vi.mock("./ManagerDelegation", () => ({ default: () => <div>Delegation panel</div> }));
vi.mock("@/components/expenses/ExpenseApprovalPanel", () => ({ ExpenseApprovalPanel: () => <div>Expense approvals panel</div> }));

describe("ManagerHub", () => {
  it("shows the expenses tab and selected tab content", () => {
    render(
      <MemoryRouter initialEntries={["/manager/hub?tab=expenses"]}>
        <Routes>
          <Route path="/manager/hub" element={<ManagerHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("tab", { name: /approvals/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /expenses/i })).toBeInTheDocument();
    expect(screen.getByText("Expense approvals panel")).toBeInTheDocument();
  });
});

// @vitest-environment jsdom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import IdentityHub from "./IdentityHub";

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
vi.mock("./ProfileSettings", () => ({ default: () => <div>Profile panel</div> }));
vi.mock("./employee/FaceEnrollment", () => ({ default: () => <div>Biometrics panel</div> }));
vi.mock("@/components/expenses/ExpenseEmployeePanel", () => ({ ExpenseEmployeePanel: () => <div>Expenses panel</div> }));
vi.mock("@/components/policies/PolicyAcknowledgementsEmployeePanel", () => ({ PolicyAcknowledgementsEmployeePanel: () => <div>Policies panel</div> }));

describe("IdentityHub", () => {
  it("shows the expenses tab and content", () => {
    render(
      <MemoryRouter initialEntries={["/identity-hub?tab=expenses"]}>
        <Routes>
          <Route path="/identity-hub" element={<IdentityHub />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /biometrics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /expenses/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /policies/i })).toBeInTheDocument();
    expect(screen.getByText("Expenses panel")).toBeInTheDocument();
  });
});

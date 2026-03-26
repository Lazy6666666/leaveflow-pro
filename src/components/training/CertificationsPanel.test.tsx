// @vitest-environment jsdom

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/select", () => {
  const SelectTrigger = (props: { id?: string }) => <div {...props} />;
  const SelectValue = () => null;
  const SelectContent = ({ children }: { children: React.ReactNode }) => children;
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );

  const Select = ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => {
    let options: React.ReactNode = null;
    let triggerId: string | undefined;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === SelectContent) {
          options = child.props.children;
        }
        if (child.type === SelectTrigger) {
          triggerId = child.props.id;
        }
      }
    });
    return (
      <select id={triggerId} value={value} onChange={(event) => onValueChange(event.target.value)}>
        {options}
      </select>
    );
  };

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

import { CertificationsPanel } from "./CertificationsPanel";

const queryMock = vi.fn();
const mutationMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/convex", () => ({
  convex: {
    mutation: (...args: unknown[]) => mutationMock(...args),
    query: (...args: unknown[]) => queryMock(...args),
  },
}));

vi.mock("@/lib/wave2Api", () => ({
  wave2Api: {
    training: {
      assignCourse: "training:assignCourse",
      getTrainingData: "training:getTrainingData",
      saveCertification: "training:saveCertification",
      saveCourse: "training:saveCourse",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("CertificationsPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue({
      assignments: [],
      certifications: [],
      courses: [],
      profiles: [{ fullName: "Mina Cert", userId: "user_1" }],
    });
    mutationMock.mockResolvedValue({ id: "cert_1", ok: true });
  });

  it("renders empty state", async () => {
    render(<CertificationsPanel />);

    expect(screen.getByText("Certifications")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No certifications recorded yet.")).toBeInTheDocument();
    });
  });

  it("opens the create certification dialog", async () => {
    render(<CertificationsPanel />);

    fireEvent.click(screen.getByRole("button", { name: /new certification/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/certification name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employee/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save certification/i })).toBeInTheDocument();
    });
  });
});

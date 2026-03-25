// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IntegrationsStatusPanel } from "./IntegrationsStatusPanel";

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

vi.mock("@/lib/wave3Api", () => ({
  wave3Api: {
    integrations: {
      getIntegrationSettings: "integrations:getIntegrationSettings",
      saveIntegrationSetting: "integrations:saveIntegrationSetting",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("IntegrationsStatusPanel", () => {
  beforeEach(() => {
    queryMock.mockReset();
    mutationMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    queryMock.mockResolvedValue([
      {
        configSummary: "Notifications only",
        description: "Route leave, attendance, and policy nudges into team channels.",
        enabled: false,
        id: null,
        key: "slack",
        lastCheckedAt: null,
        name: "Slack",
        status: "not_configured",
        updatedAt: null,
      },
    ]);
    mutationMock.mockResolvedValue({ id: "setting_1" });
  });

  it("renders and saves an integration draft", async () => {
    render(<IntegrationsStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText("Slack")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: "connected" } });
    fireEvent.change(screen.getByLabelText(/mode/i), { target: { value: "enabled" } });
    fireEvent.change(screen.getByLabelText(/configuration summary/i), { target: { value: "Channel + workflow hooks ready" } });
    fireEvent.click(screen.getByRole("button", { name: /save slack/i }));

    await waitFor(() => {
      expect(mutationMock).toHaveBeenCalledWith(
        "integrations:saveIntegrationSetting",
        expect.objectContaining({
          configSummary: "Channel + workflow hooks ready",
          enabled: true,
          providerKey: "slack",
          status: "connected",
        }),
      );
      expect(toastSuccessMock).toHaveBeenCalledWith("Slack settings saved");
    });
  });
});

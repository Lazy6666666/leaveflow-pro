// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationBell from "./NotificationBell";

const mockUseAuth = vi.fn();
const mockTrack = vi.fn();
const mockUseQuery = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
let mutationCallIndex = 0;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    track: mockTrack,
  }),
}));

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => {
    mutationCallIndex += 1;
    return mutationCallIndex === 1 ? mockMarkRead : mockMarkAllRead;
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: ComponentPropsWithoutRef<"button">) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("NotificationBell analytics", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockTrack.mockReset();
    mockUseQuery.mockReset();
    mockMarkRead.mockReset();
    mockMarkAllRead.mockReset();
    mutationCallIndex = 0;

    mockUseAuth.mockReturnValue({ user: { id: "user_1" } });
    mockUseQuery.mockReturnValue([
      {
        id: "notification_1",
        title: "Leave approved",
        message: "Your leave request was approved",
        type: "success",
        is_read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user_id: "user_1",
      },
    ]);
    mockMarkRead.mockResolvedValue({ ok: true });
    mockMarkAllRead.mockResolvedValue({ ok: true });
  });

  it("tracks opening and mark-all-read actions", async () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: /open notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /mark all read/i }));

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith("notifications_mark_all_read", expect.objectContaining({ unread_count: 1 }));
    });
  });

  it("tracks reading a notification", async () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: /leave approved/i }));

    await waitFor(() => {
      expect(mockTrack).toHaveBeenCalledWith(
        "notification_marked_read",
        expect.objectContaining({ notification_type: "success", notification_age_bucket: "under_1h" }),
      );
    });
  });
});

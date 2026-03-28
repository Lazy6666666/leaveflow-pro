import { api } from "../_generated/api";
import { registerTool } from "./toolRegistry";
import { z } from "zod";

registerTool({
  name: "get_leave_balance",
  description: "Fetch the current leave balances for the signed-in employee.",
  allowedRoles: ["employee", "manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({}).passthrough(),
  outputSchema: z.any(),
  handler: async (ctx) => await ctx.runQuery(api.leave.getMyBalances as never, {}),
});

registerTool({
  name: "get_leave_history",
  description: "Fetch recent leave requests for the signed-in employee.",
  allowedRoles: ["employee", "manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({}).passthrough(),
  outputSchema: z.any(),
  handler: async (ctx) => await ctx.runQuery(api.leave.getLeaveHistory as never, {}),
});

registerTool({
  name: "submit_leave_request",
  description: "Submit a leave request for the signed-in employee.",
  allowedRoles: ["employee"],
  category: "write",
  source: "local",
  inputSchema: z.object({
    leaveTypeId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().optional(),
  }),
  outputSchema: z.any(),
  handler: async (
    ctx,
    args,
  ) => {
    const { leaveTypeId, startDate, endDate, reason } = args as {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason?: string;
    };
    return await ctx.runMutation(api.leave.createRequest as never, {
      leaveTypeId,
      startDate,
      endDate,
      reason,
    });
  },
});

registerTool({
  name: "approve_leave_request",
  description: "Approve a pending leave request.",
  allowedRoles: ["manager", "hr_admin"],
  category: "write",
  source: "local",
  inputSchema: z.object({
    requestId: z.string(),
    managerComment: z.string().optional(),
  }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { requestId, managerComment } = args as { requestId: string; managerComment?: string };
    return await ctx.runMutation(api.leave.updateRequestStatus as never, {
      requestId,
      status: "approved",
      managerComment,
    });
  },
});

registerTool({
  name: "deny_leave_request",
  description: "Reject a pending leave request.",
  allowedRoles: ["manager", "hr_admin"],
  category: "write",
  source: "local",
  inputSchema: z.object({
    requestId: z.string(),
    managerComment: z.string().optional(),
  }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { requestId, managerComment } = args as { requestId: string; managerComment?: string };
    return await ctx.runMutation(api.leave.updateRequestStatus as never, {
      requestId,
      status: "rejected",
      managerComment,
    });
  },
});

registerTool({
  name: "get_pending_approvals",
  description: "Fetch pending leave approvals for managers or HR admins.",
  allowedRoles: ["manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({}).passthrough(),
  outputSchema: z.any(),
  handler: async (ctx) => await ctx.runQuery(api.leave.getPendingApprovals as never, {}),
});

registerTool({
  name: "get_team_attendance",
  description: "Fetch attendance dashboard data for managers or HR admins.",
  allowedRoles: ["manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({
    view: z.enum(["today", "month"]).optional(),
  }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { view = "today" } = (args as { view?: "today" | "month" }) ?? {};
    return await ctx.runQuery(api.attendanceAdmin.getAdminAttendanceDashboard as never, { view });
  },
});

registerTool({
  name: "get_attendance_summary",
  description: "Summarize attendance status counts for the requested view.",
  allowedRoles: ["manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({
    view: z.enum(["today", "month"]).optional(),
  }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { view = "today" } = (args as { view?: "today" | "month" }) ?? {};
    const dashboard = (await ctx.runQuery(
      api.attendanceAdmin.getAdminAttendanceDashboard as never,
      { view },
    )) as { logs?: Array<{ status: string }> };

    const summary = (dashboard.logs ?? []).reduce<Record<string, number>>((acc, log) => {
      acc[log.status] = (acc[log.status] ?? 0) + 1;
      return acc;
    }, {});

    return { view, summary, total: (dashboard.logs ?? []).length };
  },
});

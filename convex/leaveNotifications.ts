import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const getLeaveNotificationEmailPayload = internalQuery({
  args: {
    requestId: v.id("leaveRequests"),
    type: v.union(v.literal("submitted"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return null;
    }

    const employee = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", request.employeeId))
      .unique();
    const leaveType = await ctx.db.get(request.leaveTypeId);

    if (!employee) {
      return null;
    }

    if (args.type === "submitted") {
      if (!employee.managerUserId) {
        return null;
      }

      const manager = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", employee.managerUserId))
        .unique();

      if (!manager?.email) {
        return null;
      }

      const employeeName = employee.fullName ?? employee.email ?? "Employee";
      const leaveTypeName = leaveType?.name ?? "Leave";

      return {
        to: manager.email,
        subject: `New Leave Request from ${employeeName}`,
        html: `<p>Hi ${escapeHtml(manager.fullName ?? "Manager")},</p>
<p><strong>${escapeHtml(employeeName)}</strong> has submitted a <strong>${escapeHtml(leaveTypeName)}</strong> request from <strong>${escapeHtml(request.startDate)}</strong> to <strong>${escapeHtml(request.endDate)}</strong>.</p>
<p>Reason: ${escapeHtml(request.reason ?? "Not specified")}</p>
<p>Please review and take action.</p>`,
      };
    }

    if (!employee.email) {
      return null;
    }

    const status = args.type === "approved" ? "Approved" : "Rejected";
    const leaveTypeName = leaveType?.name ?? "Leave";

    return {
      to: employee.email,
      subject: `Your ${leaveTypeName} Request Has Been ${status}`,
      html: `<p>Hi ${escapeHtml(employee.fullName ?? "Employee")},</p>
<p>Your <strong>${escapeHtml(leaveTypeName)}</strong> request from <strong>${escapeHtml(request.startDate)}</strong> to <strong>${escapeHtml(request.endDate)}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
${request.managerComment ? `<p>Comment: ${escapeHtml(request.managerComment)}</p>` : ""}`,
    };
  },
});

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { escapeBalanceEmailHtml, renderBalanceEmail } from "./lib/emailTemplates";

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
        html: renderBalanceEmail({
          title: `New leave request: ${employeeName}`,
          preheader: `${employeeName} requested ${leaveTypeName} (${request.startDate} to ${request.endDate}).`,
          greetingName: manager.fullName ?? "Manager",
          bodyHtml: [
            `<p style="margin:0 0 12px;">` +
              `<strong>${escapeBalanceEmailHtml(employeeName)}</strong> submitted a <strong>${escapeBalanceEmailHtml(leaveTypeName)}</strong> request.</p>`,
            `<p style="margin:0 0 12px;"><strong>Dates:</strong> ${escapeBalanceEmailHtml(request.startDate)} to ${escapeBalanceEmailHtml(request.endDate)}</p>`,
            `<p style="margin:0 0 12px;"><strong>Reason:</strong> ${escapeBalanceEmailHtml(request.reason ?? "Not specified")}</p>`,
            `<p style="margin:0;">Please open BALANCE to review and take action.</p>`,
          ].join(""),
        }),
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
      html: renderBalanceEmail({
        title: `${leaveTypeName} request ${status.toLowerCase()}`,
        preheader: `${leaveTypeName}: ${request.startDate} to ${request.endDate} (${status})`,
        greetingName: employee.fullName ?? "Employee",
        bodyHtml: [
          `<p style="margin:0 0 12px;">Your <strong>${escapeBalanceEmailHtml(leaveTypeName)}</strong> request has been <strong>${escapeBalanceEmailHtml(status.toLowerCase())}</strong>.</p>`,
          `<p style="margin:0 0 12px;"><strong>Dates:</strong> ${escapeBalanceEmailHtml(request.startDate)} to ${escapeBalanceEmailHtml(request.endDate)}</p>`,
          request.managerComment
            ? `<p style="margin:0;"><strong>Comment:</strong> ${escapeBalanceEmailHtml(request.managerComment)}</p>`
            : `<p style="margin:0;">No manager comment was included.</p>`,
        ].join(""),
      }),
    };
  },
});

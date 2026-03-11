"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getEnv } from "./lib/env";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const sendPendingApprovalDigest = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const digest = await ctx.runQuery(internal.notifications.getPendingApprovalDigestPayload, {});
    const resendApiKey = getEnv("RESEND_API_KEY");
    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const group of digest.groups) {
      const count = group.requests.length;

      if (!args.dryRun) {
        await ctx.runMutation(internal.notifications.createScheduledNotification, {
          userId: group.managerId,
          title: "Daily Digest: Pending Approvals",
          message: `You have ${count} pending leave request${count === 1 ? "" : "s"} awaiting your review.`,
          type: "warning",
        });
      }
      notificationsCreated += 1;

      if (!resendApiKey || !group.managerEmail) {
        continue;
      }

      const requestRows = group.requests
        .map(
          (request) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(request.employeeName)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(request.leaveTypeName)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(request.startDate)} — ${escapeHtml(request.endDate)}</td>
          </tr>`,
        )
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#2d6a4f;">Daily Approval Digest</h2>
          <p>Hi ${escapeHtml(group.managerName)},</p>
          <p>You have <strong>${count}</strong> pending leave request${count === 1 ? "" : "s"} awaiting your review:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f0fdf4;">
                <th style="padding:8px 12px;text-align:left;">Employee</th>
                <th style="padding:8px 12px;text-align:left;">Type</th>
                <th style="padding:8px 12px;text-align:left;">Dates</th>
              </tr>
            </thead>
            <tbody>${requestRows}</tbody>
          </table>
          <p>Please log in to BALANCE to review and action these requests.</p>
          <p style="color:#888;font-size:12px;">This is an automated daily digest from BALANCE.</p>
        </div>
      `;

      if (!args.dryRun) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "BALANCE <onboarding@resend.dev>",
            to: [group.managerEmail],
            subject: `[BALANCE] ${count} Pending Leave Request${count === 1 ? "" : "s"} Awaiting Review`,
            html,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send pending approval digest", await emailResponse.text());
          continue;
        }
      }

      emailsSent += 1;
    }

    return {
      dryRun: args.dryRun ?? false,
      generatedAt: digest.generatedAt,
      totalPendingRequests: digest.totalPendingRequests,
      managersNotified: digest.groups.length,
      notificationsCreated,
      emailsSent,
      emailEnabled: Boolean(resendApiKey),
    };
  },
});

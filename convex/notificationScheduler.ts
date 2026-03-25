"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getResendApiKey, getResendFromEmail } from "./lib/env";
import { escapeBalanceEmailHtml, renderBalanceEmail } from "./lib/emailTemplates";

export const sendPendingApprovalDigest = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    dryRun: boolean;
    generatedAt: string;
    totalPendingRequests: number;
    managersNotified: number;
    notificationsCreated: number;
    emailsSent: number;
    emailEnabled: boolean;
  }> => {
    const digest = (await ctx.runQuery(internal.notifications.getPendingApprovalDigestPayload, {})) as {
      generatedAt: string;
      totalPendingRequests: number;
      groups: Array<{
        managerId: string;
        managerEmail: string | null;
        managerName: string;
        requests: Array<{
          employeeName: string;
          leaveTypeName: string;
          startDate: string;
          endDate: string;
        }>;
      }>;
    };
    const resendApiKey = getResendApiKey();
    const resendFromEmail = getResendFromEmail();
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

      if (!resendFromEmail) {
        await ctx.runMutation(internal.backendIncidents.recordIssue, {
          source: "email.pending_approval_digest",
          message: "RESEND_FROM_EMAIL is required before sending pending approval digest emails.",
          severity: "error",
          details: {
            managerId: group.managerId,
          },
          fingerprint: ["email", "pending_approval_digest", "missing_from_email"],
        });
        continue;
      }

      const requestRows = group.requests
        .map(
          (request) => `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeBalanceEmailHtml(request.employeeName)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeBalanceEmailHtml(request.leaveTypeName)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeBalanceEmailHtml(request.startDate)} - ${escapeBalanceEmailHtml(request.endDate)}</td>
          </tr>`,
        )
        .join("");

      const html = renderBalanceEmail({
        title: "Daily digest: pending approvals",
        preheader: `${count} leave request${count === 1 ? "" : "s"} awaiting your review.`,
        greetingName: group.managerName,
        bodyHtml: [
          `<p style="margin:0 0 12px;">You have <strong>${count}</strong> pending leave request${count === 1 ? "" : "s"} awaiting your review:</p>`,
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:12px 0 0;">`,
          `<thead><tr style="background:#ecfeff;">`,
          `<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Employee</th>`,
          `<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Type</th>`,
          `<th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Dates</th>`,
          `</tr></thead>`,
          `<tbody>${requestRows}</tbody>`,
          `</table>`,
          `<p style="margin:12px 0 0;">Please open BALANCE to review and take action.</p>`,
        ].join(""),
      });

      if (!args.dryRun) {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [group.managerEmail],
            subject: `[BALANCE] ${count} Pending Leave Request${count === 1 ? "" : "s"} Awaiting Review`,
            html,
          }),
        });

        if (!emailResponse.ok) {
          const responseText = await emailResponse.text();
          console.error("Failed to send pending approval digest", responseText);
          await ctx.runMutation(internal.backendIncidents.recordIssue, {
            source: "email.pending_approval_digest",
            message: "Failed to send pending approval digest.",
            severity: "error",
            details: {
              status: emailResponse.status,
              managerId: group.managerId,
              responseText,
            },
            fingerprint: ["email", "pending_approval_digest"],
          });
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

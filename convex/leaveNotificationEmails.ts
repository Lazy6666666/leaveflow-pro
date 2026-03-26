"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getEnv, getResendFromEmail } from "./lib/env";

export const sendLeaveNotificationEmail = internalAction({
  args: {
    requestId: v.id("leaveRequests"),
    type: v.union(v.literal("submitted"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(internal.leaveNotifications.getLeaveNotificationEmailPayload, args);
    if (!payload) {
      return { ok: true, skipped: true, reason: "no_recipient_or_request" };
    }

    const resendApiKey = getEnv("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set. Would send leave email to:", payload.to, "subject:", payload.subject);
      return { ok: true, skipped: true, reason: "missing_resend_api_key" };
    }

    const resendFromEmail = getResendFromEmail();
    if (!resendFromEmail) {
      await ctx.runMutation(internal.backendIncidents.recordIssue, {
        source: "email.leave_notification",
        message: "RESEND_FROM_EMAIL is required before sending leave notification email.",
        severity: "error",
        details: {
          requestId: String(args.requestId),
          type: args.type,
        },
        fingerprint: ["email", "leave_notification", "missing_from_email"],
      });
      return { ok: false, skipped: true, reason: "missing_resend_from_email" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Failed to send leave notification email", responseText);
      await ctx.runMutation(internal.backendIncidents.recordIssue, {
        source: "email.leave_notification",
        message: "Failed to send leave notification email.",
        severity: "error",
        details: {
          status: response.status,
          requestId: String(args.requestId),
          type: args.type,
          responseText,
        },
        fingerprint: ["email", "leave_notification"],
      });
      return { ok: false, skipped: false };
    }

    return { ok: true, skipped: false };
  },
});

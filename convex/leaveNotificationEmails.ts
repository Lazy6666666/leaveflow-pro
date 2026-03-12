"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { getEnv } from "./lib/env";

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

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Leave Manager <onboarding@resend.dev>",
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send leave notification email", await response.text());
      return { ok: false, skipped: false };
    }

    return { ok: true, skipped: false };
  },
});

"use node";

import { createSign } from "node:crypto";
import { registerTool } from "./toolRegistry";
import { api } from "../_generated/api";
import { z } from "zod";

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getGoogleAccessToken(serviceAccountJson: string) {
  const credentials = JSON.parse(serviceAccountJson) as {
    client_email?: string;
    private_key?: string;
    token_uri?: string;
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("invalid_service_account_json");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/calendar.events",
      aud: credentials.token_uri ?? "https://oauth2.googleapis.com/token",
      exp: nowSeconds + 3600,
      iat: nowSeconds,
    }),
  );
  const unsignedToken = `${header}.${claimSet}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = base64UrlEncode(signer.sign(credentials.private_key));
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch(credentials.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`google_token_error:${response.status}:${body}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("google_token_missing");
  }

  return payload.access_token;
}

// ─── Biometric tools ──────────────────────────────────────────────────────────

registerTool({
  name: "biometric.getEmployeeStatus",
  description: "Get the latest biometric attendance status for an employee.",
  allowedRoles: ["hr_admin", "manager"],
  category: "read",
  source: "mcp",
  inputSchema: z.object({ userId: z.string() }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { userId } = args as { userId: string };
    const dashboard = (await ctx.runQuery(api.attendanceAdmin.getAdminAttendanceDashboard as never, {
      view: "today",
    })) as { logs?: Array<{ employee_id: string; status: string; clock_in?: string | null; clock_out?: string | null }> };
    const match = (dashboard.logs ?? []).find((log) => log.employee_id === userId);
    return match ?? { employee_id: userId, status: "unknown", clock_in: null, clock_out: null };
  },
});

registerTool({
  name: "biometric.recordAttendance",
  description: "Record a biometric clock-in or clock-out event.",
  allowedRoles: ["hr_admin"],
  category: "write",
  source: "mcp",
  inputSchema: z.object({
    userId: z.string(),
    type: z.enum(["clock_in", "clock_out"]),
  }),
  outputSchema: z.any(),
  handler: async (ctx, args) => {
    const { userId, type } = args as { userId: string; type: "clock_in" | "clock_out" };
    const timestamp = new Date().toISOString();
    return ctx.runMutation(api.attendanceAdmin.saveManagedAttendanceLog as never, {
      employeeId: userId,
      date: timestamp.slice(0, 10),
      status: "present",
      clockIn: type === "clock_in" ? timestamp : undefined,
      clockOut: type === "clock_out" ? timestamp : undefined,
    });
  },
});

// ─── WhatsApp tool ────────────────────────────────────────────────────────────

registerTool({
  name: "whatsapp.sendMessage",
  description: "Send a WhatsApp message via Twilio.",
  allowedRoles: ["hr_admin", "manager"],
  category: "write",
  source: "mcp",
  inputSchema: z.object({
    to: z.string(),
    body: z.string(),
  }),
  outputSchema: z.any(),
  handler: async (_ctx, args) => {
    const { to, body } = args as { to: string; body: string };
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !token || !from) {
      console.warn("[MCP] WhatsApp: missing Twilio credentials — skipping send");
      return { sent: false, reason: "missing_credentials" };
    }

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body }).toString(),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.warn("[MCP] WhatsApp send failed:", text);
      return { sent: false, reason: text };
    }

    const data = (await res.json()) as { sid: string };
    return { sent: true, messageSid: data.sid };
  },
});

// ─── Calendar tool ────────────────────────────────────────────────────────────

registerTool({
  name: "calendar.createEvent",
  description: "Create a Google Calendar event for a leave block.",
  allowedRoles: ["hr_admin", "manager"],
  category: "write",
  source: "mcp",
  inputSchema: z.object({
    userId: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.any(),
  handler: async (_ctx, args) => {
    const { userId, title, startDate, endDate } = args as {
      userId: string;
      title: string;
      startDate: string;
      endDate: string;
    };
    const exclusiveEndDate = new Date(`${endDate}T00:00:00.000Z`);
    exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);

    const serviceAccountJson = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn("[MCP] Calendar: missing GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON — skipping");
      return { created: false, reason: "missing_credentials" };
    }

    try {
      const accessToken = await getGoogleAccessToken(serviceAccountJson);
      const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID ?? "primary");
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: title,
          description: `Leave event created for ${userId}`,
          start: { date: startDate },
          end: { date: exclusiveEndDate.toISOString().slice(0, 10) },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.warn("[MCP] Calendar.createEvent failed:", body);
        return { created: false, reason: body };
      }

      const payload = (await response.json()) as { id?: string; htmlLink?: string };
      return {
        created: true,
        eventId: payload.id ?? null,
        htmlLink: payload.htmlLink ?? null,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn("[MCP] Calendar.createEvent error:", reason);
      return { created: false, reason };
    }
  },
});

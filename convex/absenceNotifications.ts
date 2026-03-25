import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { createNotification, now, recordAudit } from "./lib/auth";
import { getResendApiKey, getResendFromEmail } from "./lib/env";
import { escapeBalanceEmailHtml, renderBalanceEmail } from "./lib/emailTemplates";
import type {
  AttendanceLogDoc,
  AttendanceSettingsDoc,
  LeaveRequestDoc,
  ProfileDoc,
} from "./lib/types";

type AbsenceManagerGroup = {
  managerId: string;
  managerName: string;
  managerEmail: string | null;
  absentees: string[];
};

type AbsenceNotificationPayload = {
  date: string;
  groups: AbsenceManagerGroup[];
};

type AutoMarkAbsencesResult = {
  date: string;
  marked: number;
  absentEmployeeIds: string[];
  onLeaveEmployeeIds: string[];
  skipped: boolean;
  reason?: "auto_mark_absent_disabled";
};

type PendingAttendanceLog = Pick<AttendanceLogDoc, "employeeId" | "date" | "status" | "source" | "siteId">;

function summarizeNames(names: string[]) {
  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} other${names.length - 3 === 1 ? "" : "s"}`;
}

export const getAbsenceNotificationPayload = internalQuery({
  args: {
    employeeIds: v.array(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.employeeIds.length === 0) {
      const emptyPayload: AbsenceNotificationPayload = {
        date: args.date,
        groups: [],
      };
      return emptyPayload;
    }

    const profiles = await ctx.db.query("profiles").collect();
    const profileByUserId = new Map<string, ProfileDoc>(profiles.map((profile) => [profile.userId, profile]));
    const grouped = new Map<string, AbsenceManagerGroup>();

    for (const employeeId of args.employeeIds) {
      const employeeProfile = profileByUserId.get(employeeId);
      const managerId = employeeProfile?.managerUserId;
      if (!managerId) {
        continue;
      }

      const managerProfile = profileByUserId.get(managerId);
      const existing = grouped.get(managerId) ?? {
        managerId,
        managerName: managerProfile?.fullName ?? managerProfile?.email ?? "Manager",
        managerEmail: managerProfile?.email ?? null,
        absentees: [],
      };

      existing.absentees.push(employeeProfile?.fullName ?? employeeProfile?.email ?? "Unknown");
      grouped.set(managerId, existing);
    }

    return {
      date: args.date,
      groups: Array.from(grouped.values()).sort((a, b) => a.managerName.localeCompare(b.managerName)),
    };
  },
});

export const createManagerAbsenceNotification = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await createNotification(ctx, {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: "warning",
    });
    return { ok: true };
  },
});

export const notifyManagersOfAbsences = internalAction({
  args: {
    employeeIds: v.array(v.string()),
    date: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    dryRun: boolean;
    date: string;
    managersNotified: number;
    notificationsCreated: number;
    emailsSent: number;
    emailEnabled: boolean;
  }> => {
    const payload = (await ctx.runQuery(internal.absenceNotifications.getAbsenceNotificationPayload, {
      employeeIds: args.employeeIds,
      date: args.date,
    })) as AbsenceNotificationPayload;
    const resendApiKey = getResendApiKey();
    const resendFromEmail = getResendFromEmail();
    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const group of payload.groups) {
      const count = group.absentees.length;
      const notificationTitle = `Attendance Alert: ${count} team member${count === 1 ? "" : "s"} absent`;
      const notificationMessage = `${summarizeNames(group.absentees)} ${count === 1 ? "was" : "were"} auto-marked absent on ${args.date}.`;

      if (!args.dryRun) {
        await ctx.runMutation(internal.absenceNotifications.createManagerAbsenceNotification, {
          userId: group.managerId,
          title: notificationTitle,
          message: notificationMessage,
        });
      }
      notificationsCreated += 1;

      if (!resendApiKey || !group.managerEmail) {
        continue;
      }

      if (!resendFromEmail) {
        await ctx.runMutation(internal.backendIncidents.recordIssue, {
          source: "email.absence_notification",
          message: "RESEND_FROM_EMAIL is required before sending manager absence notifications.",
          severity: "error",
          details: {
            managerId: group.managerId,
            date: args.date,
          },
          fingerprint: ["email", "absence_notification", "missing_from_email"],
        });
        continue;
      }

      const absentList = group.absentees.map((name) => `<li>${escapeBalanceEmailHtml(name)}</li>`).join("");
      const subject = `Attendance Alert: ${count} team member(s) marked absent - ${args.date}`;
      const html = renderBalanceEmail({
        title: "Attendance alert: auto-marked absent",
        preheader: `${summarizeNames(group.absentees)} marked absent on ${args.date}.`,
        greetingName: group.managerName,
        bodyHtml: [
          `<p style="margin:0 0 12px;">The following team member(s) were auto-marked as <strong>absent</strong> on <strong>${escapeBalanceEmailHtml(args.date)}</strong> because they did not clock in:</p>`,
          `<ul style="margin:0 0 12px;padding-left:18px;">${absentList}</ul>`,
          `<p style="margin:0;">Please follow up if needed.</p>`,
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
            subject,
            html,
          }),
        });

        if (!emailResponse.ok) {
          const responseText = await emailResponse.text();
          console.error("Failed to send absence notification", responseText);
          await ctx.runMutation(internal.backendIncidents.recordIssue, {
            source: "email.absence_notification",
            message: "Failed to send manager absence notification.",
            severity: "error",
            details: {
              status: emailResponse.status,
              managerId: group.managerId,
              date: args.date,
              responseText,
            },
            fingerprint: ["email", "absence_notification"],
          });
          continue;
        }
      }

      emailsSent += 1;
    }

    return {
      dryRun: args.dryRun ?? false,
      date: args.date,
      managersNotified: payload.groups.length,
      notificationsCreated,
      emailsSent,
      emailEnabled: Boolean(resendApiKey),
    };
  },
});

export const autoMarkAbsencesForDate = internalMutation({
  args: {
    date: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const targetDate = args.date ?? new Date().toISOString().slice(0, 10);
    const settings: AttendanceSettingsDoc | null = await ctx.db
      .query("attendanceSettings")
      .withIndex("by_singleton", (q) => q.eq("singleton", "default"))
      .unique();

    if (settings && settings.autoMarkAbsent === false) {
      const skippedResult: AutoMarkAbsencesResult = {
        date: targetDate,
        marked: 0,
        absentEmployeeIds: [],
        onLeaveEmployeeIds: [],
        skipped: true,
        reason: "auto_mark_absent_disabled",
      };
      return skippedResult;
    }

    const employees: ProfileDoc[] = await ctx.db.query("profiles").collect();
    const existingLogs: AttendanceLogDoc[] = await ctx.db
      .query("attendanceLogs")
      .withIndex("by_date", (q) => q.eq("date", targetDate))
      .collect();
    const loggedEmployeeIds = new Set(existingLogs.map((log) => log.employeeId));
    const approvedLeave: LeaveRequestDoc[] = await ctx.db
      .query("leaveRequests")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();
    const leaveEmployeeIds = new Set(
      approvedLeave
        .filter((request) => request.startDate <= targetDate && request.endDate >= targetDate)
        .map((request) => request.employeeId),
    );

    const toInsert: PendingAttendanceLog[] = employees
      .filter((employee) => !loggedEmployeeIds.has(employee.userId))
      .map((employee) => ({
        employeeId: employee.userId,
        date: targetDate,
        status: leaveEmployeeIds.has(employee.userId) ? ("on_leave" as const) : ("absent" as const),
        source: "system",
        siteId: employee.siteId,
      }));

    const absentEmployeeIds = toInsert
      .filter((entry) => entry.status === "absent")
      .map((entry) => entry.employeeId);
    const onLeaveEmployeeIds = toInsert
      .filter((entry) => entry.status === "on_leave")
      .map((entry) => entry.employeeId);

    if (!args.dryRun) {
      const timestamp = now();
      for (const entry of toInsert) {
        const logId = await ctx.db.insert("attendanceLogs", {
          employeeId: entry.employeeId,
          date: entry.date,
          status: entry.status,
          source: entry.source,
          siteId: entry.siteId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        await recordAudit(ctx, {
          tableName: "attendance_logs",
          recordId: String(logId),
          action: "INSERT",
          changedBy: null,
          newData: await ctx.db.get(logId),
        });
      }
    }

    const result: AutoMarkAbsencesResult = {
      date: targetDate,
      marked: toInsert.length,
      absentEmployeeIds,
      onLeaveEmployeeIds,
      skipped: false,
    };

    return result;
  },
});

export const runDailyAttendanceAutomation = internalAction({
  args: {
    date: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    autoMarkResult: AutoMarkAbsencesResult;
    notificationResult:
      | {
          dryRun: boolean;
          date: string;
          managersNotified: number;
          notificationsCreated: number;
          emailsSent: number;
          emailEnabled: boolean;
        }
      | null;
  }> => {
    const autoMarkResult = (await ctx.runMutation(internal.absenceNotifications.autoMarkAbsencesForDate, {
      date: args.date,
      dryRun: args.dryRun,
    })) as AutoMarkAbsencesResult;

    if (autoMarkResult.skipped || autoMarkResult.absentEmployeeIds.length === 0) {
      return {
        autoMarkResult,
        notificationResult: null,
      };
    }

    const notificationResult = await ctx.runAction(internal.absenceNotifications.notifyManagersOfAbsences, {
      employeeIds: autoMarkResult.absentEmployeeIds,
      date: autoMarkResult.date,
      dryRun: args.dryRun,
    });

    return {
      autoMarkResult,
      notificationResult,
    };
  },
});

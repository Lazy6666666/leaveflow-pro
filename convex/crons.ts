import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "pending-approval-digest",
  {
    hourUTC: 6,
    minuteUTC: 0,
  },
  internal.notificationScheduler.sendPendingApprovalDigest,
  {},
);

crons.daily(
  "daily-attendance-automation",
  {
    hourUTC: 16,
    minuteUTC: 0,
  },
  internal.attendance.runAbsenceNotificationAutomation,
  {},
);

export default crons;

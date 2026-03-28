import type { ActionCtx } from "../../_generated/server";
import { api } from "../../_generated/api";
import { registerTool } from "../toolRegistry";
import { z } from "zod";

type AttendanceDashboard = {
  logs?: Array<{
    employee_id: string;
    date: string;
    status: string;
    clock_in: string | null;
    clock_out: string | null;
    profiles?: { full_name: string | null } | null;
  }>;
};

type AttendanceAnomaly = {
  name: string;
  date: string;
  status: string;
  hasClockOut: boolean;
};

async function attendanceAnomalySkillHandler(
  ctx: ActionCtx,
  _args: unknown,
): Promise<{ anomalies: AttendanceAnomaly[] }> {
  const logs = (await ctx.runQuery(
    api.attendanceAdmin.getAdminAttendanceDashboard as never,
    { view: "month" },
  )) as AttendanceDashboard;

  const anomalies = (logs.logs ?? [])
    .filter((log) => {
      if (log.status === "late") return true;
      if (log.clock_in && !log.clock_out) return true;
      if (log.clock_in && log.clock_out) {
        const durationMs = new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime();
        if (durationMs < 60 * 60 * 1000) return true;
      }
      return false;
    })
    .slice(0, 20)
    .map((log) => ({
      name: log.profiles?.full_name ?? log.employee_id,
      date: log.date,
      status: log.status,
      hasClockOut: Boolean(log.clock_out),
    }));

  return { anomalies };
}

registerTool({
  name: "skill.attendanceAnomaly",
  description: "Summarize suspicious attendance patterns for HR or manager review.",
  allowedRoles: ["manager", "hr_admin"],
  category: "read",
  source: "local",
  inputSchema: z.object({}).passthrough(),
  outputSchema: z.object({
    anomalies: z.array(
      z.object({
        name: z.string(),
        date: z.string(),
        status: z.string(),
        hasClockOut: z.boolean(),
      }),
    ),
  }),
  handler: attendanceAnomalySkillHandler,
});

export { attendanceAnomalySkillHandler };

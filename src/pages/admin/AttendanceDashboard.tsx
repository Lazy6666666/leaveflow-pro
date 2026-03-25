import { useState } from "react";
import { toast } from "sonner";

import { SelfieLightbox } from "@/components/attendance/SelfieLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import type { StorageId } from "@/lib/convexTypes";
import { getErrorMessage } from "@/lib/errors";

import { AttendanceEditorDialog } from "./AttendanceEditorDialog";
import type { AttendanceEditorState, AttendanceLog } from "./attendanceDashboardTypes";
import { AiPanel } from "./attendance-dashboard/components/AiPanel";
import { DashboardHeader } from "./attendance-dashboard/components/DashboardHeader";
import { RecordsCard } from "./attendance-dashboard/components/RecordsCard";
import { StatsCards } from "./attendance-dashboard/components/StatsCards";
import { StatusBreakdownCard } from "./attendance-dashboard/components/StatusBreakdownCard";
import { buildAttendanceRecordPrompt } from "./attendance-dashboard/aiPrompt";
import { useAttendanceDashboardData } from "./attendance-dashboard/hooks/useAttendanceDashboardData";
import { createEditEditorDraft, createNewEditorDraft, type EditorDialogState } from "./attendance-dashboard/state";
import type { AttendanceStats, AttendanceView } from "./attendance-dashboard/types";

const AttendanceDashboard = () => {
  const { hasExplicitRole } = useAuth();
  const [view, setView] = useState<AttendanceView>("today");
  const [deptFilter, setDeptFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [lightboxPath, setLightboxPath] = useState<StorageId | null>(null);

  type AiPanelState = { type: "closed" } | { type: "open"; prompt: string | null };
  const [aiPanel, setAiPanel] = useState<AiPanelState>({ type: "closed" });
  const [editorDialog, setEditorDialog] = useState<EditorDialogState>(() => ({
    type: "closed",
    draft: createNewEditorDraft([]),
  }));

  const canEditAttendance = hasExplicitRole("hr_admin");
  const { departments, employees, loading, logs, refreshAttendance, sites } = useAttendanceDashboardData(
    view,
    siteFilter === "all" ? "" : siteFilter,
  );

  const filteredLogs = deptFilter === "all" ? logs : logs.filter((log) => log.profiles?.department_id === deptFilter);

  const stats: AttendanceStats = {
    total: filteredLogs.length,
    present: filteredLogs.filter((log) => log.status === "present").length,
    late: filteredLogs.filter((log) => log.status === "late").length,
    absent: filteredLogs.filter((log) => log.status === "absent").length,
  };

  const lateArrivals = view === "today" ? filteredLogs.filter((log) => log.status === "late") : [];

  const updateEditorState = <K extends keyof AttendanceEditorState>(key: K, value: AttendanceEditorState[K]) => {
    setEditorDialog((current) => {
      const draft = { ...current.draft, [key]: value };
      if (current.type === "open") return { ...current, draft };
      return { ...current, draft };
    });
  };

  const openCreate = () => {
    setEditorDialog({
      type: "open",
      draft: { ...createNewEditorDraft(employees), siteId: siteFilter === "all" ? "" : siteFilter },
      pending: "idle",
    });
  };

  const openEdit = (log: AttendanceLog) => {
    setEditorDialog({ type: "open", draft: createEditEditorDraft(log), pending: "idle" });
  };

  const closeEditor = () => {
    setEditorDialog((current) => ({ type: "closed", draft: current.draft }));
  };

  const handleSave = async () => {
    if (editorDialog.type !== "open") return;

    const draft = editorDialog.draft;

    if (!draft.employeeId || !draft.date) {
      toast.error("Employee and date are required");
      return;
    }

    setEditorDialog((current) => (current.type === "open" ? { ...current, pending: "saving" } : current));
    try {
      await convex.mutation(api.attendance.saveManagedAttendanceLog, {
        logId: draft.logId,
        employeeId: draft.employeeId,
        date: draft.date,
        siteId: draft.siteId || undefined,
        clockIn: draft.clockIn ? new Date(draft.clockIn).toISOString() : undefined,
        clockOut: draft.clockOut ? new Date(draft.clockOut).toISOString() : undefined,
        status: draft.status as "present" | "late" | "absent" | "half_day" | "on_leave",
        source: draft.source.trim() || undefined,
        notes: draft.notes.trim() || undefined,
      });
      await refreshAttendance();
      closeEditor();
      toast.success(draft.logId ? "Attendance record updated" : "Attendance record created");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save attendance record"));
    } finally {
      setEditorDialog((current) => (current.type === "open" ? { ...current, pending: "idle" } : current));
    }
  };

  const handleDelete = async () => {
    if (editorDialog.type !== "open") return;

    const logId = editorDialog.draft.logId;
    if (!logId) return;

    setEditorDialog((current) => (current.type === "open" ? { ...current, pending: "deleting" } : current));
    try {
      await convex.mutation(api.attendance.deleteAttendanceLog, { logId });
      await refreshAttendance();
      closeEditor();
      toast.success("Attendance record deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete attendance record"));
    } finally {
      setEditorDialog((current) => (current.type === "open" ? { ...current, pending: "idle" } : current));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardHeader
        canEditAttendance={canEditAttendance}
        departments={departments}
        deptFilter={deptFilter}
        onCreateRecord={openCreate}
        setSiteFilter={setSiteFilter}
        setDeptFilter={setDeptFilter}
        setView={setView}
        siteFilter={siteFilter}
        sites={sites}
        view={view}
      />

      <StatsCards stats={stats} />

      <div className="grid gap-8 lg:grid-cols-5">
        <StatusBreakdownCard stats={stats} />
        <RecordsCard
          canEditAttendance={canEditAttendance}
          filteredLogs={filteredLogs}
          lateArrivals={lateArrivals}
          loading={loading}
          onAskAi={(log) => setAiPanel({ type: "open", prompt: buildAttendanceRecordPrompt(log) })}
          onEdit={openEdit}
          onOpenSelfie={(path) => setLightboxPath(path)}
          view={view}
        />
      </div>

      <SelfieLightbox path={lightboxPath} onClose={() => setLightboxPath(null)} />

      <AttendanceEditorDialog
        deleting={editorDialog.type === "open" ? editorDialog.pending === "deleting" : false}
        employees={employees}
        onDelete={() => void handleDelete()}
        onOpenChange={(open) => {
          if (!open) closeEditor();
          else if (editorDialog.type === "closed") setEditorDialog({ type: "open", draft: editorDialog.draft, pending: "idle" });
        }}
        onSave={() => void handleSave()}
        open={editorDialog.type === "open"}
        saving={editorDialog.type === "open" ? editorDialog.pending === "saving" : false}
        setField={updateEditorState}
        sites={sites}
        state={editorDialog.draft}
      />

      <AiPanel
        initialPrompt={aiPanel.type === "open" ? aiPanel.prompt : null}
        open={aiPanel.type === "open"}
        onClose={() => setAiPanel({ type: "closed" })}
      />
    </div>
  );
};

export default AttendanceDashboard;

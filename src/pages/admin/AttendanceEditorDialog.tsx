import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { AttendanceEditorState, EmployeeOption, SiteOption } from "./attendanceDashboardTypes";

type AttendanceEditorDialogProps = {
  deleting: boolean;
  employees: EmployeeOption[];
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  open: boolean;
  saving: boolean;
  setField: <K extends keyof AttendanceEditorState>(key: K, value: AttendanceEditorState[K]) => void;
  sites: SiteOption[];
  state: AttendanceEditorState;
};

export function AttendanceEditorDialog({
  deleting,
  employees,
  onDelete,
  onOpenChange,
  onSave,
  open,
  saving,
  setField,
  sites,
  state,
}: AttendanceEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{state.logId ? "Edit Attendance Record" : "Create Attendance Record"}</DialogTitle>
          <DialogDescription>Update attendance safely without changing the existing dashboard flow.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={state.employeeId} onValueChange={(value) => setField("employeeId", value)} disabled={!!state.logId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name || employee.email || employee.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={state.date} onChange={(event) => setField("date", event.target.value)} disabled={!!state.logId} />
          </div>

          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={state.siteId || "none"} onValueChange={(value) => setField("siteId", value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="No site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No site</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Clock In</Label>
            <Input type="datetime-local" value={state.clockIn} onChange={(event) => setField("clockIn", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Clock Out</Label>
            <Input type="datetime-local" value={state.clockOut} onChange={(event) => setField("clockOut", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={state.status} onValueChange={(value) => setField("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half day</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Input value={state.source} onChange={(event) => setField("source", event.target.value)} placeholder="manual" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={state.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Optional correction notes" />
        </div>

        <DialogFooter className="gap-2">
          {state.logId && (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={saving || deleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={saving || deleting}>
            {saving ? "Saving..." : state.logId ? "Save Changes" : "Create Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

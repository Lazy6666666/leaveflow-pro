import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save, RotateCcw } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

interface AttendanceSettings {
  id: string;
  work_start_time: string;
  work_end_time: string;
  late_threshold_minutes: number;
  half_day_hours: number;
  auto_mark_absent: boolean;
  require_selfie: boolean;
  require_location: boolean;
}

const AttendanceSettingsPage = () => {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [lateThreshold, setLateThreshold] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(4);
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(true);
  const [requireSelfie, setRequireSelfie] = useState(false);
  const [requireLocation, setRequireLocation] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await convex.query(api.attendance.getAttendanceSettings, {});

      if (data) {
        const s = data as unknown as AttendanceSettings;
        setSettings(s);
        setWorkStart(s.work_start_time?.slice(0, 5) || "09:00");
        setWorkEnd(s.work_end_time?.slice(0, 5) || "17:00");
        setLateThreshold(s.late_threshold_minutes);
        setHalfDayHours(s.half_day_hours);
        setAutoMarkAbsent(s.auto_mark_absent);
        setRequireSelfie(s.require_selfie || false);
        setRequireLocation(s.require_location || false);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      workStartTime: workStart + ":00",
      workEndTime: workEnd + ":00",
      lateThresholdMinutes: lateThreshold,
      halfDayHours: halfDayHours,
      autoMarkAbsent: autoMarkAbsent,
      requireSelfie: requireSelfie,
      requireLocation: requireLocation,
    };

    try {
      await convex.mutation(api.attendance.saveAttendanceSettings, payload);
      toast({ title: "Settings saved" });
      const data = await convex.query(api.attendance.getAttendanceSettings, {});
      if (data) setSettings(data as unknown as AttendanceSettings);
    } catch (error) {
      toast({ title: "Failed to save", description: getErrorMessage(error, "Failed to save settings"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWorkStart("09:00");
    setWorkEnd("17:00");
    setLateThreshold(15);
    setHalfDayHours(4);
    setAutoMarkAbsent(true);
    setRequireSelfie(false);
    setRequireLocation(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground p-8">Loading settings...</p>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
          Attendance Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure work hours, late policies, and automatic absent marking
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Work Hours
          </CardTitle>
          <CardDescription>Define the standard work schedule for attendance tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Start Time</Label>
              <Input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">When the work day begins</p>
            </div>
            <div className="space-y-2">
              <Label>Work End Time</Label>
              <Input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">When the work day ends</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Late Threshold (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={lateThreshold}
              onChange={(e) => setLateThreshold(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Employees clocking in more than {lateThreshold} minutes after start time will be marked as "Late"
            </p>
          </div>

          <div className="space-y-2">
            <Label>Half Day Hours</Label>
            <Input
              type="number"
              min={1}
              max={12}
              step={0.5}
              value={halfDayHours}
              onChange={(e) => setHalfDayHours(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Employees working less than {halfDayHours} hours will be marked as "Half Day"
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">Automation</CardTitle>
          <CardDescription>Configure automatic attendance marking policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Require selfie on clock in/out</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Employees must take a selfie when clocking in and out for identity verification
              </p>
            </div>
            <Switch checked={requireSelfie} onCheckedChange={setRequireSelfie} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Require location on clock in/out</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record GPS coordinates when employees clock in and out to verify physical location
              </p>
            </div>
            <Switch checked={requireLocation} onCheckedChange={setRequireLocation} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-mark absent</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically mark employees who haven't clocked in by end of day as absent.
                Employees with approved leave will be marked as "On Leave" instead.
              </p>
            </div>
            <Switch checked={autoMarkAbsent} onCheckedChange={setAutoMarkAbsent} />
          </div>
          <p className="text-xs text-muted-foreground">
            The auto-mark job runs daily at 16:00 UTC. It cross-references attendance logs with approved leave requests.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default AttendanceSettingsPage;

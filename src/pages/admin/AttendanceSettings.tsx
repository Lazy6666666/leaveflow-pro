import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, RotateCcw, Save } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import type { LatLng } from "@/lib/convexTypes";

interface AttendanceSettings {
  id: string;
  work_start_time: string;
  work_end_time: string;
  late_threshold_minutes: number;
  half_day_hours: number;
  auto_mark_absent: boolean;
  require_selfie: boolean;
  require_location: boolean;
  geofence_enabled: boolean;
  geofence_center: LatLng | null;
  geofence_radius_meters: number;
  geofence_label: string | null;
}

const AttendanceSettingsPage = () => {
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
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceLat, setGeofenceLat] = useState("");
  const [geofenceLng, setGeofenceLng] = useState("");
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState("150");
  const [geofenceLabel, setGeofenceLabel] = useState("");

  const applySettings = useCallback((s: AttendanceSettings) => {
    setWorkStart(s.work_start_time?.slice(0, 5) || "09:00");
    setWorkEnd(s.work_end_time?.slice(0, 5) || "17:00");
    setLateThreshold(s.late_threshold_minutes);
    setHalfDayHours(s.half_day_hours);
    setAutoMarkAbsent(s.auto_mark_absent);
    setRequireSelfie(s.require_selfie || false);
    setRequireLocation(s.require_location || false);
    setGeofenceEnabled(s.geofence_enabled || false);
    setGeofenceLat(s.geofence_center ? String(s.geofence_center.lat) : "");
    setGeofenceLng(s.geofence_center ? String(s.geofence_center.lng) : "");
    setGeofenceRadiusMeters(String(s.geofence_radius_meters || 150));
    setGeofenceLabel(s.geofence_label || "");
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await convex.query(api.attendance.getAttendanceSettings, {});

      if (data) {
        applySettings(data as unknown as AttendanceSettings);
      }
      setLoading(false);
    };
    fetch();
  }, [applySettings]);

  const handleSave = async () => {
    const parsedGeofenceLat = geofenceEnabled ? Number(geofenceLat) : undefined;
    const parsedGeofenceLng = geofenceEnabled ? Number(geofenceLng) : undefined;
    const parsedGeofenceRadiusMeters = geofenceEnabled ? Number(geofenceRadiusMeters) : undefined;

    if (
      geofenceEnabled &&
      (!Number.isFinite(parsedGeofenceLat) ||
        !Number.isFinite(parsedGeofenceLng) ||
        !Number.isFinite(parsedGeofenceRadiusMeters) ||
        parsedGeofenceRadiusMeters <= 0)
    ) {
      toast({
        title: "Invalid geofence settings",
        description: "Enter valid latitude, longitude, and a radius greater than zero.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload = {
      workStartTime: workStart + ":00",
      workEndTime: workEnd + ":00",
      lateThresholdMinutes: lateThreshold,
      halfDayHours: halfDayHours,
      autoMarkAbsent: autoMarkAbsent,
      requireSelfie: requireSelfie,
      requireLocation: requireLocation,
      geofenceEnabled: geofenceEnabled,
      geofenceCenter:
        geofenceEnabled && parsedGeofenceLat !== undefined && parsedGeofenceLng !== undefined
          ? { lat: parsedGeofenceLat, lng: parsedGeofenceLng }
          : undefined,
      geofenceRadiusMeters: geofenceEnabled ? parsedGeofenceRadiusMeters : undefined,
      geofenceLabel: geofenceEnabled ? geofenceLabel.trim() || undefined : undefined,
    };

    try {
      await convex.mutation(api.attendance.saveAttendanceSettings, payload);
      toast({ title: "Settings saved" });
      const data = await convex.query(api.attendance.getAttendanceSettings, {});
      if (data) applySettings(data as unknown as AttendanceSettings);
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
    setGeofenceEnabled(false);
    setGeofenceLat("");
    setGeofenceLng("");
    setGeofenceRadiusMeters("150");
    setGeofenceLabel("");
  };

  if (loading) return <p className="text-sm text-muted-foreground p-8">Loading settings...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
        <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
          Attendance Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure work hours, late policies, and automatic absent marking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Work Hours
          </CardTitle>
          <CardDescription>Define the standard work schedule for attendance tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <Card>
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
              <p className="text-sm font-medium text-foreground">Enforce geofence radius</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only allow clock-ins when the employee is inside the approved location radius
              </p>
            </div>
            <Switch checked={geofenceEnabled} onCheckedChange={setGeofenceEnabled} />
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
          {geofenceEnabled && (
            <p className="text-xs text-muted-foreground">
              Geofencing automatically captures GPS for clock-in even if the general location toggle is turned off.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Geofence
          </CardTitle>
          <CardDescription>Define the approved attendance area using a center point and radius in meters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={geofenceLat}
                onChange={(e) => setGeofenceLat(e.target.value)}
                placeholder="25.2048"
                disabled={!geofenceEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={geofenceLng}
                onChange={(e) => setGeofenceLng(e.target.value)}
                placeholder="55.2708"
                disabled={!geofenceEnabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Radius (meters)</Label>
              <Input
                type="number"
                min={1}
                value={geofenceRadiusMeters}
                onChange={(e) => setGeofenceRadiusMeters(e.target.value)}
                placeholder="150"
                disabled={!geofenceEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Employees outside this radius cannot clock in.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Location Label</Label>
              <Input
                value={geofenceLabel}
                onChange={(e) => setGeofenceLabel(e.target.value)}
                placeholder="Main office"
                disabled={!geofenceEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Optional label used in validation messages when someone is outside the fence.
              </p>
            </div>
          </div>
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

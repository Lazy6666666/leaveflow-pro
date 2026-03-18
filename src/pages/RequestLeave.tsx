import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Send, AlertTriangle } from "lucide-react";
import { FormSkeleton } from "@/components/skeletons";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { uploadFileToConvex } from "@/lib/convexUpload";
import { getDateSpanDays, normalizeAnalyticsError } from "@/lib/analytics";
import { getErrorMessage } from "@/lib/errors";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useConflictCheck } from "@/hooks/useConflictCheck";
import { useConvexQuery } from "@/hooks/useConvexQuery";
import type { LeaveTypeId, StorageId } from "@/lib/convexTypes";
import { normalizeLeaveDuration, toHalfDayType, type LeaveDurationOption } from "./requestLeaveDuration";

const MAX_REASON_LENGTH = 1000;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface LeaveType { id: LeaveTypeId; name: string; annual_allocation: number; }

const RequestLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionId, roleScope, surface, trackOnce, track } = useAnalytics();
  const { data: leaveTypesData, loading: pageLoading } = useConvexQuery(api.leave.getLeaveTypes, {}, []);
  const leaveTypes = (leaveTypesData as LeaveType[] | null) ?? [];
  const [leaveTypeId, setLeaveTypeId] = useState<LeaveTypeId | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDayType, setHalfDayType] = useState<LeaveDurationOption>("full");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { conflictWarning, checking: checkingConflicts } = useConflictCheck(startDate, endDate);
  const lastDatesTrackedRef = useRef<string | null>(null);
  const lastConflictTrackedRef = useRef<string | null>(null);
  const dateError = startDate && endDate && endDate < startDate ? "End date must be on or after start date" : null;

  useEffect(() => {
    if (!pageLoading) {
      void trackOnce("leave_request_form_viewed", "leave_request_form_viewed", {
        available_leave_type_count: leaveTypes.length,
      }, { surface: "leave", path: "/request-leave" });
    }
  }, [leaveTypes.length, pageLoading, trackOnce]);

  useEffect(() => {
    if (!startDate || !endDate || dateError) {
      return;
    }

    const durationDays = getDateSpanDays(startDate, endDate);
    if (!durationDays) {
      return;
    }

    const key = `${startDate}:${endDate}:${halfDayType}`;
    if (lastDatesTrackedRef.current === key) {
      return;
    }

    lastDatesTrackedRef.current = key;
    void track("leave_dates_selected", {
      duration_days: durationDays,
      half_day_type: toHalfDayType(halfDayType) ?? null,
    }, { surface: "leave", path: "/request-leave" });
  }, [dateError, endDate, halfDayType, startDate, track]);

  useEffect(() => {
    if (!startDate || !endDate || checkingConflicts || dateError) {
      return;
    }

    const conflictCount = conflictWarning ? Number(conflictWarning.match(/\d+/)?.[0] ?? 0) : 0;
    const severity = conflictCount >= 3 ? "high" : conflictCount > 0 ? "medium" : "none";
    const key = `${startDate}:${endDate}:${conflictCount}:${severity}`;
    if (lastConflictTrackedRef.current === key) {
      return;
    }

    lastConflictTrackedRef.current = key;
    void track("leave_conflict_result_viewed", {
      conflict_count: conflictCount,
      severity,
      date_span_days: getDateSpanDays(startDate, endDate),
    }, { surface: "leave", path: "/request-leave" });
  }, [checkingConflicts, conflictWarning, dateError, endDate, startDate, track]);

  useEffect(() => {
    setHalfDayType((current) => normalizeLeaveDuration(current, startDate, endDate));
  }, [startDate, endDate]);

  if (pageLoading) return <FormSkeleton />;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = "";
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error("Invalid file type. Allowed: PDF, JPEG, PNG, WebP.");
        e.target.value = "";
        return;
      }
    }
    setAttachment(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (dateError) { toast.error(dateError); return; }
    if (reason.length > MAX_REASON_LENGTH) { toast.error(`Reason must be under ${MAX_REASON_LENGTH} characters`); return; }
    setIsSubmitting(true);

    let attachmentStorageId: StorageId | undefined;
    if (attachment) {
      try {
        const upload = await uploadFileToConvex(attachment, "leave_attachment");
        attachmentStorageId = upload.storageId;
      } catch {
        toast.error("Failed to upload attachment");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await convex.mutation(api.leave.createRequest, {
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        attachmentStorageId,
        attachmentName: attachment?.name,
        halfDayType: toHalfDayType(halfDayType),
        analytics: {
          sessionId,
          roleScope,
          surface,
          path: "/request-leave",
          durationDays: getDateSpanDays(startDate, endDate) ?? 1,
          hasAttachment: Boolean(attachmentStorageId),
        },
      });
      toast.success("Leave request submitted successfully");
      navigate("/leave-history");
    } catch (error) {
      void track("leave_request_submit_failed", {
        error_type: normalizeAnalyticsError(getErrorMessage(error, "Failed to submit leave request")),
        has_attachment: Boolean(attachmentStorageId),
        date_span_days: getDateSpanDays(startDate, endDate),
      }, { surface: "leave", path: "/request-leave" });
      toast.error(getErrorMessage(error, "Failed to submit leave request"));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Leave</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Request Leave</h1>
        <p className="text-sm text-muted-foreground">Submit a new leave request for approval.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request details</CardTitle>
          <CardDescription>Choose leave type, dates, duration, and supporting notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" name="leaveTypeId" value={leaveTypeId} />
            <input type="hidden" name="leaveDuration" value={halfDayType} />
            <div className="space-y-2">
              <Label id="leave-type-label" htmlFor="leave-type">Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={(value) => setLeaveTypeId(value as LeaveTypeId)} required>
                <SelectTrigger id="leave-type" className="h-11" aria-labelledby="leave-type-label">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>{lt.name} ({lt.annual_allocation} days/year)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  autoComplete="off"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(dateError)}
                  className="h-11"
                />
                {dateError && <p className="text-xs text-destructive">{dateError}</p>}
                {checkingConflicts && !dateError && (
                  <p className="text-xs text-muted-foreground" aria-live="polite">Checking team availability...</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label id="duration-label" htmlFor="duration">Duration</Label>
              <Select value={halfDayType} onValueChange={(value) => setHalfDayType(value as LeaveDurationOption)}>
                <SelectTrigger id="duration" className="h-11" aria-labelledby="duration-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full day(s)</SelectItem>
                  <SelectItem value="start">Half day (morning off on start date)</SelectItem>
                  <SelectItem value="end">Half day (afternoon off on end date)</SelectItem>
                  {startDate === endDate && startDate && (
                    <SelectItem value="single">Half day (single date)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {conflictWarning && (
              <Alert variant={conflictWarning.startsWith("Warning:") ? "destructive" : "default"} className="rounded-2xl border-border bg-muted/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {conflictWarning}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason">Reason</Label>
                <span className="text-xs text-muted-foreground" aria-live="polite">{reason.length}/{MAX_REASON_LENGTH}</span>
              </div>
              <Textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                autoComplete="off"
                placeholder="Describe the reason for your leave..."
                rows={3}
                maxLength={MAX_REASON_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (optional, max {MAX_FILE_SIZE_MB}MB - PDF, JPEG, PNG, or WebP)</Label>
              <Input id="attachment" name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="h-11" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || !leaveTypeId || !!dateError} className="h-11">
                <Send className="mr-2 h-4 w-4" /> {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11">Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLeave;

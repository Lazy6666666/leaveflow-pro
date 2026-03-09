import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

const MAX_REASON_LENGTH = 1000;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface LeaveType { id: string; name: string; annual_allocation: number; }

const RequestLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDayType, setHalfDayType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase.from("leave_types").select("id, name, annual_allocation").eq("is_active", true);
      if (data) setLeaveTypes(data);
    };
    fetchTypes().finally(() => setPageLoading(false));
  }, []);

  // Check for team conflicts when dates change
  useEffect(() => {
    if (!startDate || !endDate || !user) {
      setConflictWarning(null);
      return;
    }
    const checkConflicts = async () => {
      setCheckingConflicts(true);
      try {
        const { data, error } = await supabase
          .from("leave_requests")
          .select("id, profiles(full_name)")
          .eq("status", "approved")
          .lte("start_date", endDate)
          .gte("end_date", startDate);
        if (!error && data && data.length > 0) {
          const names = data
            .map((r: any) => r.profiles?.full_name)
            .filter(Boolean);
          const count = data.length;
          if (count >= 3) {
            setConflictWarning(
              `⚠️ ${count} team members are already off during these dates${names.length > 0 ? `: ${names.slice(0, 3).join(", ")}${count > 3 ? ` and ${count - 3} more` : ""}` : ""}. Consider choosing different dates.`
            );
          } else if (count > 0) {
            setConflictWarning(
              `${count} team member${count > 1 ? "s" : ""} already off during these dates${names.length > 0 ? `: ${names.join(", ")}` : ""}.`
            );
          } else {
            setConflictWarning(null);
          }
        } else {
          setConflictWarning(null);
        }
      } catch {
        setConflictWarning(null);
      }
      setCheckingConflicts(false);
    };
    const timeout = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeout);
  }, [startDate, endDate, user]);

  if (pageLoading) return <FormSkeleton />;

  const dateError = startDate && endDate && endDate < startDate ? "End date must be on or after start date" : null;

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

    let attachmentUrl: string | null = null;
    if (attachment) {
      const filePath = `${user.id}/${Date.now()}-${attachment.name}`;
      const { error: uploadError } = await supabase.storage.from("leave-attachments").upload(filePath, attachment);
      if (uploadError) { toast.error("Failed to upload attachment"); setIsSubmitting(false); return; }
      attachmentUrl = filePath;
    }

    const { data: inserted, error } = await supabase.from("leave_requests").insert({
      employee_id: user.id, leave_type_id: leaveTypeId, start_date: startDate, end_date: endDate, reason: reason.trim() || null, attachment_url: attachmentUrl,
      half_day_type: halfDayType || null,
    } as any).select("id").single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Leave request submitted successfully");
      if (inserted) {
        supabase.functions.invoke("notify-leave", { body: { type: "submitted", request_id: inserted.id } }).catch(() => {});
      }
      navigate("/leave-history");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Leave</CardTitle>
          <CardDescription>Submit a new leave request for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>{lt.name} ({lt.annual_allocation} days/year)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="h-11" />
                {dateError && <p className="text-xs text-destructive">{dateError}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={halfDayType} onValueChange={setHalfDayType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Full day(s)" /></SelectTrigger>
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
              <Alert variant={conflictWarning.startsWith("⚠️") ? "destructive" : "default"} className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  {conflictWarning}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason">Reason</Label>
                <span className="text-xs text-muted-foreground">{reason.length}/{MAX_REASON_LENGTH}</span>
              </div>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                placeholder="Describe the reason for your leave..."
                rows={3}
                maxLength={MAX_REASON_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (optional, max {MAX_FILE_SIZE_MB}MB — PDF, JPEG, PNG)</Label>
              <Input id="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="h-11" />
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

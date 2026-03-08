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
import { toast } from "sonner";

interface LeaveType {
  id: string;
  name: string;
  annual_allocation: number;
}

const RequestLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data } = await supabase
        .from("leave_types")
        .select("id, name, annual_allocation")
        .eq("is_active", true);
      if (data) setLeaveTypes(data);
    };
    fetchTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    let attachmentUrl: string | null = null;

    if (attachment) {
      const filePath = `${user.id}/${Date.now()}-${attachment.name}`;
      const { error: uploadError } = await supabase.storage
        .from("leave-attachments")
        .upload(filePath, attachment);
      if (uploadError) {
        toast.error("Failed to upload attachment");
        setIsSubmitting(false);
        return;
      }
      attachmentUrl = filePath;
    }

    const { error } = await supabase.from("leave_requests").insert({
      employee_id: user.id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      reason,
      attachment_url: attachmentUrl,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Leave request submitted successfully");
      // Fire-and-forget email notification
      supabase.functions.invoke("notify-leave", {
        body: { type: "submitted", request_id: undefined },
      }).catch(() => {});
      // We need the inserted request id — re-fetch the latest
      const { data: latest } = await supabase
        .from("leave_requests")
        .select("id")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (latest) {
        supabase.functions.invoke("notify-leave", {
          body: { type: "submitted", request_id: latest.id },
        }).catch(() => {});
      }
      navigate("/leave-history");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Request Leave</CardTitle>
          <CardDescription>Submit a new leave request for approval</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.name} ({lt.annual_allocation} days/year)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the reason for your leave..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <Input id="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || !leaveTypeId}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLeave;

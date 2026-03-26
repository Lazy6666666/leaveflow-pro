import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave2Api } from "@/lib/wave2Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type ReviewCycle = {
  id: string;
  name: string;
  status: "draft" | "active" | "closed";
};

type ReviewAssignment = {
  assigneeName: string;
  cycleId: string;
  employeeUserId: string;
  id: string;
  notes: string;
  rating: number | null;
  status: string;
};

type ProfileOption = {
  fullName: string;
  userId: string;
};

const statusOptions = ["draft", "active", "closed"] as const;

export function PerformanceReviewsPanel() {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [cycleName, setCycleName] = useState("");
  const [cycleStatus, setCycleStatus] = useState<(typeof statusOptions)[number]>("draft");
  const [employeeUserId, setEmployeeUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await convex.query(wave2Api.performanceReviews.getPerformanceReviewData, {});
    setAssignments(data.assignments as ReviewAssignment[]);
    setProfiles(data.profiles as ProfileOption[]);
    setReviewCycles(data.cycles as ReviewCycle[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const createCycle = async () => {
    try {
      await convex.mutation(wave2Api.performanceReviews.saveReviewCycle, {
        name: cycleName,
        status: cycleStatus,
      });
      toast.success("Review cycle created");
      setReviewDialogOpen(false);
      setCycleName("");
      setCycleStatus("draft");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create review cycle"));
    }
  };

  const assignCycle = async () => {
    try {
      await convex.mutation(wave2Api.performanceReviews.assignReview, {
        cycleId,
        employeeUserId,
      });
      toast.success("Review assigned");
      setAssignmentDialogOpen(false);
      setCycleId("");
      setEmployeeUserId("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign review"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 2</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <ClipboardCheck className="h-5 w-5" /> Performance Reviews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Create review cycles and assign employees to the active review period.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignmentDialogOpen(true)}>Assign review</Button>
          <Button onClick={() => setReviewDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New cycle
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Review cycles <Badge variant="secondary">{reviewCycles.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading review cycles…</p> : null}
            {!loading && reviewCycles.length === 0 ? <p className="text-sm text-muted-foreground">No review cycles yet.</p> : null}
            {reviewCycles.map((cycle) => (
              <div key={cycle.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-foreground">{cycle.name}</h3>
                  <Badge variant={cycle.status === "active" ? "default" : "secondary"}>{cycle.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Assignments <Badge variant="secondary">{assignments.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading assignments…</p> : null}
            {!loading && assignments.length === 0 ? <p className="text-sm text-muted-foreground">No review assignments yet.</p> : null}
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">{assignment.assigneeName}</h3>
                    <p className="text-sm text-muted-foreground">Cycle: {reviewCycles.find((cycle) => cycle.id === assignment.cycleId)?.name ?? assignment.cycleId}</p>
                  </div>
                  <Badge variant="secondary">{assignment.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create review cycle</DialogTitle>
            <DialogDescription>Start a new Wave 2 performance review cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="review-cycle-name">Cycle name</Label>
              <Input id="review-cycle-name" value={cycleName} onChange={(event) => setCycleName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-cycle-status">Status</Label>
              <Select value={cycleStatus} onValueChange={(value) => setCycleStatus(value as (typeof statusOptions)[number])}>
                <SelectTrigger id="review-cycle-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button disabled={!cycleName.trim()} onClick={() => void createCycle()}>Create cycle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign review</DialogTitle>
            <DialogDescription>Assign an employee to one of the active review cycles.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="review-assignment-cycle">Review cycle</Label>
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger id="review-assignment-cycle">
                  <SelectValue placeholder="Select a cycle" />
                </SelectTrigger>
                <SelectContent>
                  {reviewCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-assignment-employee">Employee</Label>
              <Select value={employeeUserId} onValueChange={setEmployeeUserId}>
                <SelectTrigger id="review-assignment-employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.userId} value={profile.userId}>
                      {profile.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
            <Button disabled={!cycleId || !employeeUserId} onClick={() => void assignCycle()}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

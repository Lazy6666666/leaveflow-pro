import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave1Api } from "@/lib/wave1Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, Plus, Workflow } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type Job = {
  departmentId: string | null;
  departmentName: string | null;
  description: string;
  id: string;
  location: string;
  status: "draft" | "open" | "closed";
  title: string;
  updatedAt: string;
};

type Candidate = {
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  jobId: string;
  notes: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  updatedAt: string;
};

const stageOptions = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
const jobStatusOptions = ["draft", "open", "closed"] as const;

export function RecruitmentPanel() {
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateJobId, setCandidateJobId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobStatus, setJobStatus] = useState<(typeof jobStatusOptions)[number]>("open");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await convex.query(wave1Api.recruitment.getRecruitmentData, {});
    setJobs(data.jobs as Job[]);
    setCandidates(data.candidates as Candidate[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const createJob = async () => {
    try {
      await convex.mutation(wave1Api.recruitment.saveJob, {
        description: jobDescription || undefined,
        location: jobLocation || undefined,
        status: jobStatus,
        title: jobTitle,
      });
      toast.success("Job created");
      setJobDialogOpen(false);
      setJobDescription("");
      setJobLocation("");
      setJobStatus("open");
      setJobTitle("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create job"));
    }
  };

  const createCandidate = async () => {
    try {
      await convex.mutation(wave1Api.recruitment.saveCandidate, {
        email: candidateEmail,
        fullName: candidateName,
        jobId: candidateJobId,
        notes: candidateNotes || undefined,
        stage: "applied",
      });
      toast.success("Candidate added");
      setCandidateDialogOpen(false);
      setCandidateEmail("");
      setCandidateJobId("");
      setCandidateName("");
      setCandidateNotes("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add candidate"));
    }
  };

  const moveCandidate = async (candidateId: string, stage: Candidate["stage"]) => {
    try {
      await convex.mutation(wave1Api.recruitment.moveCandidateStage, { candidateId, stage });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update candidate stage"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 1</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <BriefcaseBusiness className="h-5 w-5" /> Recruitment Pipeline
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Create jobs, add candidates, and progress them through the hiring stages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCandidateDialogOpen(true)}>
            <Workflow className="mr-2 h-4 w-4" /> Add Candidate
          </Button>
          <Button onClick={() => setJobDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Job
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Open Roles <Badge variant="secondary">{jobs.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading jobs…</p> : null}
            {!loading && jobs.length === 0 ? <p className="text-sm text-muted-foreground">No recruitment roles yet.</p> : null}
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.location || "Location pending"} · {job.departmentName || "No department"}</p>
                  </div>
                  <Badge variant={job.status === "open" ? "default" : "secondary"}>{job.status}</Badge>
                </div>
                {job.description ? <p className="mt-3 text-sm text-muted-foreground">{job.description}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Candidates <Badge variant="secondary">{candidates.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading candidates…</p> : null}
            {!loading && candidates.length === 0 ? <p className="text-sm text-muted-foreground">No candidates added yet.</p> : null}
            {!loading && candidates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Advance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="font-medium">{candidate.fullName}</div>
                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{candidate.stage}</TableCell>
                      <TableCell>
                        <Select value={candidate.stage} onValueChange={(value) => void moveCandidate(candidate.id, value as Candidate["stage"])}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stageOptions.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Job</DialogTitle>
            <DialogDescription>Add the first recruitment role for Wave 1.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-location">Location</Label>
              <Input id="job-location" value={jobLocation} onChange={(event) => setJobLocation(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Description</Label>
              <Input id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
            <Button disabled={!jobTitle.trim()} onClick={() => void createJob()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={candidateDialogOpen} onOpenChange={setCandidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Candidate</DialogTitle>
            <DialogDescription>Create a candidate record and attach it to an open role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Full name</Label>
              <Input id="candidate-name" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-email">Email</Label>
              <Input id="candidate-email" value={candidateEmail} onChange={(event) => setCandidateEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-job">Job</Label>
              <Select value={candidateJobId} onValueChange={setCandidateJobId}>
                <SelectTrigger id="candidate-job">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-notes">Notes</Label>
              <Input id="candidate-notes" value={candidateNotes} onChange={(event) => setCandidateNotes(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCandidateDialogOpen(false)}>Cancel</Button>
            <Button disabled={!candidateJobId || !candidateName.trim() || !candidateEmail.trim()} onClick={() => void createCandidate()}>
              Add candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

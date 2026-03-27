import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Plus, RefreshCw, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { convex } from "@/lib/convex";
import { getErrorMessage } from "@/lib/errors";
import { wave1Api } from "@/lib/wave1Api";
import { toast } from "sonner";

type JobListing = {
  departmentName: string | null;
  description: string;
  externalUrl: string | null;
  id: string;
  location: string;
  source: "manual" | "greenhouse" | "linkedin" | "bayt" | "scraper";
  sourceLabel: string;
  status: "draft" | "open" | "closed";
  title: string;
  updatedAt: string;
};

type JobApplication = {
  appliedAt: string;
  email: string;
  externalUrl: string | null;
  fullName: string;
  id: string;
  listingId: string;
  positionTitle: string;
  source: "manual" | "greenhouse" | "linkedin" | "bayt" | "scraper";
  stage: "new" | "under_review" | "interview" | "offer" | "rejected";
  updatedAt: string;
};

const applicationStageOptions = ["new", "under_review", "interview", "offer", "rejected"] as const;
const jobStatusOptions = ["draft", "open", "closed"] as const;
const syncProviderOptions = ["greenhouse", "linkedin", "bayt", "scraper"] as const;

export function CareersPanel() {
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applicationListingId, setApplicationListingId] = useState("");
  const [applicationName, setApplicationName] = useState("");
  const [applicationSource, setApplicationSource] = useState<"manual" | typeof syncProviderOptions[number]>("manual");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [jobLocation, setJobLocation] = useState("");
  const [jobStatus, setJobStatus] = useState<(typeof jobStatusOptions)[number]>("open");
  const [jobTitle, setJobTitle] = useState("");
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProvider, setSyncProvider] = useState<(typeof syncProviderOptions)[number]>("greenhouse");

  const load = useCallback(async () => {
    const data = await convex.query(wave1Api.careers.getCareersData, {});
    setListings(data.listings as JobListing[]);
    setApplications(data.applications as JobApplication[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const createListing = async () => {
    try {
      await convex.mutation(wave1Api.careers.saveJobListing, {
        description: jobDescription || undefined,
        location: jobLocation || undefined,
        source: "manual",
        status: jobStatus,
        title: jobTitle,
      });
      toast.success("Career opening created");
      setJobDialogOpen(false);
      setJobDescription("");
      setJobLocation("");
      setJobStatus("open");
      setJobTitle("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create career opening"));
    }
  };

  const createApplication = async () => {
    const listing = listings.find((candidate) => candidate.id === applicationListingId);
    if (!listing) {
      toast.error("Choose a careers opening before saving the application.");
      return;
    }

    try {
      await convex.mutation(wave1Api.careers.saveJobApplication, {
        email: applicationEmail || undefined,
        fullName: applicationName,
        listingId: applicationListingId,
        positionTitle: listing.title,
        source: applicationSource,
        stage: "new",
      });
      toast.success("Application added");
      setApplicationDialogOpen(false);
      setApplicationEmail("");
      setApplicationListingId("");
      setApplicationName("");
      setApplicationSource("manual");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add application"));
    }
  };

  const moveApplication = async (applicationId: string, stage: JobApplication["stage"]) => {
    try {
      await convex.mutation(wave1Api.careers.moveApplicationStage, { applicationId, stage });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update application stage"));
    }
  };

  const syncExternal = async () => {
    setSyncing(true);
    try {
      const result = await convex.action(wave1Api.careers.syncExternalSource, { provider: syncProvider });
      toast.success(result.note);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to sync external careers data"));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Talent Operations</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <BriefcaseBusiness className="h-5 w-5" /> Careers Pipeline
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish openings, sync live external board data, and move inbound applications through the hiring workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={syncProvider} onValueChange={(value) => setSyncProvider(value as (typeof syncProviderOptions)[number])}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="External source" />
            </SelectTrigger>
            <SelectContent>
              {syncProviderOptions.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void syncExternal()} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sync External
          </Button>
          <Button variant="outline" onClick={() => setApplicationDialogOpen(true)}>
            <Workflow className="mr-2 h-4 w-4" /> Add Applicant
          </Button>
          <Button onClick={() => setJobDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Opening
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Openings <Badge variant="secondary">{listings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading careers openings...</p> : null}
            {!loading && listings.length === 0 ? <p className="text-sm text-muted-foreground">No careers openings yet.</p> : null}
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {listing.location || "Location pending"} · {listing.departmentName || "No department"}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant={listing.status === "open" ? "default" : "secondary"}>{listing.status}</Badge>
                      <Badge variant="outline">{listing.sourceLabel}</Badge>
                    </div>
                  </div>
                  {listing.externalUrl ? (
                    <a
                      className="text-xs text-primary underline-offset-4 hover:underline"
                      href={listing.externalUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Source
                    </a>
                  ) : null}
                </div>
                {listing.description ? <p className="mt-3 text-sm text-muted-foreground">{listing.description}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Applicants <Badge variant="secondary">{applications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading applications...</p> : null}
            {!loading && applications.length === 0 ? <p className="text-sm text-muted-foreground">No applicants yet.</p> : null}
            {!loading && applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="font-medium">{application.fullName}</div>
                        <div className="text-xs text-muted-foreground">{application.email || "No email"}</div>
                      </TableCell>
                      <TableCell className="capitalize">{application.source}</TableCell>
                      <TableCell>{application.positionTitle}</TableCell>
                      <TableCell>{application.appliedAt}</TableCell>
                      <TableCell>
                        <Select value={application.stage} onValueChange={(value) => void moveApplication(application.id, value as JobApplication["stage"])}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applicationStageOptions.map((stage) => (
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
            <DialogTitle>Create Opening</DialogTitle>
            <DialogDescription>Add a new careers opening for internal publishing and external sync reconciliation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="listing-title">Title</Label>
              <Input id="listing-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-location">Location</Label>
              <Input id="listing-location" value={jobLocation} onChange={(event) => setJobLocation(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing-description">Description</Label>
              <Input id="listing-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>Cancel</Button>
            <Button disabled={!jobTitle.trim()} onClick={() => void createListing()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Applicant</DialogTitle>
            <DialogDescription>Create a normalized application record and attach it to a careers opening.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="application-name">Full name</Label>
              <Input id="application-name" value={applicationName} onChange={(event) => setApplicationName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-email">Email</Label>
              <Input id="application-email" value={applicationEmail} onChange={(event) => setApplicationEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-listing">Opening</Label>
              <Select value={applicationListingId} onValueChange={setApplicationListingId}>
                <SelectTrigger id="application-listing">
                  <SelectValue placeholder="Select an opening" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-source">Source</Label>
              <Select value={applicationSource} onValueChange={(value) => setApplicationSource(value as "manual" | typeof syncProviderOptions[number])}>
                <SelectTrigger id="application-source">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">manual</SelectItem>
                  {syncProviderOptions.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplicationDialogOpen(false)}>Cancel</Button>
            <Button disabled={!applicationName.trim() || !applicationListingId} onClick={() => void createApplication()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

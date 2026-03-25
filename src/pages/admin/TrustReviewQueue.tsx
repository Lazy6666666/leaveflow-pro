import { useEffect, useId, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Copy, Camera, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldAlert as ShieldFlagged, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { SelfieLightbox } from "@/components/attendance/SelfieLightbox";
import { getErrorMessage } from "@/lib/errors";
import type { StorageId, Id } from "@/lib/convexTypes";

type TrustState = "unverified" | "supervised" | "flagged" | "verified";

interface VerificationResult {
  confidence: number;
  result: "match" | "no_match" | "manual";
}

interface EnrollmentStatus {
  enrolledAt: number;
  status: "pending" | "active" | "revoked";
}

interface QueueItem {
  id: Id<"attendanceLogs">;
  employeeName: string;
  employeeEmail: string | null;
  employeeId: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  selfie_clock_in: StorageId | null;
  selfie_clock_out: StorageId | null;
  status: string;
  trustState: TrustState;
  reviewNotes?: string;
}

const TrustReviewQueue = () => {
  const reviewNotesId = useId();
  const [logs, setLogs] = useState<QueueItem[]>([]);
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});
  const [enrollments, setEnrollments] = useState<Record<string, EnrollmentStatus | null>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TrustState | "all">("all");
  
  const [viewSelfie, setViewSelfie] = useState<StorageId | null>(null);
  const [reviewItem, setReviewItem] = useState<QueueItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    try {
      const data = await convex.query(api.attendanceAdmin.getTrustReviewQueue, {});
      const items = data as QueueItem[];
      setLogs(items);
      // Fetch verification results for all logs in parallel
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const v = await convex.query(api.faceVerification.getVerificationResult, { attendanceLogId: item.id });
            return [item.id as string, v] as const;
          } catch {
            return [item.id as string, null] as const;
          }
        })
      );
      const map: Record<string, VerificationResult> = {};
      for (const [id, v] of results) {
        if (v) map[id] = v as VerificationResult;
      }
      setVerifications(map);

      const employeeIds = [...new Set(items.map((item) => item.employeeId))];
      const enrollmentResults = await Promise.all(
        employeeIds.map(async (employeeId) => {
          try {
            const enrollment = await convex.query(api.faceVerification.getEnrollmentStatus, { employeeId });
            return [employeeId, (enrollment ?? null) as EnrollmentStatus | null] as const;
          } catch {
            return [employeeId, null] as const;
          }
        }),
      );
      setEnrollments(Object.fromEntries(enrollmentResults));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load trust queue"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReview = async (trustState: "verified" | "flagged") => {
    if (!reviewItem) return;
    setSubmitting(true);
    try {
      await convex.mutation(api.attendanceAdmin.setTrustState, {
        logId: reviewItem.id,
        trustState,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      toast.success(`Log marked as ${trustState}`);
      setReviewItem(null);
      setReviewNotes("");
      fetchQueue();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update review state"));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter(log => filter === "all" || log.trustState === filter);
  const { page, totalPages, paginatedItems, setPage, totalItems } = usePagination(filteredLogs, 20);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    return format(parseISO(isoString), "hh:mm a");
  };

  const openReviewDialog = (item: QueueItem) => {
    setReviewItem(item);
    setReviewNotes(item.reviewNotes || "");
  };

  const TrustIcon = ({ state }: { state: TrustState }) => {
    switch (state) {
      case "verified": return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case "supervised": return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "flagged": return <ShieldFlagged className="h-4 w-4 text-destructive" />;
      case "unverified": default: return <ShieldQuestion className="h-4 w-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-foreground" /> Trust Review Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Verify suspicious block-ins or unattended entries.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All Pending</Button>
        <Button variant={filter === "unverified" ? "default" : "outline"} size="sm" onClick={() => setFilter("unverified")}>Unverified</Button>
        <Button variant={filter === "flagged" ? "default" : "outline"} size="sm" onClick={() => setFilter("flagged")}>Flagged</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Pending Reviews <Badge variant="secondary">{filteredLogs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-md border border-dashed">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Queue is empty. All caught up!</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Times</TableHead>
                    <TableHead>Selfie</TableHead>
                    <TableHead>Trust State</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{log.employeeName}</div>
                        <div className="text-xs text-muted-foreground">{log.employeeEmail}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(log.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span>In: {formatTime(log.clock_in)}</span>
                          <span className="text-muted-foreground">Out: {formatTime(log.clock_out)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.selfie_clock_in ? (
                          <Button size="icon" variant="ghost" onClick={() => setViewSelfie(log.selfie_clock_in!)} className="h-8 w-8" title="View Clock In Selfie">
                            <Camera className="h-4 w-4 text-emerald-500" />
                          </Button>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 capitalize text-sm">
                          <TrustIcon state={log.trustState} />
                          {log.trustState}
                        </div>
                      </TableCell>
                      <TableCell>
                        {verifications[log.id as string] ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant={verifications[log.id as string].result === "match" ? "default" : verifications[log.id as string].result === "no_match" ? "destructive" : "secondary"}
                              className="text-xs w-fit"
                            >
                              {verifications[log.id as string].result}
                            </Badge>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {(verifications[log.id as string].confidence * 100).toFixed(1)}%
                            </span>
                            {enrollments[log.employeeId] ? (
                              <Link to="/identity-hub?tab=biometrics" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <ScanFace className="h-3.5 w-3.5" />
                                Enrollment {enrollments[log.employeeId]?.status}
                              </Link>
                            ) : (
                              <Link to="/identity-hub?tab=biometrics" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <ScanFace className="h-3.5 w-3.5" />
                                No enrollment
                              </Link>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">No verification result yet</span>
                            <Link to="/identity-hub?tab=biometrics" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                              <ScanFace className="h-3.5 w-3.5" />
                              {enrollments[log.employeeId] ? `Enrollment ${enrollments[log.employeeId]?.status}` : "No enrollment"}
                            </Link>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openReviewDialog(log)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} />
            </>
          )}
        </CardContent>
      </Card>

      <SelfieLightbox path={viewSelfie} onClose={() => setViewSelfie(null)} title="Clock In Selfie Verification" />

      <Dialog open={!!reviewItem} onOpenChange={() => setReviewItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Log: {reviewItem?.employeeName}</DialogTitle>
            <DialogDescription>
              {reviewItem?.date ? format(parseISO(reviewItem.date), "MMMM d, yyyy") : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-4 p-3 bg-muted/40 rounded-md">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Time In</p>
                <p className="text-sm font-medium">{formatTime(reviewItem?.clock_in ?? null)}</p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Time Out</p>
                <p className="text-sm font-medium">{formatTime(reviewItem?.clock_out ?? null)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={reviewNotesId} className="text-sm font-medium">Review Notes</label>
              <Textarea
                id={reviewNotesId}
                placeholder="Add context for verifying or flagging this log..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex-1 flex justify-start">
              <Button type="button" variant="outline" onClick={() => setReviewItem(null)}>Cancel</Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="destructive" disabled={submitting} onClick={() => handleReview("flagged")}>
                Flag as Suspicious
              </Button>
              <Button type="button" variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting} onClick={() => handleReview("verified")}>
                Verify & Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrustReviewQueue;

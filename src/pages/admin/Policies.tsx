import { useEffect, useMemo, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookText, FileUp, Plus, Search, Settings, Sparkles, Trash2 } from "lucide-react";
import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { getErrorMessage } from "@/lib/errors";
import type { LeaveTypeId, PolicyDocumentId } from "@/lib/convexTypes";
import { PolicyDocumentOcrDialog } from "@/components/admin/PolicyDocumentOcrDialog";

interface LeaveType {
  id: LeaveTypeId;
  name: string;
  annual_allocation: number;
  carry_forward_limit: number;
  is_active: boolean;
}

interface PolicyDocumentSummary {
  id: PolicyDocumentId;
  title: string;
  storageId: string | null;
  metadata: unknown;
  updatedAt: number;
}

interface PolicyDocumentDetail {
  id: PolicyDocumentId;
  title: string;
  content: string;
  storageId: string | null;
  metadata: unknown;
}

interface PolicySearchMatch {
  id: string;
  title: string;
  score?: number;
  snippet: string;
}

function formatUpdatedAt(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const Policies = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocumentSummary[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [name, setName] = useState("");
  const [allocation, setAllocation] = useState(0);
  const [carryForward, setCarryForward] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyOcrDialogOpen, setPolicyOcrDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocumentDetail | null>(null);
  const [policyTitle, setPolicyTitle] = useState("");
  const [policyContent, setPolicyContent] = useState("");
  const [policySaving, setPolicySaving] = useState(false);
  const [policySearchQuery, setPolicySearchQuery] = useState("");
  const [policySearchLoading, setPolicySearchLoading] = useState(false);
  const [policySearchMatches, setPolicySearchMatches] = useState<PolicySearchMatch[]>([]);
  const [policySearchSource, setPolicySearchSource] = useState<string | null>(null);

  const activeDocumentCount = useMemo(() => policyDocuments.length, [policyDocuments.length]);

  const fetchLeaveTypes = async () => {
    const data = await convex.query(api.admin.getLeavePolicies, {});
    setLeaveTypes(data as LeaveType[]);
  };

  const fetchPolicyDocuments = async () => {
    const data = await convex.query(api.rag.listPolicyDocuments, {});
    setPolicyDocuments(data as PolicyDocumentSummary[]);
  };

  useEffect(() => {
    Promise.all([fetchLeaveTypes(), fetchPolicyDocuments()]).finally(() => setPageLoading(false));
  }, []);

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  const openNewLeaveType = () => {
    setEditingLeaveType(null);
    setName("");
    setAllocation(0);
    setCarryForward(0);
    setIsActive(true);
    setLeaveDialogOpen(true);
  };

  const openEditLeaveType = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setName(leaveType.name);
    setAllocation(leaveType.annual_allocation);
    setCarryForward(leaveType.carry_forward_limit);
    setIsActive(leaveType.is_active);
    setLeaveDialogOpen(true);
  };

  const handleSaveLeaveType = async () => {
    try {
      await convex.mutation(api.admin.saveLeaveType, {
        leaveTypeId: editingLeaveType?.id,
        name,
        annualAllocation: allocation,
        carryForwardLimit: carryForward,
        isActive,
      });
      toast.success(editingLeaveType ? "Leave type updated" : "Leave type created");
      setLeaveDialogOpen(false);
      await fetchLeaveTypes();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save leave type"));
    }
  };

  const openNewPolicy = () => {
    setEditingPolicy(null);
    setPolicyTitle("");
    setPolicyContent("");
    setPolicyDialogOpen(true);
  };

  const openEditPolicy = async (documentId: PolicyDocumentId) => {
    try {
      const documents = (await convex.query(api.rag.getPolicyDocumentsByIds, {
        ids: [documentId],
      })) as Array<PolicyDocumentDetail | null>;
      const document = documents[0];
      if (!document) {
        toast.error("Policy document not found");
        return;
      }
      setEditingPolicy(document);
      setPolicyTitle(document.title);
      setPolicyContent(document.content);
      setPolicyDialogOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load policy document"));
    }
  };

  const handleSavePolicy = async () => {
    const title = policyTitle.trim();
    const content = policyContent.trim();
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    setPolicySaving(true);
    try {
      await convex.action(api.rag.indexPolicyDocument, {
        documentId: editingPolicy?.id,
        title,
        content,
        metadata: {
          source: "admin_policy_manager",
          updatedFrom: "admin/policies",
        },
      });
      toast.success(editingPolicy ? "Policy document updated" : "Policy document indexed");
      setPolicyDialogOpen(false);
      setEditingPolicy(null);
      setPolicyTitle("");
      setPolicyContent("");
      await fetchPolicyDocuments();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save policy document"));
    } finally {
      setPolicySaving(false);
    }
  };

  const handleDeletePolicy = async (document: PolicyDocumentSummary) => {
    if (!window.confirm(`Delete "${document.title}" from policy knowledge?`)) {
      return;
    }

    try {
      await convex.action(api.rag.removePolicyDocument, {
        documentId: document.id,
      });
      toast.success("Policy document deleted");
      await fetchPolicyDocuments();
      setPolicySearchMatches((matches) => matches.filter((match) => match.id !== document.id));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete policy document"));
    }
  };

  const handleSearchPolicies = async () => {
    const query = policySearchQuery.trim();
    if (!query) {
      setPolicySearchMatches([]);
      setPolicySearchSource(null);
      return;
    }

    setPolicySearchLoading(true);
    try {
      const result = (await convex.action(api.rag.searchPolicy, { query })) as {
        source: string;
        matches: PolicySearchMatch[];
      };
      setPolicySearchSource(result.source);
      setPolicySearchMatches(result.matches ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to search policy knowledge"));
    } finally {
      setPolicySearchLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="flex items-center gap-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
            <Settings className="h-6 w-6 text-foreground" /> Policies & Knowledge
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage leave rules and the indexed policy knowledge that powers policy answers in the assistant.
          </p>
        </div>
      </div>

      <Tabs defaultValue="leave-types" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2">
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="policy-knowledge">Policy Knowledge</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-types" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Leave policy configuration</h2>
              <p className="text-sm text-muted-foreground">Configure leave types, allocations, and carry-forward rules.</p>
            </div>
            <Button onClick={openNewLeaveType} className="h-10">
              <Plus className="mr-2 h-4 w-4" /> Add Leave Type
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Leave Types</CardTitle>
              <CardDescription>These rules continue to drive leave balance allocation and approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Annual Allocation</TableHead>
                    <TableHead className="hidden md:table-cell">Carry Forward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.map((leaveType) => (
                    <TableRow key={leaveType.id} className={!leaveType.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{leaveType.name}</TableCell>
                      <TableCell className="tabular-nums">{leaveType.annual_allocation} days</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{leaveType.carry_forward_limit} days</TableCell>
                      <TableCell>
                        <Badge variant={leaveType.is_active ? "default" : "secondary"} className="text-xs">
                          {leaveType.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEditLeaveType(leaveType)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy-knowledge" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookText className="h-5 w-5" /> Policy Knowledge Base
                    </CardTitle>
                    <CardDescription>
                      Index policy text for assistant answers. This phase uses a text-first workflow to keep admin operations simple.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPolicyOcrDialogOpen(true)}>
                      <FileUp className="mr-2 h-4 w-4" /> Upload & OCR
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={openNewPolicy}>
                      <Plus className="mr-2 h-4 w-4" /> New Policy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Indexed documents</p>
                    <p className="mt-2 text-2xl font-semibold">{activeDocumentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Workflow</p>
                    <p className="mt-2 text-sm text-foreground">Paste policy text, generate embeddings, publish instantly.</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Assistant source</p>
                    <p className="mt-2 text-sm text-foreground">Used by policy search in the AI assistant.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {policyDocuments.map((document) => (
                    <div key={document.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{document.title}</p>
                          <p className="text-sm text-muted-foreground">Updated {formatUpdatedAt(document.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{document.storageId ? "Linked file" : "Text indexed"}</Badge>
                          <Button size="sm" variant="outline" onClick={() => void openEditPolicy(document.id)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => void handleDeletePolicy(document)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {policyDocuments.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      No policy documents are indexed yet. Add one to operationalize policy answers beyond static leave rules.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" /> Search Preview
                </CardTitle>
                <CardDescription>Test what the assistant can retrieve from the indexed policy knowledge base.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={policySearchQuery}
                    onChange={(event) => setPolicySearchQuery(event.target.value)}
                    placeholder="Ask a policy question, for example: remote work rules"
                  />
                  <Button className="w-full sm:w-auto" onClick={() => void handleSearchPolicies()} disabled={policySearchLoading}>
                    <Search className="mr-2 h-4 w-4" />
                    {policySearchLoading ? "Searching..." : "Search"}
                  </Button>
                </div>

                {policySearchSource ? (
                  <Badge variant="secondary" className="capitalize">
                    Source: {policySearchSource}
                  </Badge>
                ) : null}

                <div className="space-y-3">
                  {policySearchMatches.map((match) => (
                    <div key={`${match.id}-${match.title}`} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{match.title}</p>
                          {typeof match.score === "number" ? (
                            <p className="text-xs text-muted-foreground">Similarity score: {match.score.toFixed(4)}</p>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{match.snippet}</p>
                    </div>
                  ))}

                  {!policySearchLoading && policySearchQuery.trim() && policySearchMatches.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      No matching policy passage was found for that query.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLeaveType ? "Edit" : "Add"} Leave Type</DialogTitle>
            <DialogDescription>
              Configure the leave type name, annual allocation, carry forward limit, and active status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Annual Allocation (days)</Label>
              <Input type="number" value={allocation} onChange={(event) => setAllocation(Number(event.target.value))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Carry Forward Limit (days)</Label>
              <Input type="number" value={carryForward} onChange={(event) => setCarryForward(Number(event.target.value))} className="h-11" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveLeaveType()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit" : "Add"} Policy Document</DialogTitle>
            <DialogDescription>
              Paste the source policy text that should be indexed for assistant retrieval. This preserves the existing leave policy UI while operationalizing Phase 1 policy RAG.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={policyTitle} onChange={(event) => setPolicyTitle(event.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Policy Content</Label>
              <Textarea
                value={policyContent}
                onChange={(event) => setPolicyContent(event.target.value)}
                className="min-h-[320px] resize-y"
                placeholder="Paste the policy text you want the assistant to search."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSavePolicy()} disabled={policySaving}>
              {policySaving ? "Indexing..." : editingPolicy ? "Save & Reindex" : "Index Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PolicyDocumentOcrDialog
        open={policyOcrDialogOpen}
        onOpenChange={setPolicyOcrDialogOpen}
        onIndexed={fetchPolicyDocuments}
      />
    </div>
  );
};

export default Policies;

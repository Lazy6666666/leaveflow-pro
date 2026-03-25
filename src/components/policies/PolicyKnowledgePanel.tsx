import { useEffect, useMemo, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import type { PolicyDocumentId } from "@/lib/convexTypes";
import { BookText, FileUp, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { PolicyDocumentOcrDialog } from "@/components/admin/PolicyDocumentOcrDialog";
import { toast } from "sonner";

type PolicyDocumentSummary = {
  id: PolicyDocumentId;
  title: string;
  storageId: string | null;
  metadata: unknown;
  updatedAt: number;
};

type PolicyDocumentDetail = {
  id: PolicyDocumentId;
  title: string;
  content: string;
  storageId: string | null;
  metadata: unknown;
};

type PolicySearchMatch = {
  id: string;
  title: string;
  score?: number;
  snippet: string;
};

function formatUpdatedAt(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PolicyKnowledgePanel() {
  const { trackOnce } = useAnalytics();
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
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

  const load = async () => {
    const data = await convex.query(api.rag.listPolicyDocuments, {});
    setPolicyDocuments(data as PolicyDocumentSummary[]);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    void trackOnce("policy_knowledge_panel_viewed", "policy_knowledge_panel_viewed", {
      document_count: policyDocuments.length,
      path: "/admin/system",
    });
  }, [loading, policyDocuments.length, trackOnce]);

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
      await load();
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
      await load();
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
    <>
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

            {loading ? <p className="text-sm text-muted-foreground">Loading policy documents…</p> : null}

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
              {!loading && policyDocuments.length === 0 ? (
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
        onCompleted={() => {
          void load();
        }}
      />
    </>
  );
}

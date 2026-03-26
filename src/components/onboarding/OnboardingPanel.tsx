import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave1Api } from "@/lib/wave1Api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type Template = {
  description: string;
  id: string;
  name: string;
  tasks: { id: string; title: string }[];
};

type Assignment = {
  assigneeName: string;
  assigneeUserId: string;
  id: string;
  status: "not_started" | "in_progress" | "completed";
  tasks: { completedAt?: number; id: string; title: string }[];
  templateId: string;
};

type ProfileOption = {
  fullName: string;
  userId: string;
};

export function OnboardingPanel() {
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);

  const load = useCallback(async () => {
    const data = await convex.query(wave1Api.onboarding.getOnboardingData, {});
    setAssignments(data.assignments as Assignment[]);
    setProfiles(data.profiles as ProfileOption[]);
    setTemplates(data.templates as Template[]);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const addTask = () => {
    if (!taskDraft.trim()) {
      return;
    }
    setTasks((current) => [...current, { id: crypto.randomUUID(), title: taskDraft.trim() }]);
    setTaskDraft("");
  };

  const createTemplate = async () => {
    try {
      await convex.mutation(wave1Api.onboarding.saveTemplate, {
        description: templateDescription || undefined,
        name: templateName,
        tasks,
      });
      toast.success("Template created");
      setTemplateDialogOpen(false);
      setTasks([]);
      setTemplateDescription("");
      setTemplateName("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create onboarding template"));
    }
  };

  const assignTemplate = async () => {
    try {
      await convex.mutation(wave1Api.onboarding.assignTemplate, {
        assigneeUserId,
        templateId,
      });
      toast.success("Template assigned");
      setAssignmentDialogOpen(false);
      setAssigneeUserId("");
      setTemplateId("");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to assign onboarding template"));
    }
  };

  const completeTask = async (assignmentId: string, taskId: string) => {
    try {
      await convex.mutation(wave1Api.onboarding.completeAssignmentTask, { assignmentId, taskId });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update onboarding task"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 1</p>
          <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
            <ClipboardList className="h-5 w-5" /> Onboarding Checklists
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Create onboarding templates, assign them to new hires, and track completion.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignmentDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Assign Template
          </Button>
          <Button onClick={() => setTemplateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Templates <Badge variant="secondary">{templates.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading templates…</p> : null}
            {!loading && templates.length === 0 ? <p className="text-sm text-muted-foreground">No onboarding templates yet.</p> : null}
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-border/60 p-4">
                <h3 className="font-medium text-foreground">{template.name}</h3>
                {template.description ? <p className="mt-2 text-sm text-muted-foreground">{template.description}</p> : null}
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {template.tasks.map((task) => (
                    <li key={task.id}>• {task.title}</li>
                  ))}
                </ul>
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
            {!loading && assignments.length === 0 ? <p className="text-sm text-muted-foreground">No onboarding assignments yet.</p> : null}
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">{assignment.assigneeName}</h3>
                    <p className="text-sm text-muted-foreground">Template: {templates.find((template) => template.id === assignment.templateId)?.name ?? assignment.templateId}</p>
                  </div>
                  <Badge variant={assignment.status === "completed" ? "default" : "secondary"}>{assignment.status}</Badge>
                </div>
                <div className="mt-3 space-y-2">
                  {assignment.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-sm">{task.title}</span>
                      <Button
                        size="sm"
                        variant={task.completedAt ? "secondary" : "outline"}
                        disabled={Boolean(task.completedAt)}
                        onClick={() => void completeTask(assignment.id, task.id)}
                      >
                        {task.completedAt ? "Done" : "Mark complete"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create onboarding template</DialogTitle>
            <DialogDescription>Define the repeatable steps for a new-hire onboarding flow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input id="template-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input id="template-description" value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-draft">Tasks</Label>
              <div className="flex gap-2">
                <Input id="task-draft" value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} />
                <Button type="button" variant="outline" onClick={addTask}>Add</Button>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {tasks.map((task) => (
                  <li key={task.id}>• {task.title}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button disabled={!templateName.trim() || tasks.length === 0} onClick={() => void createTemplate()}>Create template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign onboarding template</DialogTitle>
            <DialogDescription>Attach an onboarding checklist to a specific employee or new hire.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-template">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger id="assignment-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-user">Assignee</Label>
              <Select value={assigneeUserId} onValueChange={setAssigneeUserId}>
                <SelectTrigger id="assignment-user">
                  <SelectValue placeholder="Select a profile" />
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
            <Button disabled={!templateId || !assigneeUserId} onClick={() => void assignTemplate()}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

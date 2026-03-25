import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Copy,
  FileSearch,
  HeartPulse,
  TimerReset,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import AIChatPanel from "@/components/AIChatPanel";
import { AIActionFeed } from "@/components/ai-feed/AIActionFeed";
import { getVisibleAiFeedItems } from "@/components/ai-feed/feedItems";
import type { PromptRequest } from "@/components/ai-chat/types";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

type WorkflowCard = {
  title: string;
  description: string;
  prompt: string;
  href: string;
  hrefLabel: string;
  icon: LucideIcon;
};

type WorkflowSection = {
  id: string;
  title: string;
  badge: string;
  description: string;
  cards: WorkflowCard[];
};

const employeeSection: WorkflowSection = {
  id: "employee",
  title: "Employee workflows",
  badge: "Employee",
  description: "Personal AI guidance for leave planning, policy clarity, and wellbeing signals without leaving the workspace.",
  cards: [
    {
      title: "Plan time off",
      description: "Combine your balance, holiday calendar, and likely bridge days before you submit the actual request.",
      prompt: "Review my leave balance, highlight the best bridge days around upcoming holidays, and suggest the smartest dates for a short break.",
      href: "/request-leave",
      hrefLabel: "Open request leave",
      icon: CalendarDays,
    },
    {
      title: "Decode policy fast",
      description: "Ask for a plain-language explanation of the rule that applies before you commit to a leave or attendance decision.",
      prompt: "Explain the policy that applies to my leave request in simple language and call out any approval or documentation requirements.",
      href: "/my-leave",
      hrefLabel: "Review my leave",
      icon: FileSearch,
    },
    {
      title: "Check wellbeing signals",
      description: "Start from a burnout-oriented self-check grounded in your recent attendance and time-off patterns.",
      prompt: "Based on my recent attendance and leave history, do you see any burnout risk signals and what should I do next?",
      href: "/attendance",
      hrefLabel: "View attendance",
      icon: HeartPulse,
    },
  ],
};

const managerSection: WorkflowSection = {
  id: "manager",
  title: "Manager workflows",
  badge: "Manager",
  description: "Team-aware AI starting points for approvals, calendar coverage, and early workload risk detection.",
  cards: [
    {
      title: "Prioritize approvals",
      description: "Open the queue with AI context so the highest-risk or most time-sensitive requests surface first.",
      prompt: "Show my pending approvals, identify the most urgent request, and explain any policy or coverage issues I should weigh before deciding.",
      href: "/manager/approvals",
      hrefLabel: "Open approvals",
      icon: ClipboardCheck,
    },
    {
      title: "Scan team availability",
      description: "Use the team calendar as the follow-through surface after AI highlights where leave overlap may become a staffing issue.",
      prompt: "Show my team's leave calendar for the next 30 days, highlight any risky overlap, and suggest where I may need backup coverage.",
      href: "/manager/team-calendar",
      hrefLabel: "Open team calendar",
      icon: CalendarRange,
    },
    {
      title: "Watch burnout signals",
      description: "Start from recent attendance and time-off patterns to catch risk before service continuity slips.",
      prompt: "Based on my team's recent attendance and leave patterns, who looks at risk of burnout or attendance issues and what follow-up should I take?",
      href: "/manager/team-attendance",
      hrefLabel: "Open team attendance",
      icon: HeartPulse,
    },
    {
      title: "Resolve coverage gaps",
      description: "Ask for a quick triage summary before you rebalance the team or adjust upcoming approvals.",
      prompt: "Check for coverage conflicts on my team next week, explain the most critical overlap, and suggest the best mitigation steps.",
      href: "/manager/team-calendar",
      hrefLabel: "Review team coverage",
      icon: TimerReset,
    },
  ],
};

const hrAdminSection: WorkflowSection = {
  id: "hr-admin",
  title: "HR admin workflows",
  badge: "HR Admin",
  description: "Operational AI starters for policy governance, staffing coverage, payroll context, and audit-ready review.",
  cards: [
    {
      title: "Policy knowledge checks",
      description: "Jump into policy search and validation with prompts that align to the indexed knowledge base already in BALANCE.",
      prompt: "Search the indexed policy knowledge for the latest guidance on remote work, leave approvals, and documentation requirements I should enforce.",
      href: "/admin/policies",
      hrefLabel: "Open policies",
      icon: FileSearch,
    },
    {
      title: "Coverage conflict review",
      description: "Use AI to spot upcoming overlap risks before staffing gaps turn into escalations.",
      prompt: "Check for coverage conflicts over the next two weeks, identify the highest-risk overlap, and suggest mitigation steps.",
      href: "/admin/reports",
      hrefLabel: "Open reports",
      icon: ClipboardCheck,
    },
    {
      title: "Payroll-ready summary",
      description: "Prepare a faster monthly checkpoint before validating totals and payable hours inside reporting.",
      prompt: "Generate a payroll summary for the current pay period, including gross pay, payable hours, and any anomalies I should review.",
      href: "/admin/reports",
      hrefLabel: "Review payroll insights",
      icon: BriefcaseBusiness,
    },
    {
      title: "Attendance audit sweep",
      description: "Start from the highest-risk attendance and biometric issues instead of scanning every record manually.",
      prompt: "Summarize the top attendance or biometric audit issues I should review today and prioritize them by operational risk.",
      href: "/admin/audit-log",
      hrefLabel: "Open audit log",
      icon: ShieldCheck,
    },
  ],
};

const workspaceHighlights = [
  {
    title: "Embedded copilot",
    description: "Keep the existing BALANCE AI assistant available, now as a dedicated workspace surface instead of only a floating entry point.",
    icon: Sparkles,
  },
  {
    title: "Role-aware sections",
    description: "Employee workflows stay available to everyone, while HR admin operations appear only when that permission is present.",
    icon: ShieldCheck,
  },
  {
    title: "Action-oriented follow-through",
    description: "Every workflow points back into the correct BALANCE page so answers can turn into actions immediately.",
    icon: TrendingUp,
  },
] as const;

function getActiveRoleLenses(isManager: boolean, isHrAdmin: boolean) {
  return ["Employee", ...(isManager ? ["Manager"] : []), ...(isHrAdmin ? ["HR admin"] : [])];
}

function buildVisibleLinks(sections: WorkflowSection[]) {
  const links = [
    { label: "Dashboard", href: "/dashboard" },
    ...sections.flatMap((section) =>
      section.cards.map((card) => ({
        label: card.hrefLabel,
        href: card.href,
      })),
    ),
  ];
  const seen = new Set<string>();

  return links.filter((link) => {
    if (seen.has(link.href)) {
      return false;
    }

    seen.add(link.href);
    return true;
  });
}

const AIWorkspace = () => {
  const { hasRole, hasManagerAccess } = useAuth();
  const { trackOnce, track } = useAnalytics();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [promptRequest, setPromptRequest] = useState<PromptRequest | null>(null);
  const isHrAdmin = hasRole("hr_admin");
  const isManager = hasManagerAccess && !isHrAdmin;
  const activeRoleLenses = useMemo(() => getActiveRoleLenses(isManager, isHrAdmin), [isManager, isHrAdmin]);

  const visibleSections = useMemo(
    () => [employeeSection, ...(isManager ? [managerSection] : []), ...(isHrAdmin ? [hrAdminSection] : [])],
    [isManager, isHrAdmin],
  );
  const visibleLinks = useMemo(() => buildVisibleLinks(visibleSections), [visibleSections]);
  const visibleFeedItems = useMemo(
    () => getVisibleAiFeedItems({ isManager, isHrAdmin }),
    [isHrAdmin, isManager],
  );
  const totalPromptCount = visibleSections.reduce((sum, section) => sum + section.cards.length, 0);

  useEffect(() => {
    void trackOnce("ai_workspace_viewed", "ai_workspace_viewed", {
      visible_prompt_count: totalPromptCount,
      role_lenses: activeRoleLenses,
    }, { surface: "ai_workspace", path: "/ai-workspace" });
  }, [activeRoleLenses, totalPromptCount, trackOnce]);

  const handleCopyPrompt = async (prompt: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      toast.error("Clipboard access is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      toast.success("Prompt copied. Continue in the BALANCE AI copilot.");
    } catch {
      toast.error("Could not copy the prompt. Please try again.");
    }
  };

  const handleAskAi = (prompt: string) => {
    setPromptRequest({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt,
    });
    void track(
      "ai_action_feed_prompt_selected",
      {
        mode: "embedded",
        prompt_length: prompt.length,
      },
      { surface: "ai_workspace", path: "/ai-workspace" },
    );

    if (typeof document !== "undefined") {
      const copilot = document.getElementById("workspace-copilot");
      if (typeof copilot?.scrollIntoView === "function") {
        copilot.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-primary/5">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]">
                AI Workspace
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                {visibleSections.length} role lens{visibleSections.length > 1 ? "es" : ""}
              </Badge>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl">
                A dedicated home for BALANCE AI workflows
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-muted-foreground">
                Use the embedded copilot, start from role-aware prompts, and move straight into the right BALANCE surface without losing the existing permission model.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/dashboard">
                  Back to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="#role-workflows">Jump to role workflows</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {workspaceHighlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <h2 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-xl">Workspace status</CardTitle>
            <CardDescription>
              Your available prompt library and deep links update with the roles already active in this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt starters</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{totalPromptCount}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Curated prompts visible from your current role scope.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Current role access</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{activeRoleLenses.join(" + ")}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Each role-specific workflow section appears only when that permission is already active in this session.
                </p>
              </div>
            </div>

            {isManager ? (
              <div className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Manager continuity</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Approval, coverage, and attendance follow-through still use the same manager pages while the workspace centralizes the AI entry point.
                </p>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Quick links</p>
              <div className="flex flex-wrap gap-2">
                {visibleLinks.map((link) => (
                  <Button key={link.href} asChild size="sm" variant="outline" className="rounded-full">
                    <Link to={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </div>

            {copiedPrompt ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">Last copied prompt</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{copiedPrompt}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section id="workspace-copilot" className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <AIChatPanel mode="embedded" initialPromptRequest={promptRequest} />

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-xl">How to work from here</CardTitle>
            <CardDescription>
              Use the embedded copilot for the conversation, then move into the right BALANCE page once you are ready to act.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-medium text-foreground">1. Start from a prompt below</p>
              <p>Copy a role-specific starter prompt when you want a faster first question than a blank chat box.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">2. Continue in the embedded copilot</p>
              <p>The same BALANCE AI experience still powers chat here, so existing behavior stays intact while this workspace becomes a first-class destination.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">3. Move into the linked surface</p>
              <p>Each workflow card points to the operational page where you can complete the request, review the report, or audit the record.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <AIActionFeed items={visibleFeedItems} onAskAi={handleAskAi} />

      <section id="role-workflows" className="scroll-mt-24 space-y-6">
        {visibleSections.map((section) => (
          <Card key={section.id} className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
                  {section.badge}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-2xl">{section.title}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {section.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              {section.cards.map((card) => (
                <div key={card.title} className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/60 p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <card.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.description}</p>
                  </div>
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Starter prompt</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{card.prompt}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button type="button" onClick={() => void handleCopyPrompt(card.prompt)}>
                      <Copy className="h-4 w-4" />
                      Copy prompt
                    </Button>
                    <Button asChild variant="outline">
                      <Link
                        to={card.href}
                        onClick={() => void track("ai_followthrough_clicked", {
                          destination: card.href,
                          origin_surface: "ai_workspace",
                        }, { surface: "ai_workspace", path: "/ai-workspace" })}
                      >
                        {card.hrefLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default AIWorkspace;

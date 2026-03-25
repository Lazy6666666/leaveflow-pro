import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileSearch,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AiFeedItem = {
  description: string;
  href: string;
  hrefLabel: string;
  icon: LucideIcon;
  id: string;
  prompt: string;
  roleLabel: string;
  signal: string;
  stateLabel: string;
  title: string;
};

type RoleFlags = {
  isHrAdmin: boolean;
  isManager: boolean;
};

const employeeFeedItems: AiFeedItem[] = [
  {
    id: "employee-bridge-days",
    title: "Bridge-day suggestion ready",
    description: "Use the existing balance and holiday tools to turn upcoming public holidays into a smarter short break plan.",
    prompt: "Suggest the smartest leave dates around upcoming holidays and explain the best bridge-day option for me.",
    href: "/request-leave",
    hrefLabel: "Open request leave",
    icon: CalendarDays,
    roleLabel: "Employee",
    signal: "Live balance + holiday tools",
    stateLabel: "Ready now",
  },
  {
    id: "employee-policy",
    title: "Policy answer available",
    description: "Search the indexed policy knowledge before you commit to a leave, attendance, or remote-work decision.",
    prompt: "Search the policy knowledge base and explain the rule that applies to my current leave or remote-work question.",
    href: "/my-leave",
    hrefLabel: "Review my leave",
    icon: FileSearch,
    roleLabel: "Employee",
    signal: "Indexed policy search",
    stateLabel: "Self-service",
  },
  {
    id: "employee-burnout",
    title: "Wellbeing check recommended",
    description: "Start a personal burnout check grounded in your own attendance and recent leave history.",
    prompt: "Run a burnout self-check from my recent attendance and leave patterns and tell me the next step I should take.",
    href: "/attendance",
    hrefLabel: "View attendance",
    icon: HeartPulse,
    roleLabel: "Employee",
    signal: "Personal attendance signals",
    stateLabel: "Personal scope",
  },
];

const managerFeedItems: AiFeedItem[] = [
  {
    id: "manager-approvals",
    title: "Approvals need triage",
    description: "Ask the assistant to rank pending approvals so the most urgent or highest-risk request surfaces first.",
    prompt: "Review my pending approvals, identify the most urgent item, and explain what I should check before deciding.",
    href: "/manager/approvals",
    hrefLabel: "Open approvals",
    icon: ClipboardCheck,
    roleLabel: "Manager",
    signal: "Pending approvals tool",
    stateLabel: "Manager scope",
  },
  {
    id: "manager-coverage",
    title: "Coverage watch active",
    description: "Cross-check team leave overlap and attendance pressure before service continuity slips.",
    prompt: "Check my team's leave overlap for the next two weeks, flag the biggest coverage risk, and recommend the best mitigation.",
    href: "/manager/team-calendar",
    hrefLabel: "Open team calendar",
    icon: TimerReset,
    roleLabel: "Manager",
    signal: "Coverage + staffing tools",
    stateLabel: "Watch this week",
  },
  {
    id: "manager-burnout",
    title: "Burnout follow-up queued",
    description: "Use the team burnout summary to decide where manager follow-up is most needed.",
    prompt: "Based on my team's current burnout and attendance signals, who needs follow-up first and why?",
    href: "/manager/team-attendance",
    hrefLabel: "Open team attendance",
    icon: HeartPulse,
    roleLabel: "Manager",
    signal: "Team burnout overview",
    stateLabel: "Role-gated",
  },
];

const hrAdminFeedItems: AiFeedItem[] = [
  {
    id: "hr-policy-knowledge",
    title: "Policy governance check",
    description: "Validate that the indexed policy knowledge reflects the latest remote-work and leave guidance before employees rely on it.",
    prompt: "Search the indexed policy knowledge and summarize any remote-work or leave policy areas HR should validate today.",
    href: "/admin/policies",
    hrefLabel: "Open policies",
    icon: ShieldCheck,
    roleLabel: "HR Admin",
    signal: "Policy knowledge base",
    stateLabel: "Admin scope",
  },
  {
    id: "hr-coverage",
    title: "Coverage escalation review",
    description: "Use the assistant to isolate the highest-risk leave overlap before it becomes an operational escalation.",
    prompt: "Check for coverage conflicts across the organization for the next two weeks and tell me which overlap HR should resolve first.",
    href: "/admin/reports",
    hrefLabel: "Open reports",
    icon: ClipboardCheck,
    roleLabel: "HR Admin",
    signal: "Coverage conflict tools",
    stateLabel: "Priority review",
  },
  {
    id: "hr-payroll",
    title: "Payroll insight available",
    description: "Start from a payroll-ready summary so anomalies are easier to investigate before the period closes.",
    prompt: "Generate a payroll summary for the current period, call out anomalies, and explain the biggest payroll delta HR should review.",
    href: "/admin/reports",
    hrefLabel: "Review payroll insights",
    icon: BriefcaseBusiness,
    roleLabel: "HR Admin",
    signal: "Payroll summary tools",
    stateLabel: "HR only",
  },
  {
    id: "hr-attendance-audit",
    title: "Attendance audit sweep",
    description: "Review suspicious attendance patterns and biometric sync issues through the same BALANCE AI workflow.",
    prompt: "Summarize today's top attendance anomalies and biometric sync failures, then recommend the first HR action to take.",
    href: "/admin/audit-log",
    hrefLabel: "Open audit log",
    icon: Sparkles,
    roleLabel: "HR Admin",
    signal: "Attendance + biometrics tools",
    stateLabel: "Audit ready",
  },
];

export function getVisibleAiFeedItems({ isManager, isHrAdmin }: RoleFlags) {
  return [
    ...employeeFeedItems,
    ...(isManager ? managerFeedItems : []),
    ...(isHrAdmin ? hrAdminFeedItems : []),
  ];
}

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Employees from "./Employees";
import Departments from "./Departments";
import Balances from "./Balances";
import AttendanceDashboard from "./AttendanceDashboard";
import Reports from "./Reports";
import AuditLog from "./AuditLog";
import TrustReviewQueue from "./TrustReviewQueue";
import { CareersPanel } from "@/components/careers/CareersPanel";
import { OnboardingPanel } from "@/components/onboarding/OnboardingPanel";
import { PerformanceReviewsPanel } from "@/components/reviews/PerformanceReviewsPanel";
import { TrainingCenterPanel } from "@/components/training/TrainingCenterPanel";
import { CertificationsPanel } from "@/components/training/CertificationsPanel";

const TABS = ["directory", "departments", "careers", "onboarding", "reviews", "training", "certifications", "balances", "attendance", "analytics", "audits", "trust-review"] as const;
type Tab = (typeof TABS)[number];
const LEGACY_TAB_ALIASES: Record<string, Tab> = {
  recruitment: "careers",
};

function normalizeTab(value: string | null): Tab {
  const candidate = value ? LEGACY_TAB_ALIASES[value] ?? value : "directory";
  return (TABS.includes(candidate as Tab) ? candidate : "directory") as Tab;
}

const HROperationsHub = () => {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab = normalizeTab(requestedTab);

  useEffect(() => {
    if (requestedTab && requestedTab !== tab) {
      setParams({ tab }, { replace: true });
    }
  }, [requestedTab, setParams, tab]);

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  const heading = tab === "careers" ? "Careers" : "HR Operations";
  const overline = tab === "careers" ? "Talent Operations" : "HR Admin";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Helmet>
        <title>{heading} | BALANCE</title>
      </Helmet>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{overline}</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">{heading}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="careers">Careers</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="trust-review">Trust Review</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-6"><Employees /></TabsContent>
        <TabsContent value="departments" className="mt-6"><Departments /></TabsContent>
        <TabsContent value="careers" className="mt-6"><CareersPanel /></TabsContent>
        <TabsContent value="onboarding" className="mt-6"><OnboardingPanel /></TabsContent>
        <TabsContent value="reviews" className="mt-6"><PerformanceReviewsPanel /></TabsContent>
        <TabsContent value="training" className="mt-6"><TrainingCenterPanel /></TabsContent>
        <TabsContent value="certifications" className="mt-6"><CertificationsPanel /></TabsContent>
        <TabsContent value="balances" className="mt-6"><Balances /></TabsContent>
        <TabsContent value="attendance" className="mt-6"><AttendanceDashboard /></TabsContent>
        <TabsContent value="analytics" className="mt-6"><Reports /></TabsContent>
        <TabsContent value="audits" className="mt-6"><AuditLog /></TabsContent>
        <TabsContent value="trust-review" className="mt-6"><TrustReviewQueue /></TabsContent>
      </Tabs>
    </div>
  );
};

export default HROperationsHub;

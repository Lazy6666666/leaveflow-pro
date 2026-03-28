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
import { cn } from "@/lib/utils";

const TABS = ["directory", "departments", "careers", "onboarding", "reviews", "training", "certifications", "balances", "attendance", "analytics", "audits", "trust-review"] as const;
type Tab = (typeof TABS)[number];
const LEGACY_TAB_ALIASES: Record<string, Tab> = {
  recruitment: "careers",
};

function normalizeTab(value: string | null): Tab {
  const candidate = value ? LEGACY_TAB_ALIASES[value] ?? value : "directory";
  return (TABS.includes(candidate as Tab) ? candidate : "directory") as Tab;
}

/**
 * Redesigned HROperationsHub: "The Digital Concierge"
 * Aesthetic: Architectural, editorial, no-line philosophy.
 */
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
  const overline = tab === "careers" ? "Talent Operations" : "HR Governance";

  return (
    <div className="mx-auto max-w-[1600px] space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-concierge">
      <Helmet>
        <title>{heading} | BALANCE</title>
      </Helmet>

      <header className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="h-1 w-12 terracotta-gradient rounded-full" />
           <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
             {overline}
           </span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-display font-bold tracking-tighter text-foreground leading-[0.85]">
          Human <br />
          <span className="text-primary italic font-medium">Capital.</span>
        </h1>
        <p className="max-w-[55ch] text-lg text-muted-foreground leading-relaxed font-sans">
          Central authority for workforce management, compliance monitoring, and talent acquisition.
          The orchestration layer for your organization's most vital resources.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-16">
        <div className="bg-muted/30 p-2 rounded-2xl">
          <TabsList className="h-auto p-0 bg-transparent flex flex-wrap gap-2 rounded-none w-full border-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className={cn(
                  "flex-1 min-w-[140px] rounded-xl h-12 px-6 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border-0",
                  "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-float",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/50"
                )}
              >
                {t.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          <TabsContent value="directory" className="m-0"><Employees /></TabsContent>
          <TabsContent value="departments" className="m-0"><Departments /></TabsContent>
          <TabsContent value="careers" className="m-0"><CareersPanel /></TabsContent>
          <TabsContent value="onboarding" className="m-0"><OnboardingPanel /></TabsContent>
          <TabsContent value="reviews" className="m-0"><PerformanceReviewsPanel /></TabsContent>
          <TabsContent value="training" className="m-0"><TrainingCenterPanel /></TabsContent>
          <TabsContent value="certifications" className="m-0"><CertificationsPanel /></TabsContent>
          <TabsContent value="balances" className="m-0"><Balances /></TabsContent>
          <TabsContent value="attendance" className="m-0"><AttendanceDashboard /></TabsContent>
          <TabsContent value="analytics" className="m-0"><Reports /></TabsContent>
          <TabsContent value="audits" className="m-0"><AuditLog /></TabsContent>
          <TabsContent value="trust-review" className="m-0"><TrustReviewQueue /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};


export default HROperationsHub;

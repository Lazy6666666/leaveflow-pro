import { useSearchParams } from "react-router-dom";
import { IntegrationsStatusPanel } from "@/components/integrations/IntegrationsStatusPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceSettings from "./AttendanceSettings";
import BiometricsSettings from "./BiometricsSettings";
import Policies from "./Policies";
import RosterAssignment from "./RosterAssignment";
import ShiftManagement from "./ShiftManagement";
import SitesManagement from "./SitesManagement";
import { cn } from "@/lib/utils";

const TABS = ["policies", "integrations", "sites", "attendance-config", "biometrics", "shifts", "rosters"] as const;
type Tab = (typeof TABS)[number];

/**
 * Redesigned SystemHub: "The Digital Concierge"
 * Aesthetic: Deep layering, organic groupings, no-line philosophy.
 */
const SystemHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "policies";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-concierge">
      <header className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="h-1 w-12 terracotta-gradient rounded-full" />
           <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
             System Architecture
           </span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-display font-bold tracking-tighter text-foreground leading-[0.85]">
          Root <br />
          <span className="text-primary italic font-medium">Administration.</span>
        </h1>
        <p className="max-w-[55ch] text-lg text-muted-foreground leading-relaxed font-sans">
          Configure global system telemetry, integration protocols, and compliance baselines.
          Manage the underlying framework that powers the Balance experience.
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
          <TabsContent value="policies" className="m-0"><Policies /></TabsContent>
          <TabsContent value="integrations" className="m-0"><IntegrationsStatusPanel /></TabsContent>
          <TabsContent value="sites" className="m-0"><SitesManagement /></TabsContent>
          <TabsContent value="attendance-config" className="m-0"><AttendanceSettings /></TabsContent>
          <TabsContent value="biometrics" className="m-0"><BiometricsSettings /></TabsContent>
          <TabsContent value="shifts" className="m-0"><ShiftManagement /></TabsContent>
          <TabsContent value="rosters" className="m-0"><RosterAssignment /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
};


export default SystemHub;

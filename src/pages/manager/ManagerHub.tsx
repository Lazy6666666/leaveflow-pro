import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import Approvals from "./Approvals";
import TeamCalendar from "./TeamCalendar";
import TeamAttendance from "./TeamAttendance";
import ManagerDelegation from "./ManagerDelegation";
import { ExpenseApprovalPanel } from "@/components/expenses/ExpenseApprovalPanel";

const TABS = ["approvals", "expenses", "team-calendar", "team-attendance", "delegation"] as const;
type Tab = (typeof TABS)[number];

const ManagerHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "approvals";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-24 px-4 md:px-8">
      <header className="space-y-4 pb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary">
          <Users className="h-3.5 w-3.5" />
          <span>Leadership Node</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight text-foreground leading-[1.1]">
          Manager <br />
          <span className="text-primary/40 italic font-light">Hub.</span>
        </h1>
        <p className="max-w-[45ch] text-lg text-muted-foreground font-sans leading-relaxed">
          Orchestrate team operations and financial approvals with deterministic precision.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-12">
        <TabsList className="h-auto p-1.5 bg-muted/40 rounded-xl flex-wrap w-full sm:w-auto inline-flex shadow-sm">
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-lg h-10 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              {t.replace("-", " ")}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="pt-4">
          <TabsContent value="approvals" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <Approvals />
            </div>
          </TabsContent>
          <TabsContent value="expenses" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <ExpenseApprovalPanel />
            </div>
          </TabsContent>
          <TabsContent value="team-calendar" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <TeamCalendar />
            </div>
          </TabsContent>
          <TabsContent value="team-attendance" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <TeamAttendance />
            </div>
          </TabsContent>
          <TabsContent value="delegation" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <ManagerDelegation />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};


export default ManagerHub;

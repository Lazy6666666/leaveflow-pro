import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Manager</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Manager Hub</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="team-calendar">Team Calendar</TabsTrigger>
          <TabsTrigger value="team-attendance">Team Attendance</TabsTrigger>
          <TabsTrigger value="delegation">Delegation</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6"><Approvals /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpenseApprovalPanel /></TabsContent>
        <TabsContent value="team-calendar" className="mt-6"><TeamCalendar /></TabsContent>
        <TabsContent value="team-attendance" className="mt-6"><TeamAttendance /></TabsContent>
        <TabsContent value="delegation" className="mt-6"><ManagerDelegation /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerHub;

import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Employees from "./Employees";
import Departments from "./Departments";
import Balances from "./Balances";
import AttendanceDashboard from "./AttendanceDashboard";
import Reports from "./Reports";
import AuditLog from "./AuditLog";
import TrustReviewQueue from "./TrustReviewQueue";

const TABS = ["directory", "departments", "balances", "attendance", "analytics", "audits", "trust-review"] as const;
type Tab = (typeof TABS)[number];

const HROperationsHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "directory";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">HR Operations</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="trust-review">Trust Review</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-6"><Employees /></TabsContent>
        <TabsContent value="departments" className="mt-6"><Departments /></TabsContent>
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

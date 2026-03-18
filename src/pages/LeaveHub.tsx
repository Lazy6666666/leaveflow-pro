import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyLeave from "./MyLeave";
import RequestLeave from "./RequestLeave";
import LeaveHistory from "./LeaveHistory";
import Holidays from "./Holidays";

const TABS = ["summary", "request", "history", "calendar"] as const;
type Tab = (typeof TABS)[number];

const LeaveHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "summary";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Leave</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Leave &amp; Holidays</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6"><MyLeave /></TabsContent>
        <TabsContent value="request" className="mt-6"><RequestLeave /></TabsContent>
        <TabsContent value="history" className="mt-6"><LeaveHistory /></TabsContent>
        <TabsContent value="calendar" className="mt-6"><Holidays /></TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveHub;

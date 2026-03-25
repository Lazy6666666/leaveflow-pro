import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Policies from "./Policies";
import SitesManagement from "./SitesManagement";
import AttendanceSettings from "./AttendanceSettings";
import BiometricsSettings from "./BiometricsSettings";
import ShiftManagement from "./ShiftManagement";
import RosterAssignment from "./RosterAssignment";

const TABS = ["policies", "sites", "attendance-config", "biometrics", "shifts", "rosters"] as const;
type Tab = (typeof TABS)[number];

const SystemHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "policies";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">System Administration</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="attendance-config">Attendance Config</TabsTrigger>
          <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="rosters">Rosters</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-6"><Policies /></TabsContent>
        <TabsContent value="sites" className="mt-6"><SitesManagement /></TabsContent>
        <TabsContent value="attendance-config" className="mt-6"><AttendanceSettings /></TabsContent>
        <TabsContent value="biometrics" className="mt-6"><BiometricsSettings /></TabsContent>
        <TabsContent value="shifts" className="mt-6"><ShiftManagement /></TabsContent>
        <TabsContent value="rosters" className="mt-6"><RosterAssignment /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHub;

import { useSearchParams } from "react-router-dom";

import { ExpenseEmployeePanel } from "@/components/expenses/ExpenseEmployeePanel";
import { PolicyAcknowledgementsEmployeePanel } from "@/components/policies/PolicyAcknowledgementsEmployeePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FaceEnrollment from "./employee/FaceEnrollment";
import ProfileSettings from "./ProfileSettings";

const TABS = ["profile", "biometrics", "expenses", "policies"] as const;
type Tab = (typeof TABS)[number];

const IdentityHub = () => {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) ?? "profile";

  const setTab = (value: string) => {
    setParams({ tab: value }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Account</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Identity &amp; Security</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6"><ProfileSettings /></TabsContent>
        <TabsContent value="biometrics" className="mt-6"><FaceEnrollment /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpenseEmployeePanel /></TabsContent>
        <TabsContent value="policies" className="mt-6"><PolicyAcknowledgementsEmployeePanel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default IdentityHub;

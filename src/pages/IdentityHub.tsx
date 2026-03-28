import { useSearchParams } from "react-router-dom";

import { ExpenseEmployeePanel } from "@/components/expenses/ExpenseEmployeePanel";
import { PolicyAcknowledgementsEmployeePanel } from "@/components/policies/PolicyAcknowledgementsEmployeePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";

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
    <div className="mx-auto max-w-7xl space-y-12 pb-24 px-4 md:px-8">
      <header className="space-y-4 pb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Identity Protocol</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-display font-black tracking-tight text-foreground leading-[1.1]">
          Sovereign <br />
          <span className="text-primary/40 italic font-light">Identity.</span>
        </h1>
        <p className="max-w-[45ch] text-lg text-muted-foreground font-sans leading-relaxed">
          Manage your cryptographically secured profile telemetry and professional biometrics.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-12">
        <TabsList className="h-auto p-1.5 bg-muted/40 rounded-xl flex-wrap sm:flex-nowrap w-full sm:w-auto inline-flex shadow-sm">
          {TABS.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-lg h-10 px-8 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="pt-4">
          <TabsContent value="profile" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <ProfileSettings />
            </div>
          </TabsContent>
          <TabsContent value="biometrics" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <FaceEnrollment />
            </div>
          </TabsContent>
          <TabsContent value="expenses" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <ExpenseEmployeePanel />
            </div>
          </TabsContent>
          <TabsContent value="policies" className="m-0 focus-visible:outline-none">
            <div className="bg-white rounded-xl shadow-float p-8">
              <PolicyAcknowledgementsEmployeePanel />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};


export default IdentityHub;

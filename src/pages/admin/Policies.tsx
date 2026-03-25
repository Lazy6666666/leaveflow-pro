import { Settings } from "lucide-react";

import { PolicyAcknowledgementsAdminPanel } from "@/components/policies/PolicyAcknowledgementsAdminPanel";
import { PolicyKnowledgePanel } from "@/components/policies/PolicyKnowledgePanel";
import { LeaveTypesPanel } from "@/components/policies/LeaveTypesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Policies = () => {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="flex items-center gap-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
            <Settings className="h-6 w-6 text-foreground" /> Policies & Knowledge
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage leave rules, policy acknowledgements, and the indexed policy knowledge that powers policy answers in the assistant.
          </p>
        </div>
      </div>

      <Tabs defaultValue="leave-types" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2">
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="policy-knowledge">Policy Knowledge</TabsTrigger>
          <TabsTrigger value="policy-acknowledgements">Policy Acknowledgements</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-types" className="space-y-6">
          <LeaveTypesPanel />
        </TabsContent>

        <TabsContent value="policy-knowledge" className="space-y-6">
          <PolicyKnowledgePanel />
        </TabsContent>

        <TabsContent value="policy-acknowledgements" className="space-y-6">
          <PolicyAcknowledgementsAdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Policies;

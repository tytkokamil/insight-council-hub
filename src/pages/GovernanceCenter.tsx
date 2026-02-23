import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Zap, Briefcase } from "lucide-react";

const EscalationEngine = lazy(() => import("./EscalationEngine"));
const RiskRegister = lazy(() => import("./RiskRegister"));
const AutomationRules = lazy(() => import("./AutomationRules"));
const ExecutiveHub = lazy(() => import("./ExecutiveHub"));

const GovernanceCenter = () => {
  const [tab, setTab] = useState("control");

  return (
    <AppLayout>
      <PageHeader
        title="Governance Center"
        subtitle="Zentrale Steuerung für Eskalation, Risiko, Automation und Executive Reporting"
        role="governance"
        help={{
          title: "Governance Center",
          description: "Bündelt Decision Control, Risk Register, Automations und Executive Hub in einer einheitlichen Steuerungsoberfläche.",
        }}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="control" className="gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5" /> Live Control
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Risiko
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" /> Automation
          </TabsTrigger>
          <TabsTrigger value="executive" className="gap-1.5 text-xs">
            <Briefcase className="w-3.5 h-3.5" /> Executive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control">
          <Suspense fallback={<PageLoadingFallback />}>
            <EscalationEngine embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="risk">
          <Suspense fallback={<PageLoadingFallback />}>
            <RiskRegister embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="automation">
          <Suspense fallback={<PageLoadingFallback />}>
            <AutomationRules embedded />
          </Suspense>
        </TabsContent>

        <TabsContent value="executive">
          <Suspense fallback={<PageLoadingFallback />}>
            <ExecutiveHub embedded />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default GovernanceCenter;

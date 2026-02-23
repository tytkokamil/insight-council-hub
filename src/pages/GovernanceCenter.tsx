import { lazy, Suspense, useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import HeroKpi from "@/components/shared/HeroKpi";
import PowerGrid from "@/components/shared/PowerGrid";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Zap, Briefcase, Gauge, Clock, Ban, Target } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";
import { useRisks } from "@/hooks/useRisks";
import { differenceInDays } from "date-fns";

const EscalationEngine = lazy(() => import("./EscalationEngine"));
const RiskRegister = lazy(() => import("./RiskRegister"));
const AutomationRules = lazy(() => import("./AutomationRules"));
const ExecutiveHub = lazy(() => import("./ExecutiveHub"));

const GovernanceCenter = () => {
  const [tab, setTab] = useState("control");
  const { data: decisions = [] } = useDecisions();
  const { data: risks = [] } = useRisks();

  const kpis = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const highRisk = active.filter(d => (d.ai_risk_score || 0) >= 60).length;
    const openRisks = risks.filter((r: any) => r.status === "open").length;
    const overdue = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
    const interventionNeeded = escalated + overdue;

    return { portfolioRisk: openRisks + highRisk, escalated, highRisk, openRisks, overdue, interventionNeeded };
  }, [decisions, risks]);

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

      {/* ═══ LAYER 1 ═══ */}
      <div className="mb-6">
        <HeroKpi items={[
          { label: "Portfolio Risk", value: `${kpis.portfolioRisk}`, icon: Shield, sentiment: kpis.portfolioRisk > 3 ? "critical" : kpis.portfolioRisk > 0 ? "warning" : "positive" },
          { label: "Eskalationen", value: `${kpis.escalated}`, icon: AlertTriangle, sentiment: kpis.escalated > 0 ? "warning" : "positive" },
          { label: "Automation Health", value: kpis.escalated === 0 ? "Stabil" : "Aktiv", icon: Zap, sentiment: kpis.escalated === 0 ? "positive" : "warning" },
          { label: "Intervention Req.", value: `${kpis.interventionNeeded}`, icon: Target, sentiment: kpis.interventionNeeded > 0 ? "critical" : "positive" },
        ]} />
      </div>

      {/* ═══ LAYER 2 ═══ */}
      <div className="mb-8">
        <PowerGrid title="Governance-Matrix" columns={3} items={[
          { label: "SLA Violations", value: kpis.overdue, icon: Clock, sentiment: kpis.overdue > 0 ? "critical" : "positive" },
          { label: "High Risk Decisions", value: kpis.highRisk, icon: Shield, sentiment: kpis.highRisk > 0 ? "warning" : "positive" },
          { label: "Open Risks", value: kpis.openRisks, icon: AlertTriangle },
          { label: "Escalation Count", value: kpis.escalated, icon: AlertTriangle },
          { label: "Risk Increase", value: kpis.portfolioRisk > 5 ? "Hoch" : "Normal", sentiment: kpis.portfolioRisk > 5 ? "warning" : "neutral" },
          { label: "Priority Drift", value: kpis.overdue > 2 ? "Ja" : "Nein", sentiment: kpis.overdue > 2 ? "warning" : "positive" },
        ]} />
      </div>

      {/* ═══ LAYER 3 – DEEP ═══ */}
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

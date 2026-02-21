import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Target, Sun, CalendarDays, DollarSign, FlaskConical, Dna, Trophy, Briefcase } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

const ExecutiveDashboard = lazy(() => import("./ExecutiveDashboard"));
const Briefing = lazy(() => import("./Briefing"));
const PredictiveTimeline = lazy(() => import("./PredictiveTimeline"));
const OpportunityCostRadar = lazy(() => import("./OpportunityCostRadar"));
const ScenarioEngine = lazy(() => import("./ScenarioEngine"));
const DecisionDNA = lazy(() => import("./DecisionDNA"));
const DecisionBenchmarking = lazy(() => import("./DecisionBenchmarking"));

const MIN_DECISIONS = 15;

const ExecutiveHub = () => {
  const [tab, setTab] = useState("dashboard");
  const { data: decisions = [], isLoading } = useDecisions();
  const implemented = decisions.filter(d => d.status === "implemented").length;
  const hasEnoughData = decisions.length >= MIN_DECISIONS && implemented >= 3;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Führungsebene</p>
          <h1 className="font-display text-xl font-bold">Executive Hub</h1>
        </div>
        <PageHelpButton title="Executive Hub" description="C-Level Cockpit mit Briefing, Prognosen, Kosten und Szenarien." />
      </div>

      {!isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={Briefcase}
          title="Executive Insights ab 15 Entscheidungen"
          description={`Für aussagekräftige C-Level-Analysen brauchst du mindestens 15 Entscheidungen (aktuell ${decisions.length}) und 3 implementierte (aktuell ${implemented}).`}
          ctaLabel="Entscheidungen erstellen"
          ctaRoute="/decisions"
          hint="Treibe Entscheidungen bis zur Implementierung, um Prognosen und ROI-Daten zu erhalten."
          features={[
            { icon: Sun, label: "KI-Briefing", desc: "Tägliche Zusammenfassung für die Führungsebene" },
            { icon: DollarSign, label: "Impact-Analyse", desc: "Opportunitätskosten und ROI" },
            { icon: FlaskConical, label: "Szenarien", desc: "What-If-Simulationen für strategische Planung" },
          ]}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <Target className="w-3.5 h-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="briefing" className="gap-1.5 text-xs">
              <Sun className="w-3.5 h-3.5" /> Briefing
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs">
              <CalendarDays className="w-3.5 h-3.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" /> Impact
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="gap-1.5 text-xs">
              <FlaskConical className="w-3.5 h-3.5" /> Szenarien
            </TabsTrigger>
            <TabsTrigger value="dna" className="gap-1.5 text-xs">
              <Dna className="w-3.5 h-3.5" /> DNA
            </TabsTrigger>
            <TabsTrigger value="benchmarking" className="gap-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5" /> Benchmark
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Suspense fallback={<PageLoadingFallback />}><ExecutiveDashboard embedded /></Suspense>
          </TabsContent>
          <TabsContent value="briefing">
            <Suspense fallback={<PageLoadingFallback />}><Briefing embedded /></Suspense>
          </TabsContent>
          <TabsContent value="timeline">
            <Suspense fallback={<PageLoadingFallback />}><PredictiveTimeline embedded /></Suspense>
          </TabsContent>
          <TabsContent value="costs">
            <Suspense fallback={<PageLoadingFallback />}><OpportunityCostRadar embedded /></Suspense>
          </TabsContent>
          <TabsContent value="scenarios">
            <Suspense fallback={<PageLoadingFallback />}><ScenarioEngine embedded /></Suspense>
          </TabsContent>
          <TabsContent value="dna">
            <Suspense fallback={<PageLoadingFallback />}><DecisionDNA embedded /></Suspense>
          </TabsContent>
          <TabsContent value="benchmarking">
            <Suspense fallback={<PageLoadingFallback />}><DecisionBenchmarking embedded /></Suspense>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default ExecutiveHub;

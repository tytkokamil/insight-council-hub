import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GitBranch, Flame, AlertTriangle, DollarSign, Clock, FlaskConical,
  Dna, Trophy, Activity, Brain, Target,
} from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

const DecisionGraph = lazy(() => import("./DecisionGraph"));
const FrictionMap = lazy(() => import("./FrictionMap"));
const BottleneckIntelligence = lazy(() => import("./BottleneckIntelligence"));
const HealthHeatmap = lazy(() => import("./HealthHeatmap"));
const OpportunityCostRadar = lazy(() => import("./OpportunityCostRadar"));
const PredictiveTimeline = lazy(() => import("./PredictiveTimeline"));
const ScenarioEngine = lazy(() => import("./ScenarioEngine"));
const DecisionDNA = lazy(() => import("./DecisionDNA"));
const DecisionBenchmarking = lazy(() => import("./DecisionBenchmarking"));
const PatternEngine = lazy(() => import("./PatternEngine"));

const MIN_DECISIONS = 10;

const IntelligenceCenter = () => {
  const [tab, setTab] = useState("structure");
  const { data: decisions = [], isLoading } = useDecisions();
  const hasEnoughData = decisions.length >= MIN_DECISIONS;

  return (
    <AppLayout>
      <PageHeader
        title="Intelligence Center"
        subtitle="Strukturelle, monetäre und prädiktive Analyse aller Entscheidungsprozesse"
        role="intelligence"
        help={{
          title: "Intelligence Center",
          description: "Vereint alle Analyse-Tools in vier Perspektiven: Struktur, Risiko & Kosten, Prognose und Muster.",
        }}
      />

      {!isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={Brain}
          title="Intelligence ab 10 Entscheidungen"
          description={`Für tiefgehende Analysen brauchst du mindestens 10 Entscheidungen (aktuell ${decisions.length}).`}
          ctaLabel="Entscheidungen erstellen"
          ctaRoute="/decisions"
          motivation="Organisationen mit systematischer Entscheidungsanalyse verbessern ihre Trefferquote um 35%."
          features={[
            { icon: GitBranch, label: "Struktur", desc: "Abhängigkeiten und Engpässe visualisieren" },
            { icon: DollarSign, label: "Kosten", desc: "Verzögerungskosten und Risikoexposition" },
            { icon: FlaskConical, label: "Prognose", desc: "Predictive Timeline und Szenarien" },
          ]}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="structure" className="gap-1.5 text-xs">
              <GitBranch className="w-3.5 h-3.5" /> Struktur
            </TabsTrigger>
            <TabsTrigger value="risk-cost" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" /> Risiko & Kosten
            </TabsTrigger>
            <TabsTrigger value="prediction" className="gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5" /> Prognose
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-1.5 text-xs">
              <Dna className="w-3.5 h-3.5" /> Muster
            </TabsTrigger>
          </TabsList>

          {/* Tab 1 – Structure */}
          <TabsContent value="structure" className="space-y-6">
            <Suspense fallback={<PageLoadingFallback />}>
              <DecisionGraph embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <FrictionMap embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <BottleneckIntelligence embedded />
            </Suspense>
          </TabsContent>

          {/* Tab 2 – Risk & Cost */}
          <TabsContent value="risk-cost" className="space-y-6">
            <Suspense fallback={<PageLoadingFallback />}>
              <HealthHeatmap embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <OpportunityCostRadar embedded />
            </Suspense>
          </TabsContent>

          {/* Tab 3 – Prediction */}
          <TabsContent value="prediction" className="space-y-6">
            <Suspense fallback={<PageLoadingFallback />}>
              <PredictiveTimeline embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <ScenarioEngine embedded />
            </Suspense>
          </TabsContent>

          {/* Tab 4 – Patterns */}
          <TabsContent value="patterns" className="space-y-6">
            <Suspense fallback={<PageLoadingFallback />}>
              <DecisionDNA embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <DecisionBenchmarking embedded />
            </Suspense>
            <Suspense fallback={<PageLoadingFallback />}>
              <PatternEngine embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default IntelligenceCenter;

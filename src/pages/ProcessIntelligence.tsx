import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Radar, Flame, AlertTriangle, Zap } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

const ProcessHub = lazy(() => import("./ProcessHub"));
const BottleneckIntelligence = lazy(() => import("./BottleneckIntelligence"));
const FrictionMap = lazy(() => import("./FrictionMap"));

const MIN_DECISIONS = 5;

const ProcessIntelligence = () => {
  const [tab, setTab] = useState("overview");
  const { data: decisions = [], isLoading } = useDecisions();
  const hasEnoughData = decisions.length >= MIN_DECISIONS;

  return (
    <AppLayout>
      <PageHeader
        title="Process Intelligence"
        subtitle="Engpässe, Reibungspunkte und Prozessoptimierung"
        role="intelligence"
        help={{
          title: "Process Intelligence",
          description: "Vereint Process Hub, Bottleneck Intelligence und Friction Map für eine ganzheitliche Prozessanalyse.",
        }}
      />

      {!isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={Radar}
          title="Prozessanalyse ab 5 Entscheidungen"
          description={`Für Prozessanalysen brauchst du mindestens 5 Entscheidungen (aktuell ${decisions.length}).`}
          ctaLabel="Entscheidungen erstellen"
          ctaRoute="/decisions"
          motivation="Teams mit Prozessanalyse reduzieren Durchlaufzeiten um 30%."
          features={[
            { icon: AlertTriangle, label: "Engpässe", desc: "Bottleneck Heatmap & Status × Team Matrix" },
            { icon: Flame, label: "Reibung", desc: "Friction Points & Cross-Team-Analyse" },
            { icon: Zap, label: "Optimierung", desc: "Automatisierungsvorschläge" },
          ]}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <Radar className="w-3.5 h-3.5" /> Übersicht
            </TabsTrigger>
            <TabsTrigger value="bottlenecks" className="gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" /> Engpässe
            </TabsTrigger>
            <TabsTrigger value="friction" className="gap-1.5 text-xs">
              <Flame className="w-3.5 h-3.5" /> Reibung
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Suspense fallback={<PageLoadingFallback />}>
              <ProcessHub embedded />
            </Suspense>
          </TabsContent>

          <TabsContent value="bottlenecks">
            <Suspense fallback={<PageLoadingFallback />}>
              <BottleneckIntelligence embedded />
            </Suspense>
          </TabsContent>

          <TabsContent value="friction">
            <Suspense fallback={<PageLoadingFallback />}>
              <FrictionMap embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default ProcessIntelligence;

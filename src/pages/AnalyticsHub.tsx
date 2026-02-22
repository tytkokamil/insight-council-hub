import { lazy, Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Users, TrendingUp, PieChart } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

const Analytics = lazy(() => import("./Analytics"));
const TeamPerformance = lazy(() => import("./TeamPerformance"));

const MIN_DECISIONS_FOR_ANALYTICS = 5;

const AnalyticsHub = () => {
  const [tab, setTab] = useState("analytics");
  const { data: decisions = [], isLoading } = useDecisions();
  const hasEnoughData = decisions.length >= MIN_DECISIONS_FOR_ANALYTICS;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Auswertung</p>
          <h1 className="font-display text-xl font-bold">Analytics Hub</h1>
        </div>
        <PageHelpButton title="Analytics Hub" description="Status, Trends, Durchlaufzeiten und Team-Vergleiche in einer zentralen Übersicht." />
      </div>

      {!isLoading && !hasEnoughData ? (
        <EmptyAnalysisState
          icon={BarChart3}
          title="Noch nicht genug Daten"
          description={`Analytics werden ab ${MIN_DECISIONS_FOR_ANALYTICS} Entscheidungen aussagekräftig. Du hast aktuell ${decisions.length}.`}
          ctaLabel="Entscheidung erstellen"
          ctaRoute="/decisions"
          motivation="Teams mit datengetriebener Entscheidungsanalyse verbessern ihre Zykluszeit um durchschnittlich 31% innerhalb von 3 Monaten."
          hint="Erstelle weitere Entscheidungen, um Trends und Muster zu erkennen."
          features={[
            { icon: TrendingUp, label: "Trends", desc: "Status-Verteilung und Velocity über Zeit" },
            { icon: PieChart, label: "Verteilung", desc: "Kategorien, Prioritäten und Teams" },
            { icon: Users, label: "Team-Vergleich", desc: "Performance-Metriken pro Team" },
          ]}
        />
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="analytics" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Statistiken
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Team-Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Suspense fallback={<PageLoadingFallback />}>
              <Analytics embedded />
            </Suspense>
          </TabsContent>

          <TabsContent value="teams">
            <Suspense fallback={<PageLoadingFallback />}>
              <TeamPerformance embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      )}
    </AppLayout>
  );
};

export default AnalyticsHub;

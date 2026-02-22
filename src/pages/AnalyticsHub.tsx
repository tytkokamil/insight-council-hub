import { lazy, Suspense, useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, PieChart, Users, FileDown, Loader2 } from "lucide-react";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { fetchBoardReportData, generateBoardReport } from "@/lib/generateBoardReport";
import { useToast } from "@/hooks/use-toast";

const Analytics = lazy(() => import("./Analytics"));

const MIN_DECISIONS_FOR_ANALYTICS = 5;

export type AnalyticsTimeRange = "7" | "30" | "90" | "all";

const AnalyticsHub = () => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { data: decisions = [], isLoading } = useDecisions();
  const hasEnoughData = decisions.length >= MIN_DECISIONS_FOR_ANALYTICS;

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchBoardReportData();
      generateBoardReport(data);
      toast({ title: "Exportiert", description: "Executive Snapshot als PDF." });
    } catch {
      toast({ title: "Fehler", description: "Export fehlgeschlagen.", variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Analytics Hub"
        subtitle="Performance & Governance über alle Entscheidungen"
        role="intelligence"
        help={{ title: "Analytics Hub", description: "Executive Control Center: KPIs, Bottlenecks, Risiko, Governance und Decision Quality auf einen Blick." }}
        secondaryActions={
          hasEnoughData ? (
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as AnalyticsTimeRange)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Letzte 7 Tage</SelectItem>
                <SelectItem value="30">Letzte 30 Tage</SelectItem>
                <SelectItem value="90">Letzte 90 Tage</SelectItem>
                <SelectItem value="all">Gesamt</SelectItem>
              </SelectContent>
            </Select>
          ) : undefined
        }
        primaryAction={
          hasEnoughData ? (
            <Button size="sm" variant="outline" disabled={exporting} onClick={handleExport} className="gap-2">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Executive Snapshot
            </Button>
          ) : undefined
        }
      />

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
        <Suspense fallback={<PageLoadingFallback />}>
          <Analytics embedded timeRange={timeRange} />
        </Suspense>
      )}
    </AppLayout>
  );
};

export default AnalyticsHub;

import { lazy, Suspense, useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import HeroKpi from "@/components/shared/HeroKpi";
import PowerGrid from "@/components/shared/PowerGrid";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, PieChart, Users, FileDown, Loader2, Gauge, DollarSign, Shield, Timer, Percent, AlertTriangle, Repeat, Layers } from "lucide-react";
import { useDecisions, useTeams, useReviews } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { fetchBoardReportData, generateBoardReport } from "@/lib/generateBoardReport";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, subDays } from "date-fns";

const Analytics = lazy(() => import("./Analytics"));

const MIN_DECISIONS_FOR_ANALYTICS = 5;

export type AnalyticsTimeRange = "7" | "30" | "90" | "all";

const AnalyticsHub = () => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { data: decisions = [], isLoading } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const hasEnoughData = decisions.length >= MIN_DECISIONS_FOR_ANALYTICS;

  const kpis = useMemo(() => {
    const now = new Date();
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented" && d.implemented_at);
    const rejected = decisions.filter(d => d.status === "rejected").length;
    const superseded = decisions.filter(d => d.status === "superseded").length;
    const avgDuration = implemented.length > 0
      ? Math.round(implemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / implemented.length) : 0;
    const fourWeeksAgo = subDays(now, 28);
    const recentImpl = implemented.filter(d => new Date(d.implemented_at!) >= fourWeeksAgo).length;
    const velocity = Math.round((recentImpl / 4) * 10) / 10;
    const highRisk = active.filter(d => (d.ai_risk_score || 0) >= 60).length;
    const escalated = active.filter(d => (d.escalation_level || 0) >= 1).length;
    const completionRate = decisions.length > 0 ? Math.round((implemented.length / decisions.length) * 100) : 0;
    const rejectionRate = decisions.length > 0 ? Math.round((rejected / decisions.length) * 100) : 0;
    const supersededRate = decisions.length > 0 ? Math.round((superseded / decisions.length) * 100) : 0;
    const reviewsCompleted = reviews.filter(r => r.reviewed_at).length;
    const avgReviewTime = reviewsCompleted > 0
      ? Math.round(reviews.filter(r => r.reviewed_at).reduce((s, r) => s + differenceInDays(new Date(r.reviewed_at!), new Date(r.created_at)), 0) / reviewsCompleted) : 0;

    return {
      performanceIndex: completionRate, velocity, highRisk, escalated,
      throughput: recentImpl, rejectionRate, supersededRate, avgReviewTime,
      avgDuration, completionRate, decisionDensity: decisions.length,
    };
  }, [decisions, reviews]);

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

      {hasEnoughData && (
        <>
          {/* ═══ LAYER 1 ═══ */}
          <div className="mb-6">
            <HeroKpi items={[
              { label: "Performance Index", value: `${kpis.performanceIndex}%`, icon: Gauge, sentiment: kpis.performanceIndex >= 60 ? "positive" : kpis.performanceIndex >= 30 ? "warning" : "critical" },
              { label: "Decision Velocity", value: `${kpis.velocity}/w`, icon: TrendingUp, sentiment: "neutral" },
              { label: "Risk Trend", value: `${kpis.highRisk}`, icon: Shield, sentiment: kpis.highRisk > 3 ? "critical" : kpis.highRisk > 0 ? "warning" : "positive" },
              { label: "Escalations", value: `${kpis.escalated}`, icon: AlertTriangle, sentiment: kpis.escalated > 0 ? "warning" : "positive" },
            ]} />
          </div>

          {/* ═══ LAYER 2 ═══ */}
          <div className="mb-8">
            <PowerGrid title="Analytics Matrix" columns={4} items={[
              { label: "Throughput (4w)", value: kpis.throughput, icon: TrendingUp },
              { label: "Rejection Rate", value: `${kpis.rejectionRate}%`, icon: Percent, sentiment: kpis.rejectionRate > 20 ? "warning" : "neutral" },
              { label: "Superseded Rate", value: `${kpis.supersededRate}%`, icon: Repeat },
              { label: "Avg Review Time", value: `${kpis.avgReviewTime}d`, icon: Timer },
              { label: "Phase Duration", value: `${kpis.avgDuration}d`, icon: Timer },
              { label: "Completion Rate", value: `${kpis.completionRate}%`, icon: Percent, sentiment: kpis.completionRate >= 60 ? "positive" : "warning" },
              { label: "Escalation Growth", value: kpis.escalated, icon: AlertTriangle },
              { label: "Decision Density", value: kpis.decisionDensity, icon: Layers },
            ]} />
          </div>
        </>
      )}

      {/* ═══ LAYER 3 – DEEP ═══ */}
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

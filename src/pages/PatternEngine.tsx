import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, Clock, Target, AlertTriangle, CheckCircle2,
  ArrowRight, BarChart3, Zap,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

type Decision = ReturnType<typeof useDecisions>["data"] extends (infer T)[] | undefined ? T : never;

interface PatternInsight {
  label: string;
  description: string;
  confidence: number;
  type: "success" | "warning" | "info";
  icon: typeof TrendingUp;
}

const computePatterns = (decisions: Decision[]) => {
  if (decisions.length < 2) return null;

  // ── Success rates by category ──
  const categoryStats: Record<string, { total: number; approved: number; rejected: number; avgDays: number[]; avgImpact: number[] }> = {};
  const priorityStats: Record<string, { total: number; approved: number; rejected: number; avgDays: number[] }> = {};

  decisions.forEach((d) => {
    // Category stats
    if (!categoryStats[d.category]) categoryStats[d.category] = { total: 0, approved: 0, rejected: 0, avgDays: [], avgImpact: [] };
    const cs = categoryStats[d.category];
    cs.total++;
    if (d.status === "approved" || d.status === "implemented") cs.approved++;
    if (d.status === "rejected") cs.rejected++;
    if (d.ai_impact_score) cs.avgImpact.push(d.ai_impact_score);

    // Decision velocity
    if (d.status !== "draft" && d.created_at && d.updated_at) {
      const days = differenceInDays(parseISO(d.updated_at), parseISO(d.created_at));
      if (days >= 0) cs.avgDays.push(days);
    }

    // Priority stats
    if (!priorityStats[d.priority]) priorityStats[d.priority] = { total: 0, approved: 0, rejected: 0, avgDays: [] };
    const ps = priorityStats[d.priority];
    ps.total++;
    if (d.status === "approved" || d.status === "implemented") ps.approved++;
    if (d.status === "rejected") ps.rejected++;
    if (d.status !== "draft" && d.created_at && d.updated_at) {
      const days = differenceInDays(parseISO(d.updated_at), parseISO(d.created_at));
      if (days >= 0) ps.avgDays.push(days);
    }
  });

  // ── Status distribution ──
  const statusCounts: Record<string, number> = {};
  decisions.forEach((d) => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
  });

  // ── Escalation patterns ──
  const escalated = decisions.filter((d) => (d.escalation_level || 0) > 0);
  const escalationRate = decisions.length > 0 ? (escalated.length / decisions.length) * 100 : 0;

  // ── Impact accuracy ──
  const withBothScores = decisions.filter((d) => d.ai_impact_score && d.actual_impact_score);
  const impactAccuracy = withBothScores.length > 0
    ? withBothScores.reduce((sum, d) => {
        const diff = Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0));
        return sum + (100 - diff);
      }, 0) / withBothScores.length
    : null;

  // ── Generate insights ──
  const insights: PatternInsight[] = [];

  // Best performing category
  const catEntries = Object.entries(categoryStats).filter(([, s]) => s.total >= 2);
  if (catEntries.length > 0) {
    const best = catEntries.reduce((a, b) => {
      const rateA = a[1].approved / a[1].total;
      const rateB = b[1].approved / b[1].total;
      return rateA >= rateB ? a : b;
    });
    const rate = Math.round((best[1].approved / best[1].total) * 100);
    if (rate > 50) {
      insights.push({
        label: `${best[0]} hat die höchste Erfolgsquote`,
        description: `${rate}% der ${best[0]}-Entscheidungen werden genehmigt. Dieser Bereich zeigt starke Entscheidungsqualität.`,
        confidence: Math.min(rate, 95),
        type: "success",
        icon: CheckCircle2,
      });
    }
  }

  // Worst category
  if (catEntries.length > 1) {
    const worst = catEntries.reduce((a, b) => {
      const rateA = a[1].rejected / a[1].total;
      const rateB = b[1].rejected / b[1].total;
      return rateA >= rateB ? a : b;
    });
    const rejRate = Math.round((worst[1].rejected / worst[1].total) * 100);
    if (rejRate > 20) {
      insights.push({
        label: `${worst[0]} hat hohe Ablehnungsrate`,
        description: `${rejRate}% Ablehnungen bei ${worst[0]}-Entscheidungen. Empfehlung: Review-Prozess für diesen Bereich optimieren.`,
        confidence: Math.min(rejRate + 40, 90),
        type: "warning",
        icon: AlertTriangle,
      });
    }
  }

  // Speed pattern
  const allDays = decisions
    .filter((d) => d.status !== "draft" && d.created_at && d.updated_at)
    .map((d) => differenceInDays(parseISO(d.updated_at), parseISO(d.created_at)))
    .filter((d) => d >= 0);
  const avgSpeed = allDays.length > 0 ? allDays.reduce((a, b) => a + b, 0) / allDays.length : 0;

  if (avgSpeed > 0) {
    insights.push({
      label: `Durchschnittliche Bearbeitungszeit: ${Math.round(avgSpeed)} Tage`,
      description: avgSpeed > 7
        ? "Entscheidungen brauchen länger als eine Woche. Schnellere Reviews könnten die Velocity verbessern."
        : "Gute Geschwindigkeit! Entscheidungen werden zügig bearbeitet.",
      confidence: Math.min(70 + allDays.length, 95),
      type: avgSpeed > 7 ? "warning" : "success",
      icon: Clock,
    });
  }

  // Escalation insight
  if (escalationRate > 15) {
    insights.push({
      label: `Eskalationsrate: ${Math.round(escalationRate)}%`,
      description: "Viele Entscheidungen werden eskaliert. Prüfe ob Zuständigkeiten klarer definiert werden können.",
      confidence: 80,
      type: "warning",
      icon: AlertTriangle,
    });
  }

  // Draft backlog
  const draftRate = ((statusCounts["draft"] || 0) / decisions.length) * 100;
  if (draftRate > 30) {
    insights.push({
      label: `${Math.round(draftRate)}% der Entscheidungen sind Entwürfe`,
      description: "Ein großer Anteil verbleibt im Draft-Status. Empfehlung: Regelmäßige Review-Runden einführen.",
      confidence: 85,
      type: "info",
      icon: Target,
    });
  }

  // Impact accuracy
  if (impactAccuracy !== null) {
    insights.push({
      label: `KI-Prognose-Genauigkeit: ${Math.round(impactAccuracy)}%`,
      description: impactAccuracy > 70
        ? "Die KI-Impact-Vorhersagen sind zuverlässig und können als Entscheidungsgrundlage dienen."
        : "Die KI-Prognosen weichen noch stark ab. Mehr Outcome-Dokumentation verbessert die Genauigkeit.",
      confidence: Math.round(impactAccuracy),
      type: impactAccuracy > 70 ? "success" : "info",
      icon: Brain,
    });
  }

  // ── Recommendations ──
  const recommendations: string[] = [];

  if (avgSpeed > 7) recommendations.push("Führe wöchentliche Decision-Reviews ein, um Bottlenecks zu vermeiden.");
  if (escalationRate > 15) recommendations.push("Definiere klarere Zuständigkeiten pro Kategorie, um Eskalationen zu reduzieren.");
  if (draftRate > 30) recommendations.push("Setze Deadlines für Entwürfe – Entscheidungen sollten maximal 5 Tage im Draft bleiben.");
  if (withBothScores.length < 3) recommendations.push("Dokumentiere mehr tatsächliche Auswirkungen, damit die Pattern-Engine besser lernen kann.");

  const bestPriority = Object.entries(priorityStats).reduce((a, b) => {
    const rateA = a[1].total > 0 ? a[1].approved / a[1].total : 0;
    const rateB = b[1].total > 0 ? b[1].approved / b[1].total : 0;
    return rateA >= rateB ? a : b;
  });
  if (bestPriority[1].total >= 2) {
    recommendations.push(`Priorität "${bestPriority[0]}" hat die beste Durchsatzrate – nutze diese Einstufung gezielt.`);
  }

  return {
    categoryStats,
    priorityStats,
    statusCounts,
    escalationRate,
    impactAccuracy,
    avgSpeed: Math.round(avgSpeed),
    insights,
    recommendations,
    totalDecisions: decisions.length,
    dataPoints: decisions.length + allDays.length + withBothScores.length,
  };
};

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch",
  budget: "Budget",
  hr: "Personal",
  technical: "Technisch",
  operational: "Operativ",
  marketing: "Marketing",
};

const priorityLabels: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

const PatternEngine = () => {
  const { data: decisions = [], isLoading } = useDecisions();
  const patterns = useMemo(() => computePatterns(decisions), [decisions]);

  if (isLoading) return <AppLayout><AnalysisPageSkeleton /></AppLayout>;
  if (!patterns) {
    return (
      <AppLayout>
        <EmptyAnalysisState
          icon={Brain}
          title="Noch keine Pattern-Daten"
          description="Erstelle mindestens 2 Entscheidungen, damit die Pattern-Engine Muster erkennen kann."
          hint="Die Pattern-Engine lernt aus deiner Entscheidungshistorie und gibt datenbasierte Empfehlungen."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">INTELLIGENCE</p>
          <h1 className="text-xl font-bold">Pattern Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lernt aus {patterns.totalDecisions} Entscheidungen · {patterns.dataPoints} Datenpunkte analysiert
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Entscheidungen</span>
              </div>
              <p className="text-2xl font-bold">{patterns.totalDecisions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Ø Geschwindigkeit</span>
              </div>
              <p className="text-2xl font-bold">{patterns.avgSpeed} <span className="text-sm font-normal text-muted-foreground">Tage</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Eskalationsrate</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(patterns.escalationRate)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Brain className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">KI-Genauigkeit</span>
              </div>
              <p className="text-2xl font-bold">{patterns.impactAccuracy !== null ? `${Math.round(patterns.impactAccuracy)}%` : "–"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {patterns.insights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Erkannte Muster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patterns.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    insight.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : insight.type === "warning"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                    insight.type === "success" ? "text-emerald-500" : insight.type === "warning" ? "text-amber-500" : "text-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium">{insight.label}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {insight.confidence}% Konfidenz
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Category & Priority Breakdown */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Erfolgsquote nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(patterns.categoryStats).map(([cat, stats]) => {
                const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{categoryLabels[cat] || cat}</span>
                      <span className="text-muted-foreground">
                        {rate}% · {stats.total} Entsch. · Ø {avg(stats.avgDays)}d
                      </span>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Durchsatz nach Priorität</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(patterns.priorityStats).map(([pri, stats]) => {
                const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                return (
                  <div key={pri} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{priorityLabels[pri] || pri}</span>
                      <span className="text-muted-foreground">
                        {rate}% · {stats.total} Entsch. · Ø {avg(stats.avgDays)}d
                      </span>
                    </div>
                    <Progress value={rate} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {patterns.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Empfehlungen der Pattern-Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {patterns.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default PatternEngine;

import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHint from "@/components/shared/PageHint";
import { Calendar, Clock, AlertTriangle, Activity, TrendingUp, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { differenceInDays, addDays, format, max as dateMax, min as dateMin } from "date-fns";
import { de } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDecisions, useFilteredDependencies } from "@/hooks/useDecisions";

interface TimelineDecision {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: string;
  created_at: string;
  due_date: string | null;
  ai_risk_score: number | null;
  escalation_level: number | null;
  daysOpen: number;
  predictedDaysLeft: number;
  predictedEnd: Date;
  confidence: number;
  warning: string | null;
}

const PredictiveTimeline = () => {
  const [sortBy, setSortBy] = useState<"predicted" | "priority" | "overdue">("predicted");

  const { data: allDecisions = [], isLoading: decLoading } = useDecisions();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();

  const loading = decLoading || depLoading;

  const decisions = useMemo(() => {
    if (loading || allDecisions.length === 0) return [];

    const now = new Date();

    const implemented = allDecisions.filter(d => d.status === "implemented" && d.implemented_at);
    const avgByKey: Record<string, number[]> = {};
    implemented.forEach(d => {
      const key = `${d.category}_${d.priority}`;
      const days = differenceInDays(new Date(d.implemented_at!), new Date(d.created_at));
      if (!avgByKey[key]) avgByKey[key] = [];
      avgByKey[key].push(days);
    });
    const globalAvg = implemented.length
      ? implemented.reduce((sum, d) => sum + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / implemented.length
      : 14;

    const getAvgDays = (category: string, priority: string) => {
      const key = `${category}_${priority}`;
      const arr = avgByKey[key];
      if (arr && arr.length >= 2) return arr.reduce((a, b) => a + b, 0) / arr.length;
      // Fallback: category only
      const catArr = Object.entries(avgByKey)
        .filter(([k]) => k.startsWith(category))
        .flatMap(([, v]) => v);
      if (catArr.length >= 2) return catArr.reduce((a, b) => a + b, 0) / catArr.length;
      return globalAvg;
    };

    // Blocked decision IDs
    const blockedIds = new Set((deps).map(d => d.target_decision_id));

    const open = allDecisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const timeline: TimelineDecision[] = open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const expectedTotal = getAvgDays(d.category, d.priority);

      // Adjustments
      let adjustedTotal = expectedTotal;
      if (d.status === "draft") adjustedTotal *= 1.3; // drafts take longer
      if (d.status === "approved") adjustedTotal *= 0.7; // approved = near done
      if (blockedIds.has(d.id)) adjustedTotal *= 1.5; // blocked = delayed
      if ((d.escalation_level || 0) > 0) adjustedTotal *= 0.85; // escalated = pressure
      if ((d.ai_risk_score || 0) > 60) adjustedTotal *= 1.2; // high risk = slower

      const predictedDaysLeft = Math.max(1, Math.round(adjustedTotal - daysOpen));
      const predictedEnd = addDays(now, predictedDaysLeft);

      // Confidence based on data quality
      const key = `${d.category}_${d.priority}`;
      const sampleSize = avgByKey[key]?.length || 0;
      let confidence = Math.min(95, 40 + sampleSize * 10);
      if (blockedIds.has(d.id)) confidence -= 15;
      if ((d.ai_risk_score || 0) > 60) confidence -= 10;
      confidence = Math.max(20, confidence);

      // Warnings
      let warning: string | null = null;
      if (d.due_date && new Date(d.due_date) < predictedEnd) {
        warning = `Voraussichtlich ${differenceInDays(predictedEnd, new Date(d.due_date))} Tage nach Deadline`;
      } else if (blockedIds.has(d.id)) {
        warning = "Durch Abhängigkeit blockiert";
      } else if (daysOpen > expectedTotal * 1.5) {
        warning = "Deutlich über Durchschnitt";
      }

      return {
        id: d.id, title: d.title, priority: d.priority, category: d.category,
        status: d.status, created_at: d.created_at, due_date: d.due_date,
        ai_risk_score: d.ai_risk_score, escalation_level: d.escalation_level,
        daysOpen, predictedDaysLeft, predictedEnd, confidence, warning,
      };
    });

    return timeline;
  }, [loading, allDecisions, deps]);

  const sorted = useMemo(() => {
    const copy = [...decisions];
    if (sortBy === "predicted") copy.sort((a, b) => a.predictedEnd.getTime() - b.predictedEnd.getTime());
    else if (sortBy === "priority") {
      const w: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      copy.sort((a, b) => (w[a.priority] ?? 2) - (w[b.priority] ?? 2));
    } else {
      copy.sort((a, b) => (b.warning ? 1 : 0) - (a.warning ? 1 : 0) || a.predictedEnd.getTime() - b.predictedEnd.getTime());
    }
    return copy;
  }, [decisions, sortBy]);

  // Gantt range
  const ganttRange = useMemo(() => {
    if (decisions.length === 0) return { start: new Date(), end: addDays(new Date(), 30), totalDays: 30 };
    const starts = decisions.map(d => new Date(d.created_at));
    const ends = decisions.map(d => d.predictedEnd);
    const start = dateMin(starts);
    const end = dateMax(ends);
    const totalDays = Math.max(differenceInDays(end, start), 7);
    return { start, end: addDays(end, 2), totalDays: totalDays + 2 };
  }, [decisions]);

  const getBarStyle = (d: TimelineDecision) => {
    const startOffset = differenceInDays(new Date(d.created_at), ganttRange.start);
    const duration = d.daysOpen + d.predictedDaysLeft;
    const left = (startOffset / ganttRange.totalDays) * 100;
    const width = Math.max((duration / ganttRange.totalDays) * 100, 2);
    const elapsed = (d.daysOpen / ganttRange.totalDays) * 100;
    return { left: `${left}%`, width: `${width}%`, elapsed: `${(d.daysOpen / duration) * 100}%` };
  };

  const priorityColor = (p: string) =>
    p === "critical" ? "bg-destructive" : p === "high" ? "bg-warning" : p === "medium" ? "bg-primary" : "bg-muted-foreground";
  const priorityBadge = (p: string) =>
    p === "critical" ? "bg-destructive/20 text-destructive" : p === "high" ? "bg-warning/20 text-warning" : p === "medium" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  // Stats
  const avgPredicted = decisions.length ? Math.round(decisions.reduce((s, d) => s + d.predictedDaysLeft, 0) / decisions.length) : 0;
  const atRisk = decisions.filter(d => d.warning).length;
  const avgConfidence = decisions.length ? Math.round(decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length) : 0;

  // Generate date markers for the Gantt header
  const dateMarkers = useMemo(() => {
    const markers: { label: string; position: number }[] = [];
    const step = Math.max(Math.floor(ganttRange.totalDays / 6), 1);
    for (let i = 0; i <= ganttRange.totalDays; i += step) {
      markers.push({
        label: format(addDays(ganttRange.start, i), "dd.MM", { locale: de }),
        position: (i / ganttRange.totalDays) * 100,
      });
    }
    return markers;
  }, [ganttRange]);

  // Today marker
  const todayPosition = useMemo(() => {
    const days = differenceInDays(new Date(), ganttRange.start);
    return (days / ganttRange.totalDays) * 100;
  }, [ganttRange]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Prognose</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Predictive Timeline</h1>
            <PageHint>
              KI-gestützte Fertigstellungsprognose basierend auf historischen Mustern. Zeigt erwartete Abschlusszeiten und kritische Pfade mit Abhängigkeitsketten.
            </PageHint>
          </div>
          <p className="text-sm text-muted-foreground mt-1">KI-gestützte Fertigstellungsprognose basierend auf historischen Mustern</p>
        </div>

        {loading ? (
          <AnalysisPageSkeleton cards={4} sections={1} />
        ) : decisions.length === 0 ? (
          <EmptyAnalysisState
            icon={Calendar}
            title="Keine offenen Entscheidungen"
            description="Die Timeline zeigt Prognosen für offene Entscheidungen. Erstelle eine neue Entscheidung, um die Vorhersage zu starten."
            hint="Historische Daten verbessern die Prognose-Genauigkeit"
          />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">Offene Entscheidungen</p>
                <p className="text-xl font-bold tabular-nums">{decisions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">Ø Tage bis Abschluss</p>
                <p className="text-xl font-bold tabular-nums">{avgPredicted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-warning" /> Gefährdet
                </p>
                <p className="text-xl font-bold tabular-nums text-warning">{atRisk}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">Ø Konfidenz</p>
                <p className="text-xl font-bold tabular-nums">{avgConfidence}%</p>
              </div>
            </div>

            <CollapsibleSection
              title="Gantt-Prognose"
              subtitle="Timeline aller offenen Entscheidungen"
              icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
            >
            {/* Sort Controls */}
            <div className="flex gap-2 mb-4">
              {([
                { key: "predicted", label: "Nach Prognose" },
                { key: "priority", label: "Nach Priorität" },
                { key: "overdue", label: "Gefährdete zuerst" },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    sortBy === s.key ? "bg-foreground/10 text-foreground font-medium" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Gantt Chart */}
            <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
              {/* Date Header */}
              <div className="relative h-8 border-b border-border bg-muted/30 px-4">
                {dateMarkers.map((m, i) => (
                  <span
                    key={i}
                    className="absolute text-[10px] text-muted-foreground top-2 -translate-x-1/2"
                    style={{ left: `calc(200px + (100% - 200px) * ${m.position / 100})` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/50">
                {sorted.map((d) => {
                  const bar = getBarStyle(d);
                  return (
                    <div key={d.id} className="flex items-center h-12 hover:bg-muted/20 transition-colors group">
                      {/* Label */}
                      <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColor(d.priority)}`} />
                        <span className="text-xs truncate">{d.title}</span>
                      </div>
                      {/* Bar area */}
                      <div className="flex-1 relative h-full px-1">
                        {/* Today line */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                          style={{ left: `${todayPosition}%` }}
                        />
                        {/* Bar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-2 bottom-2 rounded-md overflow-hidden cursor-default"
                              style={{ left: bar.left, width: bar.width }}
                            >
                              {/* Elapsed portion */}
                              <div
                                className={`absolute inset-y-0 left-0 ${priorityColor(d.priority)} opacity-80`}
                                style={{ width: bar.elapsed }}
                              />
                              {/* Predicted portion */}
                              <div
                                className={`absolute inset-y-0 right-0 ${priorityColor(d.priority)} opacity-30`}
                                style={{ width: `${100 - parseFloat(bar.elapsed)}%` }}
                              />
                              {/* Warning stripe */}
                              {d.warning && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-warning" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">{d.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {d.daysOpen}d offen · Prognose: +{d.predictedDaysLeft}d · bis {format(d.predictedEnd, "dd.MM.yyyy")}
                              </p>
                              <p className="text-[10px]">Konfidenz: {d.confidence}%</p>
                              {d.warning && (
                                <p className="text-[10px] text-warning flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {d.warning}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {/* Predicted date */}
                      <div className="w-24 shrink-0 text-right pr-3">
                        <p className="text-[10px] text-muted-foreground">{format(d.predictedEnd, "dd.MM.yy")}</p>
                        <p className="text-[10px] text-muted-foreground/60">{d.confidence}%</p>
                      </div>
                    </div>
                  );
                })}
                {sorted.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Keine offenen Entscheidungen vorhanden.
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-primary opacity-80 rounded" /> Vergangen</span>
                <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-primary opacity-30 rounded" /> Prognose</span>
                <span className="flex items-center gap-1"><div className="w-px h-3 bg-primary/40" /> Heute</span>
                <span className="flex items-center gap-1"><div className="w-1 h-3 bg-warning rounded" /> Warnung</span>
              </div>
            </div>
            </CollapsibleSection>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default PredictiveTimeline;

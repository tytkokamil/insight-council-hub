import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Calendar, Clock, AlertTriangle, Activity, TrendingUp, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

import { differenceInDays, addDays, format, max as dateMax, min as dateMin } from "date-fns";
import { de, enUS } from "date-fns/locale";
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

const PredictiveTimeline = ({ embedded }: { embedded?: boolean }) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const [sortBy, setSortBy] = useState<"predicted" | "priority" | "overdue">("predicted");
  const [timeRange, setTimeRange] = useState<30 | 60 | 90 | 0>(0);

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
      const catArr = Object.entries(avgByKey)
        .filter(([k]) => k.startsWith(category))
        .flatMap(([, v]) => v);
      if (catArr.length >= 2) return catArr.reduce((a, b) => a + b, 0) / catArr.length;
      return globalAvg;
    };

    const blockedIds = new Set((deps).map(d => d.target_decision_id));

    const open = allDecisions.filter(d => !["implemented", "rejected"].includes(d.status));
    const timeline: TimelineDecision[] = open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const expectedTotal = getAvgDays(d.category, d.priority);

      let adjustedTotal = expectedTotal;
      if (d.status === "draft") adjustedTotal *= 1.3;
      if (d.status === "approved") adjustedTotal *= 0.7;
      if (blockedIds.has(d.id)) adjustedTotal *= 1.5;
      if ((d.escalation_level || 0) > 0) adjustedTotal *= 0.85;
      if ((d.ai_risk_score || 0) > 60) adjustedTotal *= 1.2;

      const predictedDaysLeft = Math.max(1, Math.round(adjustedTotal - daysOpen));
      const predictedEnd = addDays(now, predictedDaysLeft);

      const key = `${d.category}_${d.priority}`;
      const sampleSize = avgByKey[key]?.length || 0;
      let confidence = Math.min(95, 40 + sampleSize * 10);
      if (blockedIds.has(d.id)) confidence -= 15;
      if ((d.ai_risk_score || 0) > 60) confidence -= 10;
      confidence = Math.max(20, confidence);

      let warning: string | null = null;
      if (d.due_date && new Date(d.due_date) < predictedEnd) {
        warning = t("predictive.warnPastDeadline", { days: differenceInDays(predictedEnd, new Date(d.due_date)) });
      } else if (blockedIds.has(d.id)) {
        warning = t("predictive.warnBlocked");
      } else if (daysOpen > expectedTotal * 1.5) {
        warning = t("predictive.warnAboveAverage");
      }

      return {
        id: d.id, title: d.title, priority: d.priority, category: d.category,
        status: d.status, created_at: d.created_at, due_date: d.due_date,
        ai_risk_score: d.ai_risk_score, escalation_level: d.escalation_level,
        daysOpen, predictedDaysLeft, predictedEnd, confidence, warning,
      };
    });

    return timeline;
  }, [loading, allDecisions, deps, t]);

  // Filter by time range
  const filteredDecisions = useMemo(() => {
    if (timeRange === 0) return decisions;
    const cutoff = addDays(new Date(), timeRange);
    return decisions.filter(d => d.predictedEnd <= cutoff);
  }, [decisions, timeRange]);

  const sorted = useMemo(() => {
    const copy = [...filteredDecisions];
    if (sortBy === "predicted") copy.sort((a, b) => a.predictedEnd.getTime() - b.predictedEnd.getTime());
    else if (sortBy === "priority") {
      const w: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      copy.sort((a, b) => (w[a.priority] ?? 2) - (w[b.priority] ?? 2));
    } else {
      copy.sort((a, b) => (b.warning ? 1 : 0) - (a.warning ? 1 : 0) || a.predictedEnd.getTime() - b.predictedEnd.getTime());
    }
    return copy;
  }, [filteredDecisions, sortBy]);

  const ganttRange = useMemo(() => {
    if (sorted.length === 0) return { start: new Date(), end: addDays(new Date(), 30), totalDays: 30 };
    const starts = sorted.map(d => new Date(d.created_at));
    const ends = sorted.map(d => d.predictedEnd);
    const start = dateMin(starts);
    const end = dateMax(ends);
    const totalDays = Math.max(differenceInDays(end, start), 7);
    return { start, end: addDays(end, 2), totalDays: totalDays + 2 };
  }, [sorted]);

  const getBarStyle = (d: TimelineDecision) => {
    const startOffset = differenceInDays(new Date(d.created_at), ganttRange.start);
    const duration = d.daysOpen + d.predictedDaysLeft;
    const left = (startOffset / ganttRange.totalDays) * 100;
    const width = Math.max((duration / ganttRange.totalDays) * 100, 2);
    return { left: `${left}%`, width: `${width}%`, elapsed: `${(d.daysOpen / duration) * 100}%` };
  };

  const priorityColor = (p: string) =>
    p === "critical" ? "bg-destructive" : p === "high" ? "bg-warning" : p === "medium" ? "bg-primary" : "bg-muted-foreground";

  const confidenceColor = (c: number) =>
    c >= 70 ? "text-success" : c >= 50 ? "text-warning" : "text-destructive";

  const avgPredicted = filteredDecisions.length ? Math.round(filteredDecisions.reduce((s, d) => s + d.predictedDaysLeft, 0) / filteredDecisions.length) : 0;
  const atRisk = filteredDecisions.filter(d => d.warning).length;
  const avgConfidence = filteredDecisions.length ? Math.round(filteredDecisions.reduce((s, d) => s + d.confidence, 0) / filteredDecisions.length) : 0;

  const dateMarkers = useMemo(() => {
    const markers: { label: string; position: number }[] = [];
    const step = Math.max(Math.floor(ganttRange.totalDays / 6), 1);
    for (let i = 0; i <= ganttRange.totalDays; i += step) {
      markers.push({
        label: format(addDays(ganttRange.start, i), "dd.MM", { locale: dateFnsLocale }),
        position: (i / ganttRange.totalDays) * 100,
      });
    }
    return markers;
  }, [ganttRange, dateFnsLocale]);

  const todayPosition = useMemo(() => {
    const days = differenceInDays(new Date(), ganttRange.start);
    return (days / ganttRange.totalDays) * 100;
  }, [ganttRange]);

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("predictive.label")}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t("predictive.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("predictive.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Time range filter */}
            <div className="flex bg-muted/50 rounded-lg p-0.5">
              {([
                { value: 30, label: t("predictive.timeRange30") },
                { value: 60, label: t("predictive.timeRange60") },
                { value: 90, label: t("predictive.timeRange90") },
                { value: 0, label: t("predictive.timeRangeAll") },
              ] as const).map(r => (
                <button
                  key={r.value}
                  onClick={() => setTimeRange(r.value)}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    timeRange === r.value
                      ? "bg-background text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <PageHelpButton title={t("predictive.title")} description={t("predictive.helpDesc")} />
          </div>
        </div>

        {loading ? (
          <AnalysisPageSkeleton cards={4} sections={1} />
        ) : decisions.length === 0 ? (
          <EmptyAnalysisState
            icon={Calendar}
            title={t("predictive.noOpenDecisions")}
            description={t("predictive.noOpenDecisionsDesc")}
            hint={t("predictive.noOpenDecisionsHint")}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">{t("predictive.openDecisions")}</p>
                <p className="text-xl font-bold tabular-nums">{filteredDecisions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1">{t("predictive.avgDaysToCompletion")}</p>
                <p className="text-xl font-bold tabular-nums">{avgPredicted}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  {atRisk === filteredDecisions.length && filteredDecisions.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-default">
                          <AlertTriangle className="w-3 h-3 text-warning" /> {t("predictive.atRisk")}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs max-w-xs">{t("predictive.allAtRiskHint", "Hohe Quote bei wenig Daten normal — Prognose verbessert sich ab 10+ Entscheidungen.")}</p></TooltipContent>
                    </Tooltip>
                  ) : (
                    <><AlertTriangle className="w-3 h-3 text-warning" /> {t("predictive.atRisk")}</>
                  )}
                </p>
                <p className={`text-xl font-bold tabular-nums ${atRisk > filteredDecisions.length * 0.5 ? "text-destructive" : atRisk > 0 ? "text-warning" : "text-success"}`}>{atRisk}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border cursor-default">
                <p className="text-[10px] text-muted-foreground mb-1">{t("predictive.avgConfidence")}</p>
                <p className={`text-xl font-bold tabular-nums ${confidenceColor(avgConfidence)}`}>{avgConfidence}%</p>
                <p className="text-[10px] mt-0.5 text-muted-foreground">
                  {t("predictive.confidenceGrowHint", "Steigt automatisch mit mehr abgeschlossenen Entscheidungen.")}
                </p>
              </div>
            </div>

            <CollapsibleSection
              title={t("predictive.ganttForecast")}
              subtitle={t("predictive.ganttSubtitle")}
              icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
            >
            <div className="flex gap-1 mb-4">
              {([
                { key: "predicted", label: t("predictive.sortByPrediction") },
                { key: "priority", label: t("predictive.sortByPriority") },
                { key: "overdue", label: t("predictive.sortByOverdue") },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    sortBy === s.key
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
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

              <div className="divide-y divide-border/50">
                {sorted.map((d) => {
                  const bar = getBarStyle(d);
                  return (
                    <div key={d.id} className="flex items-center h-12 hover:bg-muted/20 transition-colors group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-[200px] shrink-0 px-3 flex items-center gap-2 min-w-0 cursor-default">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColor(d.priority)}`} />
                            <span className="text-xs truncate">{d.title}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs max-w-xs">
                          {d.title}
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex-1 relative h-full px-1">
                        {/* Past shading */}
                        <div
                          className="absolute top-0 bottom-0 z-[5] pointer-events-none"
                          style={{ left: 0, width: `${todayPosition}%`, backgroundColor: "hsl(var(--primary) / 0.03)" }}
                        />
                        {/* Today line */}
                        <div
                          className="absolute top-0 bottom-0 z-10"
                          style={{ left: `${todayPosition}%`, width: "2px", backgroundColor: "hsl(var(--primary))" }}
                        />
                        <span
                          className="absolute z-10 font-bold"
                          style={{ left: `${todayPosition}%`, top: "-2px", transform: "translateX(-50%)", fontSize: "11px", color: "hsl(var(--primary))" }}
                        >
                          {t("predictive.legendToday", "Heute")}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-2 bottom-2 rounded-md overflow-hidden cursor-default"
                              style={{ left: bar.left, width: bar.width }}
                            >
                              <div
                                className={`absolute inset-y-0 left-0 ${priorityColor(d.priority)} opacity-80`}
                                style={{ width: bar.elapsed }}
                              />
                              <div
                                className={`absolute inset-y-0 right-0 ${priorityColor(d.priority)} opacity-30`}
                                style={{ width: `${100 - parseFloat(bar.elapsed)}%` }}
                              />
                              {d.warning && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-warning" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">{d.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {t("predictive.daysOpen", { days: d.daysOpen })} · {t("predictive.forecast", { days: d.predictedDaysLeft })} · {t("predictive.until", { date: format(d.predictedEnd, "dd.MM.yyyy") })}
                              </p>
                              <p className="text-[10px]">{t("predictive.confidence", { pct: d.confidence })}</p>
                              {d.warning && (
                                <p className="text-[10px] text-warning flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {d.warning}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="w-24 shrink-0 text-right pr-3">
                        <p className="text-[10px] text-muted-foreground">{format(d.predictedEnd, "dd.MM.yy")}</p>
                        <p className={`text-[10px] ${confidenceColor(d.confidence)}`}>{d.confidence}%</p>
                      </div>
                    </div>
                  );
                })}
                {sorted.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    {t("predictive.noOpenRows")}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-primary opacity-80 rounded" /> {t("predictive.legendElapsed")}</span>
                <span className="flex items-center gap-1"><div className="w-3 h-1.5 bg-primary opacity-30 rounded" /> {t("predictive.legendForecast")}</span>
                <span className="flex items-center gap-1"><div className="h-3" style={{ width: "2px", backgroundColor: "hsl(var(--primary))" }} /> {t("predictive.legendToday")}</span>
                <span className="flex items-center gap-1"><div className="w-1 h-3 bg-warning rounded" /> {t("predictive.legendWarning")}</span>
              </div>
            </div>
            </CollapsibleSection>

          </>
        )}
      </div>
    </Wrap>
  );
};

export default PredictiveTimeline;

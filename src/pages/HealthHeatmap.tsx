import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Activity, Heart, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, XCircle, CheckSquare, Info } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

type Dimension = "team" | "category" | "priority" | "type";

interface HealthCell {
  label: string;
  total: number;
  completed: number;
  avgDays: number;
  overdueRate: number;
  rejectedRate: number;
  healthScore: number;
}

interface UnifiedItem {
  id: string;
  category: string;
  priority: string;
  status: string;
  team_id: string | null;
  created_at: string;
  due_date: string | null;
  completed_at: string | null;
  rejected: boolean;
  itemType: "decision" | "task";
}

const HealthHeatmap = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingDec || loadingTasks || loadingTeams;
  const [rowDim, setRowDim] = useState<Dimension>("team");
  const [colDim, setColDim] = useState<Dimension>("category");

  const categoryLabels: Record<string, string> = {
    strategic: t("healthHeatmap.catStrategic"), budget: t("healthHeatmap.catBudget"), hr: t("healthHeatmap.catHr"),
    technical: t("healthHeatmap.catTechnical"), operational: t("healthHeatmap.catOperational"), marketing: t("healthHeatmap.catMarketing"),
    general: t("healthHeatmap.catGeneral"),
  };
  const priorityLabels: Record<string, string> = {
    low: t("healthHeatmap.priLow"), medium: t("healthHeatmap.priMedium"), high: t("healthHeatmap.priHigh"), critical: t("healthHeatmap.priCritical"),
  };
  const typeLabels: Record<string, string> = {
    decision: t("healthHeatmap.typeDecision"), task: t("healthHeatmap.typeTask"),
  };

  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t.name])), [teams]);

  const items: UnifiedItem[] = useMemo(() => {
    const decItems: UnifiedItem[] = decisions.map(d => ({
      id: d.id, category: d.category, priority: d.priority, status: d.status,
      team_id: d.team_id, created_at: d.created_at, due_date: d.due_date,
      completed_at: d.implemented_at || null, rejected: d.status === "rejected",
      itemType: "decision" as const,
    }));
    const taskItems: UnifiedItem[] = tasks.map(t => ({
      id: t.id, category: t.category || "general", priority: t.priority, status: t.status,
      team_id: t.team_id, created_at: t.created_at, due_date: t.due_date,
      completed_at: t.completed_at || null, rejected: false,
      itemType: "task" as const,
    }));
    return [...decItems, ...taskItems];
  }, [decisions, tasks]);

  const getLabels = (dim: Dimension): string[] => {
    if (dim === "team") return teams.map(t => t.name);
    if (dim === "category") return [...new Set(items.map(i => i.category))].sort();
    if (dim === "type") return ["decision", "task"];
    return Object.keys(priorityLabels);
  };

  const getDisplayLabel = (dim: Dimension, key: string): string => {
    if (dim === "category") return categoryLabels[key] || key;
    if (dim === "priority") return priorityLabels[key] || key;
    if (dim === "type") return typeLabels[key] || key;
    return key;
  };

  const getValue = (item: UnifiedItem, dim: Dimension): string => {
    if (dim === "team") return item.team_id ? (teamMap[item.team_id] || "") : "";
    if (dim === "category") return item.category;
    if (dim === "type") return item.itemType;
    return item.priority;
  };

  const heatmap = useMemo(() => {
    const rows = getLabels(rowDim);
    const cols = getLabels(colDim);
    const now = Date.now();
    const cells: Record<string, HealthCell> = {};

    rows.forEach(row => {
      cols.forEach(col => {
        const key = `${row}|${col}`;
        const matching = items.filter(i => getValue(i, rowDim) === row && getValue(i, colDim) === col);
        const total = matching.length;
        const completed = matching.filter(i => i.completed_at !== null).length;
        const rejected = matching.filter(i => i.rejected).length;
        const overdue = matching.filter(i => i.due_date && new Date(i.due_date).getTime() < now && !i.completed_at && !i.rejected).length;
        const durations = matching.filter(i => i.completed_at).map(i => (new Date(i.completed_at!).getTime() - new Date(i.created_at).getTime()) / 86400000);
        const avgDays = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10 : 0;
        const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
        const rejectedRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
        const completeRate = total > 0 ? (completed / total) : 0;
        let healthScore = 0;
        if (total > 0) {
          healthScore = Math.round(completeRate * 40 + (1 - overdueRate / 100) * 25 + (1 - rejectedRate / 100) * 15 + Math.max(0, (1 - avgDays / 30)) * 20);
        }
        cells[key] = { label: `${getDisplayLabel(rowDim, row)} × ${getDisplayLabel(colDim, col)}`, total, completed, avgDays, overdueRate, rejectedRate, healthScore };
      });
    });

    return { rows, cols, cells };
  }, [items, teams, rowDim, colDim]);

  const getCellBg = (score: number, total: number): string => {
    if (total === 0) return "bg-muted/10";
    if (score >= 75) return "bg-success/50";
    if (score >= 55) return "bg-success/25";
    if (score >= 40) return "bg-warning/30";
    if (score >= 25) return "bg-warning/50";
    return "bg-destructive/40";
  };

  const getCellText = (score: number, total: number): string => {
    if (total === 0) return "text-muted-foreground/40";
    if (score >= 75) return "text-success";
    if (score >= 55) return "text-foreground";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const totalItems = items.length;
  const completedItems = items.filter(i => i.completed_at !== null).length;
  const overallHealth = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const overdueItems = items.filter(i => i.due_date && new Date(i.due_date).getTime() < Date.now() && !i.completed_at && !i.rejected).length;

  const cellEntries = Object.entries(heatmap.cells).filter(([, c]) => c.total > 0);
  const bestCell = cellEntries.length > 0 ? cellEntries.reduce((a, b) => a[1].healthScore > b[1].healthScore ? a : b) : null;
  const worstCell = cellEntries.length > 0 ? cellEntries.reduce((a, b) => a[1].healthScore < b[1].healthScore ? a : b) : null;

  const dimOptions: { key: Dimension; label: string }[] = [
    { key: "team", label: t("healthHeatmap.dimTeam") },
    { key: "category", label: t("healthHeatmap.dimCategory") },
    { key: "priority", label: t("healthHeatmap.dimPriority") },
    { key: "type", label: t("healthHeatmap.dimType") },
  ];

  if (loading) return <AnalysisPageSkeleton cards={4} sections={1} showChart />;

  if (items.length === 0) {
    const empty = (
      <>
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("healthHeatmap.label")}</p>
          <h1 className="font-display text-xl font-bold">{t("healthHeatmap.title")}</h1>
        </div>
        <EmptyAnalysisState
          icon={Heart}
          title={t("healthHeatmap.noHealthData")}
          description={t("healthHeatmap.noHealthDataDesc")}
          hint={t("healthHeatmap.noHealthDataHint")}
        />
      </>
    );
    return embedded ? empty : <AppLayout>{empty}</AppLayout>;
  }

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("healthHeatmap.label")}</p>
          <h1 className="font-display text-xl font-bold">{t("healthHeatmap.title")}</h1>
        </div>
        <PageHelpButton title={t("healthHeatmap.title")} description={t("healthHeatmap.helpDesc")} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Heart, label: t("healthHeatmap.healthIndex"), value: `${overallHealth}%`, color: overallHealth >= 60 ? "text-success" : "text-warning", hint: t("healthHeatmap.baseScoreHint", "Basis-Score — wächst mit jeder abgeschlossenen Entscheidung.") },
          { icon: CheckCircle2, label: t("healthHeatmap.completed"), value: `${completedItems}/${totalItems}`, color: "text-primary", sub: `${decisions.length} ${t("healthHeatmap.decisionsLabel")} • ${tasks.length} ${t("healthHeatmap.tasksLabel")}` },
          { icon: AlertTriangle, label: t("healthHeatmap.overdueLabel"), value: overdueItems, color: "text-destructive" },
          {
            icon: bestCell && bestCell[1].healthScore >= 60 ? TrendingUp : TrendingDown,
            label: t("healthHeatmap.strongestSegment"),
            value: bestCell ? bestCell[1].label : "—",
            color: "text-success",
            small: true,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`font-display font-bold ${(card as any).small ? "text-sm" : "text-2xl"}`}>{card.value}</p>
            {(card as any).sub && <p className="text-[10px] text-muted-foreground mt-0.5">{(card as any).sub}</p>}
            {(card as any).hint && <p className="text-[10px] text-muted-foreground mt-1">{(card as any).hint}</p>}
          </div>
        ))}
      </div>

      <CollapsibleSection
        title={t("healthHeatmap.heatmapTitle")}
        subtitle={t("healthHeatmap.heatmapSubtitle")}
        icon={<Activity className="w-4 h-4 text-primary" />}
        defaultOpen={true}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("healthHeatmap.rows")}</span>
            {dimOptions.filter(d => d.key !== colDim).map(d => (
              <button key={d.key} onClick={() => setRowDim(d.key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${rowDim === d.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("healthHeatmap.columns")}</span>
            {dimOptions.filter(d => d.key !== rowDim).map(d => (
              <button key={d.key} onClick={() => setColDim(d.key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${colDim === d.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 overflow-x-auto">
          {heatmap.rows.length > 0 && heatmap.cols.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground font-medium min-w-[120px]">
                    {dimOptions.find(d => d.key === rowDim)?.label}
                  </th>
                  {heatmap.cols.map(col => (
                    <th key={col} className="p-2 text-center text-muted-foreground font-medium min-w-[90px]">
                      {getDisplayLabel(colDim, col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map((row) => (
                  <tr key={row}>
                    <td className="p-2 font-medium text-sm">{getDisplayLabel(rowDim, row)}</td>
                    {heatmap.cols.map((col) => {
                      const key = `${row}|${col}`;
                      const cell = heatmap.cells[key];
                      if (!cell) return <td key={col} className="p-1.5"><div className="rounded-lg p-3 bg-muted/10 text-center text-muted-foreground/40">—</div></td>;
                      return (
                        <td key={col} className="p-1.5">
                          <div className={`rounded-lg p-2.5 text-center cursor-default ${getCellBg(cell.healthScore, cell.total)}`} title={`${cell.label}\nHealth: ${cell.healthScore}/100\n${cell.total} Items`}>
                            <p className={`text-lg font-bold font-display tabular-nums ${getCellText(cell.healthScore, cell.total)}`}>
                              {cell.total === 0 ? "—" : cell.healthScore}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {cell.total === 0 ? t("healthHeatmap.none") : `${cell.total} | ${cell.completed}✓`}
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t("healthHeatmap.noDataAvailable")}</p>
          )}

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground">{t("healthHeatmap.healthScoreLabel")}</span>
            {[
              { label: t("healthHeatmap.critical024"), class: "bg-destructive/40" },
              { label: t("healthHeatmap.weak2539"), class: "bg-warning/50" },
              { label: t("healthHeatmap.medium4054"), class: "bg-warning/30" },
              { label: t("healthHeatmap.good5574"), class: "bg-success/25" },
              { label: t("healthHeatmap.excellent75"), class: "bg-success/50" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${l.class}`} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Single-team hint */}
        {teams.length === 1 && rowDim === "team" && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              {t("healthHeatmap.singleTeamHint", "Die Heatmap zeigt Muster ab 2+ Teams.")}{" "}
              <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate("/teams")}>{t("healthHeatmap.addTeamsLink", "Teams unter Einstellungen → Teams hinzufügen.")}</span>
            </p>
          </div>
        )}
      </CollapsibleSection>

      {(bestCell || worstCell) && (
        <CollapsibleSection
          title={t("healthHeatmap.insightsTitle")}
          subtitle={t("healthHeatmap.insightsSubtitle")}
          icon={<TrendingUp className="w-4 h-4 text-success" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestCell && bestCell[1].total > 0 && (
              <div className="rounded-lg border border-success/20 bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-xs font-semibold text-success">{t("healthHeatmap.strength")}</span>
                </div>
                <p className="text-sm font-medium">{bestCell[1].label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("healthHeatmap.gesundheitsScore", "Gesundheits-Score")}: {bestCell[1].healthScore}/100 • {bestCell[1].completed}/{bestCell[1].total} {t("healthHeatmap.completedOf")} • Ø {bestCell[1].avgDays} {t("healthHeatmap.tage", "Tage")}
                </p>
              </div>
            )}
            {worstCell && worstCell[1].total > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-semibold text-destructive">{t("healthHeatmap.weakness")}</span>
                </div>
                <p className="text-sm font-medium">{worstCell[1].label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("healthHeatmap.gesundheitsScore", "Gesundheits-Score")}: {worstCell[1].healthScore}/100 • {worstCell[1].overdueRate}% {t("healthHeatmap.overdueRate")}
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Trend — letzte 30 Tage */}
      <CollapsibleSection
        title={t("healthHeatmap.trendTitle", "Trend — letzte 30 Tage")}
        subtitle={t("healthHeatmap.trendSubtitle", "Gesundheits-Index über Zeit")}
        icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
        defaultOpen={true}
        className="mt-8"
      >
        {(() => {
          // Build daily health data points for last 30 days
          const now = Date.now();
          const points: { date: string; score: number }[] = [];
          for (let i = 29; i >= 0; i--) {
            const dayEnd = now - i * 86400000;
            const dayItems = items.filter(it => new Date(it.created_at).getTime() <= dayEnd);
            const dayCompleted = dayItems.filter(it => it.completed_at && new Date(it.completed_at).getTime() <= dayEnd).length;
            const score = dayItems.length > 0 ? Math.round((dayCompleted / dayItems.length) * 100) : 0;
            if (dayItems.length > 0) {
              const d = new Date(dayEnd);
              points.push({ date: `${d.getDate()}.${d.getMonth() + 1}`, score });
            }
          }

          if (points.length < 7) {
            return (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-sm" style={{ color: "#94A3B8" }}>{t("healthHeatmap.trendNotEnoughData", "Mehr Daten in den nächsten Tagen verfügbar.")}</p>
              </div>
            );
          }

          return (
            <Card>
              <CardContent className="pt-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                      <RechartsTooltip formatter={(v: number) => [`${v}%`, t("healthHeatmap.gesundheitsScore", "Gesundheits-Score")]} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </CollapsibleSection>
    </Wrap>
  );
};

export default HealthHeatmap;

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Activity, Heart, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useDecisions, useTeams } from "@/hooks/useDecisions";

type Dimension = "team" | "category" | "priority";

interface HealthCell {
  label: string;
  total: number;
  implemented: number;
  avgDays: number;
  overdueRate: number;
  rejectedRate: number;
  healthScore: number;
}

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "HR",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};

const priorityLabels: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

const HealthHeatmap = () => {
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingDec || loadingTeams;
  const [rowDim, setRowDim] = useState<Dimension>("team");
  const [colDim, setColDim] = useState<Dimension>("category");

  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t.name])), [teams]);

  const getLabels = (dim: Dimension): string[] => {
    if (dim === "team") return teams.map(t => t.name);
    if (dim === "category") return Object.keys(categoryLabels);
    return Object.keys(priorityLabels);
  };

  const getDisplayLabel = (dim: Dimension, key: string): string => {
    if (dim === "category") return categoryLabels[key] || key;
    if (dim === "priority") return priorityLabels[key] || key;
    return key;
  };

  const getValue = (dec: any, dim: Dimension): string => {
    if (dim === "team") return dec.team_id ? (teamMap[dec.team_id] || "") : "";
    if (dim === "category") return dec.category;
    return dec.priority;
  };

  const heatmap = useMemo(() => {
    const rows = getLabels(rowDim);
    const cols = getLabels(colDim);
    const now = Date.now();

    const cells: Record<string, HealthCell> = {};

    rows.forEach(row => {
      cols.forEach(col => {
        const key = `${row}|${col}`;
        const matching = decisions.filter(d => {
          const rv = getValue(d, rowDim);
          const cv = getValue(d, colDim);
          return rv === row && cv === col;
        });

        const total = matching.length;
        const implemented = matching.filter(d => d.status === "implemented").length;
        const rejected = matching.filter(d => d.status === "rejected").length;
        const overdue = matching.filter(d =>
          d.due_date && new Date(d.due_date).getTime() < now &&
          d.status !== "implemented" && d.status !== "rejected"
        ).length;

        const durations = matching
          .filter(d => d.status === "implemented" && d.implemented_at)
          .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
        const avgDays = durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 10) / 10
          : 0;

        const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
        const rejectedRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
        const implementRate = total > 0 ? (implemented / total) : 0;

        let healthScore = 0;
        if (total > 0) {
          healthScore = Math.round(
            implementRate * 40 +
            (1 - overdueRate / 100) * 25 +
            (1 - rejectedRate / 100) * 15 +
            Math.max(0, (1 - avgDays / 30)) * 20
          );
        }

        cells[key] = {
          label: `${getDisplayLabel(rowDim, row)} × ${getDisplayLabel(colDim, col)}`,
          total, implemented, avgDays, overdueRate, rejectedRate, healthScore,
        };
      });
    });

    return { rows, cols, cells };
  }, [decisions, teams, rowDim, colDim]);

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

  const totalDec = decisions.length;
  const implementedDec = decisions.filter(d => d.status === "implemented").length;
  const overallHealth = totalDec > 0 ? Math.round((implementedDec / totalDec) * 100) : 0;
  const overdueDec = decisions.filter(d =>
    d.due_date && new Date(d.due_date).getTime() < Date.now() &&
    d.status !== "implemented" && d.status !== "rejected"
  ).length;

  const cellEntries = Object.entries(heatmap.cells).filter(([, c]) => c.total > 0);
  const bestCell = cellEntries.length > 0 ? cellEntries.reduce((a, b) => a[1].healthScore > b[1].healthScore ? a : b) : null;
  const worstCell = cellEntries.length > 0 ? cellEntries.reduce((a, b) => a[1].healthScore < b[1].healthScore ? a : b) : null;

  const dimOptions: { key: Dimension; label: string }[] = [
    { key: "team", label: "Team" },
    { key: "category", label: "Kategorie" },
    { key: "priority", label: "Priorität" },
  ];

  if (loading) return <AnalysisPageSkeleton cards={4} sections={1} showChart />;

  if (decisions.length === 0) {
    return (
      <AppLayout>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Decision Health Heatmap™</h1>
          <p className="text-muted-foreground">Wo ist das Unternehmen stark – und wo schwach?</p>
        </div>
        <EmptyAnalysisState
          icon={Heart}
          title="Keine Health-Daten"
          description="Erstelle Entscheidungen und Teams, um die Gesundheits-Heatmap zu generieren."
          hint="Die Heatmap zeigt Health Scores pro Team und Kategorie"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Decision Health Heatmap™</h1>
        <p className="text-muted-foreground">Wo ist das Unternehmen stark – und wo schwach?</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Heart, label: "Gesundheits-Index", value: `${overallHealth}%`, color: overallHealth >= 60 ? "text-success" : "text-warning" },
          { icon: CheckCircle2, label: "Umgesetzt", value: `${implementedDec}/${totalDec}`, color: "text-primary" },
          { icon: AlertTriangle, label: "Überfällig", value: overdueDec, color: "text-destructive" },
          {
            icon: bestCell && bestCell[1].healthScore >= 60 ? TrendingUp : TrendingDown,
            label: "Stärkstes Segment",
            value: bestCell ? bestCell[1].label : "—",
            color: "text-success",
            small: true,
          },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`font-display font-bold ${card.small ? "text-sm" : "text-2xl"}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Dimension selectors */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Zeilen:</span>
          {dimOptions.filter(d => d.key !== colDim).map(d => (
            <button key={d.key} onClick={() => setRowDim(d.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${rowDim === d.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Spalten:</span>
          {dimOptions.filter(d => d.key !== rowDim).map(d => (
            <button key={d.key} onClick={() => setColDim(d.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${colDim === d.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card p-5 overflow-x-auto">
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
              {heatmap.rows.map((row, ri) => (
                <motion.tr key={row} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.04 }}>
                  <td className="p-2 font-medium text-sm">{getDisplayLabel(rowDim, row)}</td>
                  {heatmap.cols.map((col, ci) => {
                    const key = `${row}|${col}`;
                    const cell = heatmap.cells[key];
                    if (!cell) return <td key={col} className="p-1.5"><div className="rounded-lg p-3 bg-muted/10 text-center text-muted-foreground/40">—</div></td>;

                    return (
                      <td key={col} className="p-1.5">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: ri * 0.04 + ci * 0.02 }}
                          className={`rounded-lg p-2.5 text-center cursor-default group relative ${getCellBg(cell.healthScore, cell.total)}`}
                          title={`${cell.label}\nHealth: ${cell.healthScore}/100\n${cell.total} Entscheidungen\n${cell.implemented} umgesetzt\nØ ${cell.avgDays}d\n${cell.overdueRate}% überfällig`}
                        >
                          <p className={`text-lg font-bold font-display ${getCellText(cell.healthScore, cell.total)}`}>
                            {cell.total === 0 ? "—" : cell.healthScore}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {cell.total === 0 ? "keine" : `${cell.total} | ${cell.implemented}✓`}
                          </p>

                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                            <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-left min-w-[180px]">
                              <p className="font-semibold text-xs mb-1.5">{cell.label}</p>
                              <div className="space-y-1 text-[10px] text-muted-foreground">
                                <p>Entscheidungen: <span className="text-foreground font-medium">{cell.total}</span></p>
                                <p>Umgesetzt: <span className="text-success font-medium">{cell.implemented}</span></p>
                                <p>Ø Dauer: <span className="text-foreground font-medium">{cell.avgDays}d</span></p>
                                <p>Überfällig: <span className={`font-medium ${cell.overdueRate > 30 ? "text-destructive" : "text-foreground"}`}>{cell.overdueRate}%</span></p>
                                <p>Abgelehnt: <span className="text-foreground font-medium">{cell.rejectedRate}%</span></p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted-foreground py-8">Keine Daten verfügbar. Erstelle Teams und Entscheidungen.</p>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Health Score:</span>
          {[
            { label: "Kritisch (0-24)", class: "bg-destructive/40" },
            { label: "Schwach (25-39)", class: "bg-warning/50" },
            { label: "Mittel (40-54)", class: "bg-warning/30" },
            { label: "Gut (55-74)", class: "bg-success/25" },
            { label: "Exzellent (75+)", class: "bg-success/50" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${l.class}`} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {(bestCell || worstCell) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {bestCell && bestCell[1].total > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs font-semibold text-success">Stärke</span>
              </div>
              <p className="text-sm font-medium">{bestCell[1].label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Health Score: {bestCell[1].healthScore}/100 • {bestCell[1].implemented}/{bestCell[1].total} umgesetzt • Ø {bestCell[1].avgDays}d
              </p>
            </motion.div>
          )}
          {worstCell && worstCell[1].total > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-xs font-semibold text-destructive">Schwachstelle</span>
              </div>
              <p className="text-sm font-medium">{worstCell[1].label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Health Score: {worstCell[1].healthScore}/100 • {worstCell[1].overdueRate}% überfällig • {worstCell[1].rejectedRate}% abgelehnt
              </p>
            </motion.div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default HealthHeatmap;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Clock, AlertTriangle, TrendingUp, ArrowUpRight, Flame, Timer } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

interface CostEntry {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  daysOpen: number;
  dailyCost: number;
  totalCost: number;
  dueDate: string | null;
  isOverdue: boolean;
  urgencyScore: number;
  teamName: string | null;
}

const priorityMultiplier: Record<string, number> = {
  critical: 4,
  high: 2.5,
  medium: 1.5,
  low: 1,
};

const categoryMultiplier: Record<string, number> = {
  strategic: 3,
  budget: 2.5,
  hr: 1.8,
  technical: 1.5,
  marketing: 1.3,
  operational: 1,
};

const OpportunityCostRadar = () => {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [totalDailyCost, setTotalDailyCost] = useState(0);
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"urgency" | "daily" | "total">("urgency");

  useEffect(() => {
    const calculate = async () => {
      const [decRes, teamRes] = await Promise.all([
        supabase.from("decisions").select("id, title, status, priority, category, created_at, due_date, team_id")
          .in("status", ["draft", "review", "approved"]),
        supabase.from("teams").select("id, name, hourly_rate"),
      ]);

      const decisions = decRes.data || [];
      const teams = teamRes.data || [];
      const teamMap = Object.fromEntries(teams.map(t => [t.id, { name: t.name, rate: t.hourly_rate || 75 }]));
      const now = Date.now();

      const results: CostEntry[] = decisions.map(d => {
        const daysOpen = Math.max(1, Math.floor((now - new Date(d.created_at).getTime()) / 86400000));
        const team = d.team_id ? teamMap[d.team_id] : null;
        const baseRate = team?.rate || 75;
        const pMult = priorityMultiplier[d.priority] || 1;
        const cMult = categoryMultiplier[d.category] || 1;

        // Daily cost = base_rate * 2 people * 2h/day * priority_mult * category_mult
        const dailyCost = Math.round(baseRate * 2 * 2 * pMult * cMult);
        const totalCost = dailyCost * daysOpen;

        const isOverdue = d.due_date ? new Date(d.due_date).getTime() < now : false;
        const overdueDays = isOverdue && d.due_date
          ? Math.floor((now - new Date(d.due_date).getTime()) / 86400000)
          : 0;

        // Urgency score: combines cost, overdue, and priority
        const urgencyScore = Math.round(
          (dailyCost / 100) * pMult + (isOverdue ? overdueDays * 10 : 0) + (daysOpen > 14 ? daysOpen * 2 : 0)
        );

        return {
          id: d.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          category: d.category,
          daysOpen,
          dailyCost,
          totalCost,
          dueDate: d.due_date,
          isOverdue,
          urgencyScore,
          teamName: team?.name || null,
        };
      });

      results.sort((a, b) => b.urgencyScore - a.urgencyScore);
      setEntries(results);
      setTotalDailyCost(results.reduce((s, e) => s + e.dailyCost, 0));
      setTotalAccumulated(results.reduce((s, e) => s + e.totalCost, 0));
      setLoading(false);
    };

    calculate();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "daily") return b.dailyCost - a.dailyCost;
    if (sortBy === "total") return b.totalCost - a.totalCost;
    return b.urgencyScore - a.urgencyScore;
  });

  const priorityColor: Record<string, string> = {
    critical: "text-destructive",
    high: "text-warning",
    medium: "text-primary",
    low: "text-muted-foreground",
  };

  const maxDailyCost = Math.max(...entries.map(e => e.dailyCost), 1);

  if (loading) return <AnalysisPageSkeleton cards={3} sections={2} />;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Opportunity Cost Radar™</h1>
        <p className="text-muted-foreground">Live-Ranking nach wirtschaftlicher Dringlichkeit</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Tägliche Verluste</span>
          </div>
          <p className="font-display text-3xl font-bold text-destructive">
            {totalDailyCost.toLocaleString("de-DE")} €
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">pro Tag durch offene Entscheidungen</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Kumulierte Kosten</span>
          </div>
          <p className="font-display text-3xl font-bold text-warning">
            {totalAccumulated.toLocaleString("de-DE")} €
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">bisher aufgelaufen</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Offene Entscheidungen</span>
          </div>
          <p className="font-display text-3xl font-bold">
            {entries.length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            davon {entries.filter(e => e.isOverdue).length} überfällig
          </p>
        </motion.div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Sortieren:</span>
        {([
          { key: "urgency", label: "Dringlichkeit" },
          { key: "daily", label: "€/Tag" },
          { key: "total", label: "Kumuliert" },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              sortBy === s.key ? "bg-primary/20 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Cost ranking list */}
      <div className="space-y-2">
        {sorted.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                i < 3 ? "bg-destructive/20 text-destructive" : "bg-muted/30 text-muted-foreground"
              }`}>
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{entry.title}</p>
                  {entry.isOverdue && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium shrink-0">
                      ÜBERFÄLLIG
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className={`capitalize font-medium ${priorityColor[entry.priority]}`}>● {entry.priority}</span>
                  <span className="capitalize">{entry.category}</span>
                  {entry.teamName && <span>{entry.teamName}</span>}
                  <span><Clock className="w-3 h-3 inline mr-0.5" />{entry.daysOpen}d offen</span>
                </div>
              </div>

              {/* Cost bar */}
              <div className="w-32 shrink-0 hidden md:block">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${entry.dailyCost / maxDailyCost > 0.7 ? "bg-destructive" : entry.dailyCost / maxDailyCost > 0.4 ? "bg-warning" : "bg-primary"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.dailyCost / maxDailyCost) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.03 }}
                  />
                </div>
              </div>

              {/* Daily cost */}
              <div className="text-right shrink-0 w-24">
                <p className={`text-sm font-bold ${entry.dailyCost > 1000 ? "text-destructive" : entry.dailyCost > 500 ? "text-warning" : "text-muted-foreground"}`}>
                  {entry.dailyCost.toLocaleString("de-DE")} €
                </p>
                <p className="text-[10px] text-muted-foreground">pro Tag</p>
              </div>

              {/* Total cost */}
              <div className="text-right shrink-0 w-28 hidden lg:block">
                <p className="text-sm font-medium">
                  {entry.totalCost.toLocaleString("de-DE")} €
                </p>
                <p className="text-[10px] text-muted-foreground">kumuliert</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {entries.length === 0 && (
        <EmptyAnalysisState
          icon={DollarSign}
          title="Keine offenen Kosten"
          description="Alle Entscheidungen sind abgeschlossen oder es gibt noch keine offenen Entscheidungen."
          hint="Offene Entscheidungen generieren automatisch Opportunity-Costs"
        />
      )}
    </AppLayout>
  );
};

export default OpportunityCostRadar;

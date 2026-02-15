import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHint from "@/components/shared/PageHint";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useDecisions } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import {
  Target, Plus, TrendingUp, DollarSign, BarChart3, Trash2, Loader2,
  ChevronRight, Link2, CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  quarter: string | null;
  year: number | null;
  status: string;
  due_date: string | null;
  team_id: string | null;
  created_by: string;
  linked_decisions: { id: string; title: string; status: string; impact_weight: number }[];
}

const goalTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  okr: { icon: Target, label: "OKR", color: "text-primary" },
  revenue: { icon: DollarSign, label: "Revenue", color: "text-success" },
  kpi: { icon: BarChart3, label: "KPI", color: "text-warning" },
  quarterly: { icon: Clock, label: "Quartalsziel", color: "text-accent-foreground" },
};

const statusBadge: Record<string, { label: string; class: string }> = {
  active: { label: "Aktiv", class: "bg-primary/20 text-primary" },
  achieved: { label: "Erreicht", class: "bg-success/20 text-success" },
  at_risk: { label: "Gefährdet", class: "bg-warning/20 text-warning" },
  missed: { label: "Verfehlt", class: "bg-destructive/20 text-destructive" },
};

const Strategy = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const { selectedTeamId } = useTeamContext();
  const { data: teamDecisions = [] } = useDecisions();

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", goal_type: "okr",
    target_value: 100, unit: "%", quarter: "Q1", year: new Date().getFullYear(),
    status: "active",
  });

  const fetchGoals = async () => {
    let goalsQuery = supabase.from("strategic_goals").select("*").order("created_at", { ascending: false });
    if (selectedTeamId) {
      goalsQuery = goalsQuery.eq("team_id", selectedTeamId);
    } else {
      goalsQuery = goalsQuery.is("team_id", null);
    }

    const [goalsRes, linksRes] = await Promise.all([
      goalsQuery,
      supabase.from("decision_goal_links").select("*"),
    ]);

    const goalsData = goalsRes.data || [];
    const links = linksRes.data || [];
    const decMap = Object.fromEntries(teamDecisions.map(d => [d.id, d]));

    const enriched: Goal[] = goalsData.map(g => ({
      ...g,
      linked_decisions: links
        .filter(l => l.goal_id === g.id && decMap[l.decision_id])
        .map(l => ({
          id: l.decision_id,
          title: decMap[l.decision_id]?.title || "Unbekannt",
          status: decMap[l.decision_id]?.status || "draft",
          impact_weight: l.impact_weight || 50,
        })),
    }));

    setGoals(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [selectedTeamId, teamDecisions]);

  const createGoal = async () => {
    if (!form.title.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("strategic_goals").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      goal_type: form.goal_type,
      target_value: form.target_value,
      unit: form.unit,
      quarter: form.quarter,
      year: form.year,
      status: form.status,
      created_by: user.id,
      team_id: selectedTeamId || null,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Strategisches Ziel erstellt" });
      setForm({ title: "", description: "", goal_type: "okr", target_value: 100, unit: "%", quarter: "Q1", year: new Date().getFullYear(), status: "active" });
      setShowCreate(false);
      fetchGoals();
    }
    setCreating(false);
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("strategic_goals").delete().eq("id", id);
    fetchGoals();
    toast({ title: "Ziel gelöscht" });
  };

  const getProgress = (g: Goal) => {
    if (!g.target_value || g.target_value === 0) return 0;
    return Math.min(100, Math.round(((g.current_value || 0) / g.target_value) * 100));
  };

  // Aggregate stats
  const totalGoals = goals.length;
  const linkedDecisionCount = goals.reduce((s, g) => s + g.linked_decisions.length, 0);
  const atRiskCount = goals.filter(g => g.status === "at_risk").length;
  const avgProgress = totalGoals > 0 ? Math.round(goals.reduce((s, g) => s + getProgress(g), 0) / totalGoals) : 0;

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground text-sm">Lade strategische Ziele...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Strategie</p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Strategie-Verknüpfung</h1>
            <PageHint>
              Verknüpfe Entscheidungen mit strategischen Zielen (OKRs, KPIs, Revenue). Verfolge den Fortschritt und sieh, welche Entscheidungen den größten Impact haben.
            </PageHint>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="w-4 h-4" /> Neues Ziel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Target, label: "Strategische Ziele", value: totalGoals, color: "text-primary" },
          { icon: Link2, label: "Verknüpfte Entscheidungen", value: linkedDecisionCount, color: "text-success" },
          { icon: TrendingUp, label: "Ø Fortschritt", value: `${avgProgress}%`, color: "text-warning" },
          { icon: AlertTriangle, label: "Gefährdet", value: atRiskCount, color: "text-destructive" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-display text-2xl font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-lg border border-border bg-card p-5 mb-6 space-y-4">
          <h3 className="font-display font-semibold text-sm">Neues strategisches Ziel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Titel *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Q2 Revenue auf 5M€ steigern" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Typ</label>
              <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))} className={inputClass}>
                <option value="okr">OKR</option>
                <option value="revenue">Revenue-Ziel</option>
                <option value="kpi">KPI</option>
                <option value="quarterly">Quartalsziel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zielwert</label>
              <div className="flex gap-2">
                <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))} className={`${inputClass} flex-1`} />
                <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={`${inputClass} w-20`} placeholder="%" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Quartal / Jahr</label>
              <div className="flex gap-2">
                <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} className={`${inputClass} flex-1`}>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
                <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className={`${inputClass} w-24`} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Beschreibung</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Was genau soll erreicht werden?" className={`${inputClass} h-20 resize-none`} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button size="sm" onClick={createGoal} disabled={creating || !form.title.trim()} className="gap-1">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Erstellen
            </Button>
          </div>
        </motion.div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const config = goalTypeConfig[goal.goal_type] || goalTypeConfig.okr;
          const badge = statusBadge[goal.status] || statusBadge.active;
          const progress = getProgress(goal);
          const isExpanded = expandedGoal === goal.id;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted/30 ${config.color}`}>
                    <config.icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{goal.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className={`font-medium ${config.color}`}>{config.label}</span>
                      {goal.quarter && <span>{goal.quarter} {goal.year}</span>}
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {goal.linked_decisions.length} Entscheidungen
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-32 shrink-0 hidden md:block">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{goal.current_value ?? 0} / {goal.target_value ?? 0} {goal.unit}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${progress >= 80 ? "bg-success" : progress >= 50 ? "bg-warning" : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* Expanded: linked decisions */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-border px-4 pb-4"
                >
                  {goal.description && (
                    <p className="text-xs text-muted-foreground py-3">{goal.description}</p>
                  )}

                  <div className="flex items-center justify-between mb-2 pt-2">
                    <p className="text-xs font-semibold">Verknüpfte Entscheidungen</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-6 text-[10px]"
                      onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Löschen
                    </Button>
                  </div>

                  {goal.linked_decisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      Noch keine Entscheidungen verknüpft. Öffne eine Entscheidung und nutze den „Strategie"-Tab.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {goal.linked_decisions.map(dec => (
                        <div key={dec.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            dec.status === "implemented" ? "bg-primary" :
                            dec.status === "approved" ? "bg-success" :
                            dec.status === "review" ? "bg-warning" : "bg-muted-foreground"
                          }`} />
                          <span className="flex-1 truncate">{dec.title}</span>
                          <span className="text-muted-foreground capitalize">{dec.status}</span>
                          <span className="text-muted-foreground">Impact: {dec.impact_weight}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && !showCreate && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-4 opacity-40" />
          <h3 className="font-display text-xl font-semibold mb-2">Keine strategischen Ziele</h3>
          <p className="text-muted-foreground mb-4">Erstelle OKRs, Revenue-Ziele oder KPIs und verknüpfe sie mit Entscheidungen.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Erstes Ziel erstellen
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default Strategy;

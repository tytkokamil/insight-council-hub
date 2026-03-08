import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/shared/PageHeader";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useDecisions } from "@/hooks/useDecisions";
import { useTeamContext } from "@/hooks/useTeamContext";
import { cn } from "@/lib/utils";
import {
  Target, Plus, TrendingUp, DollarSign, BarChart3, Trash2, Loader2,
  ChevronRight, Link2, CheckCircle2, AlertTriangle, Clock, Check,
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
  quarterly: { icon: Clock, label: "quarterlyGoal", color: "text-accent-foreground" },
};

const statusBadgeKeys: Record<string, { labelKey: string; class: string }> = {
  active: { labelKey: "strategy.statusActive", class: "bg-primary/20 text-primary" },
  achieved: { labelKey: "strategy.statusAchieved", class: "bg-success/20 text-success" },
  at_risk: { labelKey: "strategy.statusAtRisk", class: "bg-warning/20 text-warning" },
  missed: { labelKey: "strategy.statusMissed", class: "bg-destructive/20 text-destructive" },
};

/** Predefined goal suggestions shown before user creates any */
interface GoalSuggestion {
  key: string;
  icon: any;
  goal_type: string;
  titleKey: string;
  descKey: string;
  defaultTarget: number;
  defaultUnit: string;
}

const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  { key: "okr", icon: Target, goal_type: "okr", titleKey: "strategy.sugOkrTitle", descKey: "strategy.sugOkrDesc", defaultTarget: 100, defaultUnit: "%" },
  { key: "revenue", icon: DollarSign, goal_type: "revenue", titleKey: "strategy.sugRevenueTitle", descKey: "strategy.sugRevenueDesc", defaultTarget: 1000000, defaultUnit: "€" },
  { key: "kpi", icon: BarChart3, goal_type: "kpi", titleKey: "strategy.sugKpiTitle", descKey: "strategy.sugKpiDesc", defaultTarget: 90, defaultUnit: "%" },
  { key: "quarterly", icon: Clock, goal_type: "quarterly", titleKey: "strategy.sugQuarterlyTitle", descKey: "strategy.sugQuarterlyDesc", defaultTarget: 100, defaultUnit: "%" },
];

const Strategy = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [adoptedSuggestions, setAdoptedSuggestions] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("adopted-goal-suggestions");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [adoptingKey, setAdoptingKey] = useState<string | null>(null);

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
          title: decMap[l.decision_id]?.title || t("strategy.unknown"),
          status: decMap[l.decision_id]?.status || "draft",
          impact_weight: l.impact_weight || 50,
        })),
    }));

    setGoals(enriched);
    setLoading(false);

    // Sync adoptedSuggestions with actual DB goals
    const goalTitles = new Set(goalsData.map(g => g.title));
    const validAdopted = new Set<string>();
    for (const sug of GOAL_SUGGESTIONS) {
      const sugTitle = t(sug.titleKey);
      if (goalTitles.has(sugTitle)) {
        validAdopted.add(sug.key);
      }
    }
    setAdoptedSuggestions(validAdopted);
    localStorage.setItem("adopted-goal-suggestions", JSON.stringify([...validAdopted]));
  };

  useEffect(() => { fetchGoals(); }, [selectedTeamId, teamDecisions]);

  /** Adopt a suggestion → create the goal in DB */
  const adoptSuggestion = async (sug: GoalSuggestion) => {
    if (!user) return;
    setAdoptingKey(sug.key);
    const { error } = await supabase.from("strategic_goals").insert({
      title: t(sug.titleKey),
      description: t(sug.descKey),
      goal_type: sug.goal_type,
      target_value: sug.defaultTarget,
      unit: sug.defaultUnit,
      quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      year: new Date().getFullYear(),
      status: "active",
      created_by: user.id,
      team_id: selectedTeamId || null,
    });
    if (error) {
      toast({ title: t("strategy.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      const next = new Set(adoptedSuggestions);
      next.add(sug.key);
      setAdoptedSuggestions(next);
      localStorage.setItem("adopted-goal-suggestions", JSON.stringify([...next]));
      toast({ title: t("strategy.goalAdopted") });
      fetchGoals();
    }
    setAdoptingKey(null);
  };

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
      toast({ title: t("strategy.errorTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("strategy.goalCreated") });
      setForm({ title: "", description: "", goal_type: "okr", target_value: 100, unit: "%", quarter: "Q1", year: new Date().getFullYear(), status: "active" });
      setShowCreate(false);
      fetchGoals();
    }
    setCreating(false);
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("strategic_goals").delete().eq("id", id);
    fetchGoals();
    toast({ title: t("strategy.goalDeleted") });
  };

  const isInverseGoal = (g: Goal) => {
    // Goals where lower is better (e.g. incidents, errors)
    const lowerIsBetterKeywords = ["incident", "error", "bug", "risk", "zero", "minimize", "reduce", "weniger"];
    const titleLower = g.title.toLowerCase();
    return lowerIsBetterKeywords.some(kw => titleLower.includes(kw));
  };

  const getProgress = (g: Goal) => {
    if (!g.target_value && g.target_value !== 0) return 0;
    if (isInverseGoal(g)) {
      // For inverse goals: 100% when current <= target
      if (g.target_value === 0) return (g.current_value || 0) <= 0 ? 100 : 0;
      return Math.min(100, Math.round(Math.max(0, (1 - ((g.current_value || 0) - g.target_value) / g.target_value)) * 100));
    }
    if (g.target_value === 0) return 0;
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
          <div className="text-muted-foreground text-sm">{t("strategy.loading")}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={t("strategy.title")}
        subtitle={t("strategy.label")}
        role="system"
        help={{ title: t("strategy.title"), description: t("strategy.help") }}
        primaryAction={
          <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> {t("strategy.newGoal")}
          </Button>
        }
      />

      {/* ═══ GOAL SUGGESTIONS – conditional ═══ */}
      {!showCreate && goals.filter(g => g.status === "active").length < 3 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-1">{t("strategy.sugSectionTitle")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("strategy.sugSectionDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_SUGGESTIONS.map((sug, i) => {
              const isAdopted = adoptedSuggestions.has(sug.key);
              const isAdopting = adoptingKey === sug.key;
              return (
                <motion.div
                  key={sug.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "rounded-xl border-2 p-5 transition-all",
                    isAdopted
                      ? "border-success/40 bg-success/[0.05]"
                      : "border-dashed border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isAdopted ? "bg-success/15" : "bg-muted/40"
                    )}>
                      <sug.icon className={cn("w-5 h-5", isAdopted ? "text-success" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{t(sug.titleKey)}</p>
                        {isAdopted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-success/20 text-success flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            {t("strategy.statusActive")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t(sug.descKey)}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {!isAdopted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-7"
                            disabled={isAdopting}
                            onClick={() => adoptSuggestion(sug)}
                          >
                            {isAdopting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            {t("strategy.adopt")}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-success font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t("strategy.adopted")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed suggestion link when 3+ active goals */}
      {!showCreate && goals.filter(g => g.status === "active").length >= 3 && (
        <div className="mb-8">
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs hover:underline transition-colors text-muted-foreground"
          >
            ＋ Weiteres Ziel-Template übernehmen
          </button>
        </div>
      )}

      {/* Summary Cards – only when goals exist */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: t("strategy.strategicGoals"), value: totalGoals, color: "text-primary" },
            { icon: Link2, label: t("strategy.linkedDecisions"), value: linkedDecisionCount, color: linkedDecisionCount === 0 ? "text-destructive" : "text-success" },
            { icon: TrendingUp, label: t("strategy.avgProgress"), value: `${avgProgress}%`, color: "text-warning", tooltip: t("strategy.avgProgressTooltip") },
            { icon: AlertTriangle, label: t("strategy.atRisk"), value: atRiskCount, color: "text-destructive" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border border-border bg-card p-4 min-h-[90px] flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
                {card.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground/50 cursor-help text-[10px]">ⓘ</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{card.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="font-display text-2xl font-bold tabular-nums">{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-lg border border-border bg-card p-5 mb-6 space-y-4">
          <h3 className="font-display font-semibold text-sm">{t("strategy.newGoalTitle")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("strategy.titleLabel")}</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("strategy.titlePlaceholder")} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("strategy.typeLabel")}</label>
              <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))} className={inputClass}>
                <option value="okr">OKR</option>
                <option value="revenue">{t("strategy.revenueGoal")}</option>
                <option value="kpi">KPI</option>
                <option value="quarterly">{t("strategy.quarterlyGoal")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("strategy.targetValue")}</label>
              <div className="flex gap-2">
                <input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: Number(e.target.value) }))} className={`${inputClass} flex-1`} />
                <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={`${inputClass} w-20`} placeholder="%" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("strategy.quarterYear")}</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">{t("strategy.descriptionLabel")}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("strategy.descriptionPlaceholder")} className={`${inputClass} h-20 resize-none`} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>{t("strategy.cancel")}</Button>
            <Button size="sm" onClick={createGoal} disabled={creating || !form.title.trim()} className="gap-1">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {t("strategy.create")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Goals List */}
      <div className="space-y-3">
        {goals.map((goal, i) => {
          const config = goalTypeConfig[goal.goal_type] || goalTypeConfig.okr;
          const badge = statusBadgeKeys[goal.status] || statusBadgeKeys.active;
          const progress = getProgress(goal);
          const isExpanded = expandedGoal === goal.id;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "rounded-lg border overflow-hidden",
                goal.status === "active" ? "border-success/30 bg-success/[0.02]" : "border-border bg-card"
              )}
            >
              <div
                className="p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    goal.status === "active" ? "bg-success/15" : "bg-muted/30"
                  )}>
                    <config.icon className={cn("w-5 h-5", goal.status === "active" ? "text-success" : config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{goal.title}</p>
                      {goal.status === "active" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.class}`}>
                        {t(badge.labelKey)}
                      </span>
                    </div>
                    {isInverseGoal(goal) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Ziel: minimieren</span>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className={`font-medium ${config.color}`}>{config.label === "quarterlyGoal" ? t("strategy.quarterlyGoal") : config.label}</span>
                      {goal.quarter && <span>{goal.quarter} {goal.year}</span>}
                      <span className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        {goal.linked_decisions.length} {t("strategy.decisions")}
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
                    <p className="text-xs font-semibold">{t("strategy.linkedDecisionsLabel")}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-6 text-[10px]"
                      onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> {t("strategy.delete")}
                    </Button>
                  </div>

                  {goal.linked_decisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                      {t("strategy.noLinkedDecisions")}
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
                          <span className="text-muted-foreground">{t("strategy.impactLabel", { pct: dec.impact_weight })}</span>
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

      {/* Goal list footer */}
      {!loading && goals.length > 0 && (
        <div className="mt-4">
          <div className="border-t border-border/40" />
          <p className="text-center text-muted-foreground mt-3" style={{ fontSize: "11px" }}>
            {goals.length <= 5
              ? `${goals.length} von ${goals.length} Zielen angezeigt`
              : <button onClick={() => {}} className="hover:underline text-primary">Alle {goals.length} Ziele anzeigen →</button>
            }
          </p>
        </div>
      )}
    </AppLayout>
  );
};

export default Strategy;

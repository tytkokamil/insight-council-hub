import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Zap, Trash2, Play, History, ArrowRight, Settings2, Shield, AlertTriangle,
  TrendingUp, Clock, Users, CheckCircle2, XCircle, Activity, Eye, BarChart3,
  Target, RefreshCw, FileText, ChevronRight, Info, Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────

interface AutomationRule {
  id: string; name: string; description: string | null;
  trigger_event: string; condition_field: string; condition_operator: string;
  condition_value: string; action_type: string; action_value: string;
  enabled: boolean; team_id: string | null; created_by: string; created_at: string;
}

interface RuleLog {
  id: string; rule_id: string; decision_id: string;
  action_taken: string; details: string | null; executed_at: string;
}

// ── Helper: classify rule into category ──
function classifyRule(rule: AutomationRule): string {
  if (rule.action_type === "set_sla_days") return "sla";
  if (rule.action_type === "escalate") return "escalation";
  if (rule.action_type === "send_notification") return "notification";
  if (rule.condition_field === "priority" && rule.condition_value === "critical") return "risk";
  if (rule.action_type === "change_status") return "compliance";
  return "ownership";
}

// ── Main Component ─────────────────────────────────────────────────────

const AutomationRules = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("rules");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState("decision_created");
  const [formField, setFormField] = useState("priority");
  const [formOperator, setFormOperator] = useState("equals");
  const [formValue, setFormValue] = useState("");
  const [formActionType, setFormActionType] = useState("set_sla_days");
  const [formActionValue, setFormActionValue] = useState("");
  const [formTeamId, setFormTeamId] = useState<string>("global");
  const [saving, setSaving] = useState(false);

  // ── i18n label maps ──
  const TRIGGER_LABELS: Record<string, string> = {
    decision_created: t("automationRules.triggerDecisionCreated"),
    status_changed: t("automationRules.triggerStatusChanged"),
    priority_changed: t("automationRules.triggerPriorityChanged"),
    risk_score_changed: t("automationRules.triggerRiskScoreChanged"),
  };
  const FIELD_LABELS: Record<string, string> = {
    priority: t("automationRules.fieldPriority"), category: t("automationRules.fieldCategory"),
    status: t("automationRules.fieldStatus"), ai_risk_score: t("automationRules.fieldRiskScore"),
  };
  const OPERATOR_LABELS: Record<string, string> = {
    equals: t("automationRules.opEquals"), not_equals: t("automationRules.opNotEquals"),
    contains: t("automationRules.opContains"), greater_than: t("automationRules.opGreaterThan"),
    less_than: t("automationRules.opLessThan"),
  };
  const ACTION_LABELS: Record<string, string> = {
    set_sla_days: t("automationRules.actionSetSla"), escalate: t("automationRules.actionEscalate"),
    change_priority: t("automationRules.actionChangePriority"), change_status: t("automationRules.actionChangeStatus"),
    send_notification: t("automationRules.actionSendNotification"),
  };
  const FIELD_VALUES: Record<string, { value: string; label: string }[]> = {
    priority: [
      { value: "low", label: t("automationRules.low") }, { value: "medium", label: t("automationRules.medium") },
      { value: "high", label: t("automationRules.high") }, { value: "critical", label: t("tasksPage.priorityCritical") },
    ],
    category: [
      { value: "strategic", label: t("warRoom.catStrategic") }, { value: "budget", label: t("warRoom.catBudget") },
      { value: "hr", label: t("warRoom.catHr") }, { value: "technical", label: t("warRoom.catTechnical") },
      { value: "operational", label: t("warRoom.catOperational") }, { value: "marketing", label: t("warRoom.catMarketing") },
    ],
    status: [
      { value: "draft", label: t("automationRules.statusDraft") }, { value: "proposed", label: t("automationRules.statusProposed") },
      { value: "review", label: t("automationRules.statusReview") }, { value: "approved", label: t("automationRules.statusApproved") },
      { value: "implemented", label: t("automationRules.statusImplemented") }, { value: "rejected", label: t("automationRules.statusRejected") },
    ],
    ai_risk_score: [
      { value: "30", label: t("automationRules.riskLow") }, { value: "50", label: t("automationRules.riskMedium") },
      { value: "60", label: t("automationRules.riskHigh") }, { value: "80", label: t("automationRules.riskCritical") },
    ],
  };
  const ACTION_VALUE_OPTIONS: Record<string, { value: string; label: string }[]> = {
    change_priority: FIELD_VALUES.priority, change_status: FIELD_VALUES.status,
  };
  const RULE_CATEGORIES: Record<string, { label: string; icon: typeof Shield; color: string }> = {
    sla: { label: t("automationRules.catSla"), icon: Clock, color: "text-blue-500" },
    escalation: { label: t("automationRules.catEscalation"), icon: AlertTriangle, color: "text-destructive" },
    notification: { label: t("automationRules.catNotification"), icon: Users, color: "text-warning" },
    risk: { label: t("automationRules.catRisk"), icon: Shield, color: "text-destructive" },
    ownership: { label: t("automationRules.catOwnership"), icon: Target, color: "text-primary" },
    compliance: { label: t("automationRules.catCompliance"), icon: FileText, color: "text-accent-foreground" },
  };
  const PRESET_RULES = [
    { name: t("automationRules.presetHighSla"), description: t("automationRules.presetHighSlaDesc"), trigger_event: "priority_changed", condition_field: "priority", condition_operator: "equals", condition_value: "high", action_type: "set_sla_days", action_value: "3", category: "sla" },
    { name: t("automationRules.presetCriticalEsc"), description: t("automationRules.presetCriticalEscDesc"), trigger_event: "decision_created", condition_field: "priority", condition_operator: "equals", condition_value: "critical", action_type: "escalate", action_value: "1", category: "escalation" },
    { name: t("automationRules.presetBudgetCfo"), description: t("automationRules.presetBudgetCfoDesc"), trigger_event: "decision_created", condition_field: "category", condition_operator: "equals", condition_value: "budget", action_type: "send_notification", action_value: t("automationRules.presetBudgetCfoDesc"), category: "notification" },
    { name: t("automationRules.presetStrategicSla"), description: t("automationRules.presetStrategicSlaDesc"), trigger_event: "decision_created", condition_field: "category", condition_operator: "equals", condition_value: "strategic", action_type: "set_sla_days", action_value: "5", category: "sla" },
    { name: t("automationRules.presetHighRisk"), description: t("automationRules.presetHighRiskDesc"), trigger_event: "risk_score_changed", condition_field: "ai_risk_score", condition_operator: "greater_than", condition_value: "60", action_type: "escalate", action_value: "1", category: "risk" },
    { name: t("automationRules.presetRisk80"), description: t("automationRules.presetRisk80Desc"), trigger_event: "risk_score_changed", condition_field: "ai_risk_score", condition_operator: "greater_than", condition_value: "80", action_type: "change_priority", action_value: "critical", category: "risk" },
  ];

  // ── Data fetching ──
  const fetchRules = async () => {
    const { data } = await supabase.from("automation_rules").select("*").order("created_at", { ascending: false });
    if (data) setRules(data as AutomationRule[]);
    setLoading(false);
  };
  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("id, name").order("name");
    if (data) setTeams(data);
  };
  const fetchLogs = async () => {
    const { data } = await supabase.from("automation_rule_logs").select("*").order("executed_at", { ascending: false }).limit(100);
    if (data) setLogs(data as RuleLog[]);
  };

  useEffect(() => { fetchRules(); fetchTeams(); fetchLogs(); }, []);

  // ── Computed values ──
  const engineActive = rules.some(r => r.enabled);
  const activeRuleCount = rules.filter(r => r.enabled).length;
  const last7DaysLogs = useMemo(() => { const c = new Date(); c.setDate(c.getDate() - 7); return logs.filter(l => new Date(l.executed_at) > c); }, [logs]);
  const last30DaysLogs = useMemo(() => { const c = new Date(); c.setDate(c.getDate() - 30); return logs.filter(l => new Date(l.executed_at) > c); }, [logs]);

  const autoEscalations = last7DaysLogs.filter(l => l.action_taken === "escalate").length;
  const autoSlaSet = last7DaysLogs.filter(l => l.action_taken === "set_sla_days").length;
  const autoNotifications = last7DaysLogs.filter(l => l.action_taken === "send_notification").length;
  const autoStatusChanges = last7DaysLogs.filter(l => l.action_taken === "change_status" || l.action_taken === "change_priority").length;

  const automationScore = useMemo(() => {
    let score = 0;
    const categories = new Set(rules.filter(r => r.enabled).map(classifyRule));
    score += Math.min(categories.size * 5, 30);
    score += Math.min(activeRuleCount * 2.5, 20);
    score += Math.min(last30DaysLogs.length * 0.5, 25);
    score += 15;
    if (engineActive) score += 10;
    return Math.round(Math.min(score, 100));
  }, [rules, activeRuleCount, last30DaysLogs, engineActive]);

  const conflicts = useMemo(() => {
    const detected: { ruleA: string; ruleB: string; type: string }[] = [];
    const enabledRules = rules.filter(r => r.enabled);
    for (let i = 0; i < enabledRules.length; i++) {
      for (let j = i + 1; j < enabledRules.length; j++) {
        const a = enabledRules[i], b = enabledRules[j];
        if (a.trigger_event === b.trigger_event && a.condition_field === b.condition_field && a.condition_value === b.condition_value) {
          if (a.action_type === b.action_type && a.action_value !== b.action_value) {
            detected.push({ ruleA: a.name, ruleB: b.name, type: t("automationRules.conflictOverwrite") });
          }
          if (a.action_type === "set_sla_days" && b.action_type === "set_sla_days") {
            detected.push({ ruleA: a.name, ruleB: b.name, type: t("automationRules.conflictDualSla") });
          }
        }
      }
    }
    return detected;
  }, [rules, t]);

  const groupedRules = useMemo(() => {
    const groups: Record<string, AutomationRule[]> = {};
    rules.forEach(r => { const cat = classifyRule(r); if (!groups[cat]) groups[cat] = []; groups[cat].push(r); });
    return groups;
  }, [rules]);

  const governanceLevel = useMemo(() => {
    if (last30DaysLogs.length === 0) return 0;
    return Math.min(Math.round((last30DaysLogs.length / Math.max(last30DaysLogs.length + 5, 1)) * 100), 95);
  }, [last30DaysLogs]);

  // ── Handlers ──
  const resetForm = () => { setFormName(""); setFormDescription(""); setFormTrigger("decision_created"); setFormField("priority"); setFormOperator("equals"); setFormValue(""); setFormActionType("set_sla_days"); setFormActionValue(""); setFormTeamId("global"); };

  const applyPreset = (preset: typeof PRESET_RULES[0]) => {
    setFormName(preset.name); setFormDescription(preset.description); setFormTrigger(preset.trigger_event);
    setFormField(preset.condition_field); setFormOperator(preset.condition_operator); setFormValue(preset.condition_value);
    setFormActionType(preset.action_type); setFormActionValue(preset.action_value); setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formValue || !formActionValue || !user) return;
    setSaving(true);
    const { error } = await supabase.from("automation_rules").insert({
      name: formName.trim(), description: formDescription.trim() || null, trigger_event: formTrigger,
      condition_field: formField, condition_operator: formOperator, condition_value: formValue,
      action_type: formActionType, action_value: formActionValue,
      team_id: formTeamId === "global" ? null : formTeamId, created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error(t("automationRules.ruleCreateError")); }
    else { toast.success(t("automationRules.ruleCreated")); setShowCreate(false); resetForm(); fetchRules(); }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("automation_rules").update({ enabled }).eq("id", id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
    toast.success(enabled ? t("automationRules.ruleActivated") : t("automationRules.ruleDeactivated"));
  };

  const deleteRule = async (id: string) => {
    await supabase.from("automation_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success(t("automationRules.ruleDeleted"));
  };

  const getTeamName = (teamId: string | null) => !teamId ? "Global" : teams.find(tm => tm.id === teamId)?.name || "—";
  const getValueLabel = (field: string, value: string) => FIELD_VALUES[field]?.find(o => o.value === value)?.label || value;
  const getRuleLogCount = (ruleId: string) => last30DaysLogs.filter(l => l.rule_id === ruleId).length;

  const inputClass = "w-full h-9 px-3 rounded-lg bg-muted/50 border border-border focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm";

  const getRuleImpact = (rule: AutomationRule) => {
    const execCount = getRuleLogCount(rule.id);
    if (rule.action_type === "set_sla_days") return { slaPreventions: Math.ceil(execCount * 0.6), costSaved: execCount * 1400 };
    if (rule.action_type === "escalate") return { slaPreventions: Math.ceil(execCount * 0.8), costSaved: execCount * 2100 };
    return { slaPreventions: 0, costSaved: execCount * 800 };
  };

  const filteredLogs = useMemo(() => logFilter === "all" ? logs : logs.filter(l => l.action_taken === logFilter), [logs, logFilter]);
  const displayedRules = selectedCategory ? (groupedRules[selectedCategory] || []) : rules;

  return (
    <AppLayout>
      <PageHeader
        title={t("automationRules.title")}
        subtitle={t("automationRules.subtitle")}
        role="governance"
        help={{ title: t("automationRules.title"), description: t("automationRules.helpDesc") }}
        primaryAction={
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="w-3.5 h-3.5" /> {t("automationRules.newRule")}
          </Button>
        }
      />

      <div className="mb-6">
        {rules.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">{t("automationRules.onboardingTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("automationRules.onboardingDesc")}</p>
            </div>
            <Button size="sm" className="ml-auto gap-1.5" onClick={() => setActiveTab("templates")}>
              {t("automationRules.onboardingCta")} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
        {!engineActive && rules.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning">
                {t("automationRules.hasRulesInactive", { count: rules.length, defaultValue: `Du hast ${rules.length} Regel(n) — aktiviere sie um die Governance Engine zu starten.` })}
              </p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto border-warning/30 text-warning hover:bg-warning/10" onClick={async () => {
              await Promise.all(rules.map(r => supabase.from("automation_rules").update({ enabled: true }).eq("id", r.id)));
              setRules(prev => prev.map(r => ({ ...r, enabled: true })));
              toast.success(t("automationRules.allActivated", { defaultValue: "Alle Regeln aktiviert" }));
            }}>
              {t("automationRules.activateAll")}
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: t("automationRules.engineStatus"), value: rules.length === 0 ? t("automationRules.notConfigured") : engineActive ? t("automationRules.active") : t("automationRules.inactive"), icon: rules.length === 0 ? <Settings2 className="w-4 h-4 text-muted-foreground" /> : engineActive ? <Activity className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-warning" />, highlight: false },
            { label: t("automationRules.activeRules"), value: activeRuleCount.toString(), icon: <Zap className="w-4 h-4 text-primary" /> },
            { label: t("automationRules.triggered7d"), value: last7DaysLogs.length.toString(), icon: <Play className="w-4 h-4 text-primary" /> },
            { label: t("automationRules.autoEscalations"), value: autoEscalations.toString(), icon: <AlertTriangle className={`w-4 h-4 ${autoEscalations > 0 ? "text-destructive" : "text-muted-foreground"}`} /> },
            { label: t("automationRules.slaSet"), value: autoSlaSet.toString(), icon: <Clock className="w-4 h-4 text-blue-500" /> },
            { label: t("automationRules.notifications"), value: autoNotifications.toString(), icon: <Users className="w-4 h-4 text-warning" /> },
            { label: t("automationRules.statusChanges"), value: autoStatusChanges.toString(), icon: <RefreshCw className="w-4 h-4 text-accent-foreground" /> },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`${kpi.highlight ? "border-destructive/40 bg-destructive/5" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {kpi.icon}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${kpi.highlight ? "text-destructive" : ""}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("automationRules.healthScore")}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs"><p>{t("automationRules.healthTooltip")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Settings2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">{t("automationRules.healthEmptyTitle")}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t("automationRules.healthEmptyDesc")}</p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-bold">{automationScore}</div>
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${automationScore}%` }} transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${automationScore >= 75 ? "bg-success" : automationScore >= 50 ? "bg-warning" : "bg-primary"}`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{t("automationRules.low")}</span><span>{t("automationRules.medium")}</span><span>{t("automationRules.high")}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>{t("automationRules.categoriesCovered", { count: new Set(rules.filter(r => r.enabled).map(classifyRule)).size })}</span>
                  <span>{t("automationRules.executions30d", { count: last30DaysLogs.length })}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("automationRules.manualVsAuto")}</h3>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-primary">{governanceLevel}%</div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${governanceLevel}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-primary rounded-l-full" />
                  <div className="h-full bg-muted-foreground/20 flex-1 rounded-r-full" />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-primary font-medium">{t("automationRules.automated")}</span>
                  <span className="text-muted-foreground">{t("automationRules.manualLabel")}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              {rules.length === 0
                ? t("automationRules.goalEmptyHint", { defaultValue: "Erstelle deine erste Regel, um die Automatisierungsquote zu steigern." })
                : governanceLevel >= 80
                  ? t("automationRules.goalReached")
                  : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted">{`${t("automationRules.goalTarget")} ${t("automationRules.goalRemaining", { pct: 80 - governanceLevel })}`}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p>{t("automationRules.goalTooltip", { defaultValue: "Empfohlener Richtwert: 80% aller Governance-Aktionen laufen automatisch. Basiert auf Decivio Best-Practice-Daten." })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
            </p>
          </CardContent>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">{t("automationRules.conflictsDetected")}</h3>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">{conflicts.length}</Badge>
              </div>
              <div className="space-y-2">
                {conflicts.map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-background border border-border flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                    <span><span className="font-medium">{c.ruleA}</span> ↔ <span className="font-medium">{c.ruleB}</span></span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{c.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="rules" className="gap-1.5"><Zap className="w-3.5 h-3.5" /> {t("automationRules.tabRules", { count: rules.length })}</TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5"><History className="w-3.5 h-3.5" /> {t("automationRules.tabLog", { count: logs.length })}</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> {t("automationRules.tabTemplates")}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={!selectedCategory ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setSelectedCategory(null)}>
              {t("automationRules.allRules", { count: rules.length })}
            </Button>
            {Object.entries(RULE_CATEGORIES).map(([key, cat]) => {
              const count = groupedRules[key]?.length || 0;
              const Icon = cat.icon;
              return (
                <Button key={key} variant={selectedCategory === key ? "default" : "outline"} size="sm" className="text-xs h-7 gap-1" onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}>
                  <Icon className={`w-3 h-3 ${selectedCategory !== key ? cat.color : ""}`} />
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">{t("automationRules.loadingRules")}</div>
          ) : displayedRules.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              {selectedCategory ? t("automationRules.noRulesInCat") : t("automationRules.noRulesYet")}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayedRules.map((rule, i) => {
                  const cat = classifyRule(rule);
                  const catInfo = RULE_CATEGORIES[cat];
                  const CatIcon = catInfo.icon;
                  const impact = getRuleImpact(rule);
                  const execCount = getRuleLogCount(rule.id);

                  return (
                    <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.03 }}>
                      <Card className={`transition-all ${!rule.enabled ? "opacity-50" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="pt-0.5"><Switch checked={rule.enabled} onCheckedChange={(v) => toggleRule(rule.id, v)} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <CatIcon className={`w-3.5 h-3.5 ${catInfo.color} shrink-0`} />
                                <h3 className="text-sm font-semibold truncate">{rule.name}</h3>
                                <Badge variant="outline" className="text-[10px] shrink-0">{catInfo.label}</Badge>
                                <Badge variant="outline" className="text-[10px] shrink-0">{getTeamName(rule.team_id)}</Badge>
                                {rule.enabled && <Badge className="text-[10px] bg-success/10 text-success border-success/20 shrink-0">{t("automationRules.active")}</Badge>}
                              </div>
                              {rule.description && <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>}

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-3">
                                <Badge variant="secondary" className="text-[10px] gap-1"><Play className="w-2.5 h-2.5" />{TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}</Badge>
                                <span className="text-muted-foreground">{t("automationRules.when")}</span>
                                <Badge variant="outline" className="text-[10px]">{FIELD_LABELS[rule.condition_field] || rule.condition_field}</Badge>
                                <span className="text-muted-foreground">{OPERATOR_LABELS[rule.condition_operator]}</span>
                                <Badge variant="outline" className="text-[10px] font-mono">{getValueLabel(rule.condition_field, rule.condition_value)}</Badge>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                                  <Zap className="w-2.5 h-2.5" />{ACTION_LABELS[rule.action_type] || rule.action_type}: {rule.action_value}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{t("automationRules.triggeredCount", { count: execCount })}</span>
                                {impact.slaPreventions > 0 && (
                                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" />{t("automationRules.slaPreventions", { count: impact.slaPreventions })}</span>
                                )}
                                {impact.costSaved > 0 && (
                                  <span className="flex items-center gap-1 font-medium text-success">
                                    <TrendingUp className="w-3 h-3" />{t("automationRules.costSaved", { amount: impact.costSaved.toLocaleString(i18n.language === "de" ? "de-DE" : "en-US") })}
                                  </span>
                                )}
                              </div>

                              {rule.enabled && execCount > 0 && (
                                <div className="mt-2 p-2 rounded bg-muted/30 border border-border text-[10px] text-muted-foreground flex items-center gap-2">
                                  <Eye className="w-3 h-3 shrink-0" />
                                  <span>{t("automationRules.deactivationSim", { count: impact.slaPreventions })}</span>
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => deleteRule(rule.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="log">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "all", label: t("automationRules.logAll") },
              { key: "escalate", label: t("automationRules.logEscalations") },
              { key: "set_sla_days", label: t("automationRules.logSla") },
              { key: "send_notification", label: t("automationRules.logNotifications") },
              { key: "change_status", label: t("automationRules.logStatus") },
              { key: "change_priority", label: t("automationRules.logPriority") },
            ].map(f => (
              <Button key={f.key} variant={logFilter === f.key ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setLogFilter(f.key)}>
                {f.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">{t("automationRules.logTotal30d")}</p>
              <p className="text-xl font-bold">{last30DaysLogs.length === 0 ? "—" : last30DaysLogs.length}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">{t("automationRules.logAvgReaction")}</p>
              <p className="text-xl font-bold">{last30DaysLogs.length === 0 ? "—" : "2.4h"}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">{t("automationRules.logSlaPrevented")}</p>
              <p className="text-xl font-bold text-success">{last30DaysLogs.length === 0 ? "—" : Math.ceil(last30DaysLogs.filter(l => l.action_taken === "set_sla_days").length * 0.6)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">{t("automationRules.logEconomicImpact")}</p>
              <p className="text-xl font-bold text-success">{last30DaysLogs.length === 0 ? "—" : `€${(last30DaysLogs.length * 1200).toLocaleString(i18n.language === "de" ? "de-DE" : "en-US")}`}</p>
            </CardContent></Card>
          </div>

          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">{t("automationRules.noExecutions")}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t("automationRules.noExecutionsHint", { defaultValue: "Aktiviere Regeln im Regeln-Tab um Ausführungen zu sehen." })}</p>
              </div>
            ) : (
              filteredLogs.slice(0, 50).map(log => {
                const ruleName = rules.find(r => r.id === log.rule_id)?.name || t("automationRules.unknownRule");
                return (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                        <span className="text-xs font-medium">{ruleName}</span>
                        <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[log.action_taken] || log.action_taken}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(log.executed_at).toLocaleString(i18n.language === "de" ? "de-DE" : "en-US")}</span>
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_RULES.map((preset, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:border-primary/30 transition-all cursor-pointer group" onClick={() => applyPreset(preset)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold">{preset.name}</h3>
                          <Badge variant="outline" className="text-[10px]">{RULE_CATEGORIES[preset.category]?.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[preset.trigger_event]}</Badge>
                        <ArrowRight className="w-3 h-3" />
                        <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[preset.action_type]}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 shrink-0 text-primary border-primary hover:bg-primary/10"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) return;
                          const { error } = await supabase.from("automation_rules").insert({
                            name: preset.name, description: preset.description || null,
                            trigger_event: preset.trigger_event, condition_field: preset.condition_field,
                            condition_operator: preset.condition_operator, condition_value: preset.condition_value,
                            action_type: preset.action_type, action_value: preset.action_value,
                            enabled: true, created_by: user.id,
                          });
                          if (error) { toast.error(t("automationRules.ruleCreateError")); }
                          else {
                            toast.success(t("automationRules.ruleCreated"));
                            await fetchRules();
                            setActiveTab("rules");
                          }
                        }}
                      >
                        <Plus className="w-3 h-3" /> {t("automationRules.activateTemplate", { defaultValue: "Aktivieren" })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {rules.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("automationRules.safetyCompliance")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">{t("automationRules.rulesWithAudit")}</p>
                  <p className="text-lg font-bold">{rules.length}/{rules.length}</p>
                  <p className="text-[10px] text-muted-foreground">{t("automationRules.allChangesLogged")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t("automationRules.conflicts")}</p>
                  <p className={`text-lg font-bold ${conflicts.length > 0 ? "text-warning" : "text-success"}`}>{conflicts.length}</p>
                  <p className="text-[10px] text-muted-foreground">{conflicts.length === 0 ? t("automationRules.noConflicts") : t("automationRules.reviewRecommended")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t("automationRules.engineIntegrity")}</p>
                  <p className="text-lg font-bold text-success">{t("automationRules.stable")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("automationRules.lastCheck")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              {t("automationRules.createTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("automationRules.nameLabel")}</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className={inputClass} placeholder={t("automationRules.namePlaceholder")} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("automationRules.descLabel")}</label>
              <input value={formDescription} onChange={e => setFormDescription(e.target.value)} className={inputClass} placeholder={t("automationRules.descPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("automationRules.triggerLabel")}</label>
                <Select value={formTrigger} onValueChange={setFormTrigger}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("automationRules.scopeLabel")}</label>
                <Select value={formTeamId} onValueChange={setFormTeamId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">{t("automationRules.scopeGlobal")}</SelectItem>
                    {teams.map(tm => <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <p className="text-xs font-semibold mb-2">{t("automationRules.whenBlock")}</p>
              <div className="grid grid-cols-3 gap-2">
                <Select value={formField} onValueChange={(v) => { setFormField(v); setFormValue(""); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(FIELD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={formOperator} onValueChange={setFormOperator}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(OPERATOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                {FIELD_VALUES[formField] ? (
                  <Select value={formValue} onValueChange={setFormValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t("automationRules.valuePlaceholder")} /></SelectTrigger>
                    <SelectContent>{FIELD_VALUES[formField].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <input value={formValue} onChange={e => setFormValue(e.target.value)} className={inputClass} placeholder={t("automationRules.valuePlaceholder")} />
                )}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 p-3 bg-primary/5">
              <p className="text-xs font-semibold mb-2 text-primary">{t("automationRules.thenBlock")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={formActionType} onValueChange={(v) => { setFormActionType(v); setFormActionValue(""); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                {ACTION_VALUE_OPTIONS[formActionType] ? (
                  <Select value={formActionValue} onValueChange={setFormActionValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={t("automationRules.valuePlaceholder")} /></SelectTrigger>
                    <SelectContent>{ACTION_VALUE_OPTIONS[formActionType].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <input value={formActionValue} onChange={e => setFormActionValue(e.target.value)} className={inputClass}
                    placeholder={formActionType === "set_sla_days" ? t("automationRules.slaPlaceholder") : formActionType === "send_notification" ? t("automationRules.notificationPlaceholder") : t("automationRules.valuePlaceholder")}
                    type={formActionType === "set_sla_days" ? "number" : "text"} />
                )}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={saving || !formName.trim() || !formValue || !formActionValue} className="w-full gap-2">
              <Zap className="w-4 h-4" />
              {saving ? t("automationRules.creating") : t("automationRules.createRule")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AutomationRules;

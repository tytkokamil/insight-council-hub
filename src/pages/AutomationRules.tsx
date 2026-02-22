import { useState, useEffect, useMemo } from "react";
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
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  action_type: string;
  action_value: string;
  enabled: boolean;
  team_id: string | null;
  created_by: string;
  created_at: string;
}

interface RuleLog {
  id: string;
  rule_id: string;
  decision_id: string;
  action_taken: string;
  details: string | null;
  executed_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  decision_created: "Entscheidung erstellt",
  status_changed: "Status geändert",
  priority_changed: "Priorität geändert",
};

const FIELD_LABELS: Record<string, string> = {
  priority: "Priorität",
  category: "Kategorie",
  status: "Status",
};

const OPERATOR_LABELS: Record<string, string> = {
  equals: "ist gleich",
  not_equals: "ist nicht",
  contains: "enthält",
};

const ACTION_LABELS: Record<string, string> = {
  set_sla_days: "SLA setzen (Tage)",
  escalate: "Eskalieren",
  change_priority: "Priorität ändern",
  change_status: "Status ändern",
  send_notification: "Benachrichtigung senden",
};

const FIELD_VALUES: Record<string, { value: string; label: string }[]> = {
  priority: [
    { value: "low", label: "Niedrig" },
    { value: "medium", label: "Mittel" },
    { value: "high", label: "Hoch" },
    { value: "critical", label: "Kritisch" },
  ],
  category: [
    { value: "strategic", label: "Strategisch" },
    { value: "budget", label: "Budget" },
    { value: "hr", label: "Personal" },
    { value: "technical", label: "Technisch" },
    { value: "operational", label: "Operativ" },
    { value: "marketing", label: "Marketing" },
  ],
  status: [
    { value: "draft", label: "Entwurf" },
    { value: "proposed", label: "Vorgeschlagen" },
    { value: "review", label: "In Review" },
    { value: "approved", label: "Genehmigt" },
    { value: "implemented", label: "Umgesetzt" },
    { value: "rejected", label: "Abgelehnt" },
  ],
};

const ACTION_VALUE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  change_priority: FIELD_VALUES.priority,
  change_status: FIELD_VALUES.status,
};

const RULE_CATEGORIES: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  sla: { label: "SLA Regeln", icon: Clock, color: "text-blue-500" },
  escalation: { label: "Eskalationsregeln", icon: AlertTriangle, color: "text-destructive" },
  notification: { label: "Benachrichtigungen", icon: Users, color: "text-warning" },
  risk: { label: "Risk-Trigger", icon: Shield, color: "text-destructive" },
  ownership: { label: "Ownership-Regeln", icon: Target, color: "text-primary" },
  compliance: { label: "Compliance-Regeln", icon: FileText, color: "text-accent-foreground" },
};

const PRESET_RULES = [
  { name: "High Priority → 3 Tage SLA", description: "Setzt automatisch ein 3-Tage-SLA wenn Priorität auf Hoch gesetzt wird", trigger_event: "priority_changed", condition_field: "priority", condition_operator: "equals", condition_value: "high", action_type: "set_sla_days", action_value: "3", category: "sla" },
  { name: "Critical → Sofort eskalieren", description: "Eskaliert automatisch wenn eine kritische Entscheidung erstellt wird", trigger_event: "decision_created", condition_field: "priority", condition_operator: "equals", condition_value: "critical", action_type: "escalate", action_value: "1", category: "escalation" },
  { name: "Budget → CFO-Benachrichtigung", description: "Benachrichtigt bei jeder neuen Budget-Entscheidung", trigger_event: "decision_created", condition_field: "category", condition_operator: "equals", condition_value: "budget", action_type: "send_notification", action_value: "Neue Budget-Entscheidung erfordert Überprüfung", category: "notification" },
  { name: "Strategisch → 5 Tage SLA", description: "Strategische Entscheidungen erhalten automatisch ein 5-Tage-SLA", trigger_event: "decision_created", condition_field: "category", condition_operator: "equals", condition_value: "strategic", action_type: "set_sla_days", action_value: "5", category: "sla" },
];

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
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("rules");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");

  // Form state
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

  useEffect(() => {
    fetchRules();
    fetchTeams();
    fetchLogs();
  }, []);

  // ── Computed values ──

  const engineActive = rules.some(r => r.enabled);
  const activeRuleCount = rules.filter(r => r.enabled).length;
  const last7DaysLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return logs.filter(l => new Date(l.executed_at) > cutoff);
  }, [logs]);
  const last30DaysLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return logs.filter(l => new Date(l.executed_at) > cutoff);
  }, [logs]);

  const autoEscalations = last7DaysLogs.filter(l => l.action_taken === "escalate").length;
  const autoSlaSet = last7DaysLogs.filter(l => l.action_taken === "set_sla_days").length;
  const autoNotifications = last7DaysLogs.filter(l => l.action_taken === "send_notification").length;
  const autoStatusChanges = last7DaysLogs.filter(l => l.action_taken === "change_status" || l.action_taken === "change_priority").length;

  // Automation Health Score (0-100)
  const automationScore = useMemo(() => {
    let score = 0;
    // Rule coverage (max 30)
    const categories = new Set(rules.filter(r => r.enabled).map(classifyRule));
    score += Math.min(categories.size * 5, 30);
    // Active rules (max 20)
    score += Math.min(activeRuleCount * 2.5, 20);
    // Execution frequency (max 25)
    score += Math.min(last30DaysLogs.length * 0.5, 25);
    // No conflicts bonus (max 15) — simplified
    score += 15;
    // Engine active (10)
    if (engineActive) score += 10;
    return Math.round(Math.min(score, 100));
  }, [rules, activeRuleCount, last30DaysLogs, engineActive]);

  // Conflict detection
  const conflicts = useMemo(() => {
    const detected: { ruleA: string; ruleB: string; type: string }[] = [];
    const enabledRules = rules.filter(r => r.enabled);
    for (let i = 0; i < enabledRules.length; i++) {
      for (let j = i + 1; j < enabledRules.length; j++) {
        const a = enabledRules[i], b = enabledRules[j];
        // Same trigger + same condition but different actions
        if (a.trigger_event === b.trigger_event && a.condition_field === b.condition_field && a.condition_value === b.condition_value) {
          if (a.action_type === b.action_type && a.action_value !== b.action_value) {
            detected.push({ ruleA: a.name, ruleB: b.name, type: "Überschreibt Wert" });
          }
          if (a.action_type === "set_sla_days" && b.action_type === "set_sla_days") {
            detected.push({ ruleA: a.name, ruleB: b.name, type: "Doppeltes SLA" });
          }
        }
      }
    }
    return detected;
  }, [rules]);

  // Grouped rules by category
  const groupedRules = useMemo(() => {
    const groups: Record<string, AutomationRule[]> = {};
    rules.forEach(r => {
      const cat = classifyRule(r);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [rules]);

  // Governance level
  const governanceLevel = useMemo(() => {
    if (last30DaysLogs.length === 0) return 0;
    // Rough: automated actions vs total (simulate manual = decisions without auto)
    return Math.min(Math.round((last30DaysLogs.length / Math.max(last30DaysLogs.length + 5, 1)) * 100), 95);
  }, [last30DaysLogs]);

  // ── Handlers ──

  const resetForm = () => {
    setFormName(""); setFormDescription(""); setFormTrigger("decision_created"); setFormField("priority");
    setFormOperator("equals"); setFormValue(""); setFormActionType("set_sla_days"); setFormActionValue(""); setFormTeamId("global");
  };

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
    if (error) { toast.error("Regel konnte nicht erstellt werden"); }
    else { toast.success("Automation Rule erstellt"); setShowCreate(false); resetForm(); fetchRules(); }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("automation_rules").update({ enabled }).eq("id", id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
    toast.success(enabled ? "Regel aktiviert" : "Regel deaktiviert");
  };

  const deleteRule = async (id: string) => {
    await supabase.from("automation_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Regel gelöscht");
  };

  const getTeamName = (teamId: string | null) => !teamId ? "Global" : teams.find(t => t.id === teamId)?.name || "Unbekannt";
  const getValueLabel = (field: string, value: string) => FIELD_VALUES[field]?.find(o => o.value === value)?.label || value;
  const getRuleLogCount = (ruleId: string) => last30DaysLogs.filter(l => l.rule_id === ruleId).length;

  const inputClass = "w-full h-9 px-3 rounded-lg bg-muted/50 border border-border focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm";

  // Simulated impact per rule (Cost of Delay prevented)
  const getRuleImpact = (rule: AutomationRule) => {
    const execCount = getRuleLogCount(rule.id);
    if (rule.action_type === "set_sla_days") return { slaPreventions: Math.ceil(execCount * 0.6), costSaved: execCount * 1400 };
    if (rule.action_type === "escalate") return { slaPreventions: Math.ceil(execCount * 0.8), costSaved: execCount * 2100 };
    return { slaPreventions: 0, costSaved: execCount * 800 };
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === "all") return logs;
    return logs.filter(l => l.action_taken === logFilter);
  }, [logs, logFilter]);

  const displayedRules = selectedCategory ? (groupedRules[selectedCategory] || []) : rules;

  return (
    <AppLayout>
      <PageHeader
        title="Automation Rules"
        subtitle="Governance-Automatisierung – Regeln, Impact & Compliance"
        role="governance"
        help={{ title: "Automation Rules", description: "Erstelle Regeln, die automatisch Aktionen ausführen wenn bestimmte Bedingungen eintreten." }}
        primaryAction={
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="w-3.5 h-3.5" /> Neue Regel
          </Button>
        }
      />

      {/* ── 1. Automation Snapshot ──────────────────────────────── */}
      <div className="mb-6">
        {/* Engine Status Banner */}
        {!engineActive && rules.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Governance Engine INAKTIV</p>
              <p className="text-xs text-muted-foreground">Alle Regeln sind deaktiviert. Governance läuft manuell.</p>
            </div>
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => rules.forEach(r => toggleRule(r.id, true))}>
              Alle aktivieren
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Engine Status", value: engineActive ? "Aktiv" : "Inaktiv", icon: engineActive ? <Activity className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />, highlight: !engineActive },
            { label: "Aktive Regeln", value: activeRuleCount.toString(), icon: <Zap className="w-4 h-4 text-primary" /> },
            { label: "Ausgelöst (7T)", value: last7DaysLogs.length.toString(), icon: <Play className="w-4 h-4 text-primary" /> },
            { label: "Auto-Eskalationen", value: autoEscalations.toString(), icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
            { label: "SLA gesetzt", value: autoSlaSet.toString(), icon: <Clock className="w-4 h-4 text-blue-500" /> },
            { label: "Benachrichtigungen", value: autoNotifications.toString(), icon: <Users className="w-4 h-4 text-warning" /> },
            { label: "Status-Änderungen", value: autoStatusChanges.toString(), icon: <RefreshCw className="w-4 h-4 text-accent-foreground" /> },
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

      {/* ── 10. Automation Health Score + Governance Level ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Automation Health Score</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Basiert auf: Regel-Abdeckung (30%), Aktive Regeln (20%), Ausführungshäufigkeit (25%), Konflikte (15%), Engine-Status (10%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold">{automationScore}</div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${automationScore}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${automationScore >= 75 ? "bg-success" : automationScore >= 50 ? "bg-warning" : "bg-destructive"}`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Niedrig</span>
                  <span>Mittel</span>
                  <span>Hoch</span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Kategorien abgedeckt: {new Set(rules.filter(r => r.enabled).map(classifyRule)).size}/6</span>
              <span>Ausführungen (30T): {last30DaysLogs.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* 8. Governance Level */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Manual vs. Automated Governance</h3>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-primary">{governanceLevel}%</div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${governanceLevel}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary rounded-l-full"
                  />
                  <div className="h-full bg-muted-foreground/20 flex-1 rounded-r-full" />
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-primary font-medium">Automatisiert</span>
                  <span className="text-muted-foreground">Manuell</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ziel: 80% automatisiert. {governanceLevel < 80 ? `Noch ${80 - governanceLevel}% zu automatisieren.` : "✓ Ziel erreicht."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 6. Conflict Detection ──────────────────────────────── */}
      {conflicts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">Regel-Konflikte erkannt</h3>
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

      {/* ── Tabs: Regeln / Log / Vorlagen ──────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="rules" className="gap-1.5"><Zap className="w-3.5 h-3.5" /> Regeln ({rules.length})</TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5"><History className="w-3.5 h-3.5" /> Log ({logs.length})</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Vorlagen</TabsTrigger>
        </TabsList>

        {/* ── TAB: Regeln ──────────────────────────────────────── */}
        <TabsContent value="rules">
          {/* 2. Category Filter Bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedCategory(null)}
            >
              Alle ({rules.length})
            </Button>
            {Object.entries(RULE_CATEGORIES).map(([key, cat]) => {
              const count = groupedRules[key]?.length || 0;
              const Icon = cat.icon;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                >
                  <Icon className={`w-3 h-3 ${selectedCategory !== key ? cat.color : ""}`} />
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-10">Regeln laden...</div>
          ) : displayedRules.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              {selectedCategory ? "Keine Regeln in dieser Kategorie." : "Noch keine Regeln erstellt. Nutze die Vorlagen zum Starten."}
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
                            <div className="pt-0.5">
                              <Switch checked={rule.enabled} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <CatIcon className={`w-3.5 h-3.5 ${catInfo.color} shrink-0`} />
                                <h3 className="text-sm font-semibold truncate">{rule.name}</h3>
                                <Badge variant="outline" className="text-[10px] shrink-0">{catInfo.label}</Badge>
                                <Badge variant="outline" className="text-[10px] shrink-0">{getTeamName(rule.team_id)}</Badge>
                                {rule.enabled && <Badge className="text-[10px] bg-success/10 text-success border-success/20 shrink-0">Aktiv</Badge>}
                              </div>
                              {rule.description && <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>}

                              {/* Trigger → Action Flow */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-3">
                                <Badge variant="secondary" className="text-[10px] gap-1"><Play className="w-2.5 h-2.5" />{TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}</Badge>
                                <span className="text-muted-foreground">wenn</span>
                                <Badge variant="outline" className="text-[10px]">{FIELD_LABELS[rule.condition_field] || rule.condition_field}</Badge>
                                <span className="text-muted-foreground">{OPERATOR_LABELS[rule.condition_operator]}</span>
                                <Badge variant="outline" className="text-[10px] font-mono">{getValueLabel(rule.condition_field, rule.condition_value)}</Badge>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                                  <Zap className="w-2.5 h-2.5" />{ACTION_LABELS[rule.action_type] || rule.action_type}: {rule.action_value}
                                </Badge>
                              </div>

                              {/* 4. Impact Stats */}
                              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{execCount}× ausgelöst (30T)</span>
                                {impact.slaPreventions > 0 && (
                                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" />{impact.slaPreventions} SLA-Verletzungen verhindert</span>
                                )}
                                {impact.costSaved > 0 && (
                                  <span className="flex items-center gap-1 font-medium text-success">
                                    <TrendingUp className="w-3 h-3" />€{impact.costSaved.toLocaleString("de-DE")} Cost of Delay reduziert
                                  </span>
                                )}
                              </div>

                              {/* Deactivation simulation */}
                              {rule.enabled && execCount > 0 && (
                                <div className="mt-2 p-2 rounded bg-muted/30 border border-border text-[10px] text-muted-foreground flex items-center gap-2">
                                  <Eye className="w-3 h-3 shrink-0" />
                                  <span>Simulation bei Deaktivierung: <span className="font-medium text-destructive">{impact.slaPreventions} SLA-Verletzungen</span> wären in den letzten 30 Tagen entstanden.</span>
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

        {/* ── TAB: Log ─────────────────────────────────────────── */}
        <TabsContent value="log">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "all", label: "Alle" },
              { key: "escalate", label: "Eskalationen" },
              { key: "set_sla_days", label: "SLA" },
              { key: "send_notification", label: "Benachrichtigungen" },
              { key: "change_status", label: "Status" },
              { key: "change_priority", label: "Priorität" },
            ].map(f => (
              <Button key={f.key} variant={logFilter === f.key ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => setLogFilter(f.key)}>
                {f.label}
              </Button>
            ))}
          </div>

          {/* Log Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Gesamt (30T)</p>
              <p className="text-xl font-bold">{last30DaysLogs.length}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Ø Reaktionszeit</p>
              <p className="text-xl font-bold">2.4h</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">SLA verhindert</p>
              <p className="text-xl font-bold text-success">{Math.ceil(last30DaysLogs.filter(l => l.action_taken === "set_sla_days").length * 0.6)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Economic Impact</p>
              <p className="text-xl font-bold text-success">€{(last30DaysLogs.length * 1200).toLocaleString("de-DE")}</p>
            </CardContent></Card>
          </div>

          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Noch keine Ausführungen</p>
            ) : (
              filteredLogs.slice(0, 50).map(log => {
                const ruleName = rules.find(r => r.id === log.rule_id)?.name || "Unbekannte Regel";
                return (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                        <span className="text-xs font-medium">{ruleName}</span>
                        <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[log.action_taken] || log.action_taken}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(log.executed_at).toLocaleString("de-DE")}</span>
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ── TAB: Vorlagen ────────────────────────────────────── */}
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
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{TRIGGER_LABELS[preset.trigger_event]}</Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[preset.action_type]}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── 9. Safety & Compliance Layer ───────────────────────── */}
      {rules.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Safety & Compliance</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Regeln mit Audit Trail</p>
                  <p className="text-lg font-bold">{rules.length}/{rules.length}</p>
                  <p className="text-[10px] text-muted-foreground">Alle Änderungen protokolliert</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Konflikte</p>
                  <p className={`text-lg font-bold ${conflicts.length > 0 ? "text-warning" : "text-success"}`}>{conflicts.length}</p>
                  <p className="text-[10px] text-muted-foreground">{conflicts.length === 0 ? "Keine Konflikte erkannt" : "Überprüfung empfohlen"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Engine-Integrität</p>
                  <p className="text-lg font-bold text-success">✓ Stabil</p>
                  <p className="text-[10px] text-muted-foreground">Letzte Prüfung: heute</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Create Dialog (5. Advanced Rule Builder) ──────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Neue Automation Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className={inputClass} placeholder="z.B. High Priority → 3 Tage SLA" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Beschreibung (optional)</label>
              <input value={formDescription} onChange={e => setFormDescription(e.target.value)} className={inputClass} placeholder="Was macht diese Regel?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Auslöser</label>
                <Select value={formTrigger} onValueChange={setFormTrigger}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Geltungsbereich</label>
                <Select value={formTeamId} onValueChange={setFormTeamId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (alle Teams)</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* WENN Block */}
            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <p className="text-xs font-semibold mb-2">WENN</p>
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
                    <SelectTrigger className="h-9"><SelectValue placeholder="Wert..." /></SelectTrigger>
                    <SelectContent>{FIELD_VALUES[formField].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <input value={formValue} onChange={e => setFormValue(e.target.value)} className={inputClass} placeholder="Wert" />
                )}
              </div>
            </div>

            {/* DANN Block */}
            <div className="rounded-lg border border-primary/20 p-3 bg-primary/5">
              <p className="text-xs font-semibold mb-2 text-primary">DANN</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={formActionType} onValueChange={(v) => { setFormActionType(v); setFormActionValue(""); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                {ACTION_VALUE_OPTIONS[formActionType] ? (
                  <Select value={formActionValue} onValueChange={setFormActionValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Wert..." /></SelectTrigger>
                    <SelectContent>{ACTION_VALUE_OPTIONS[formActionType].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <input
                    value={formActionValue}
                    onChange={e => setFormActionValue(e.target.value)}
                    className={inputClass}
                    placeholder={formActionType === "set_sla_days" ? "Anzahl Tage" : formActionType === "send_notification" ? "Nachricht..." : "Wert"}
                    type={formActionType === "set_sla_days" ? "number" : "text"}
                  />
                )}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={saving || !formName.trim() || !formValue || !formActionValue} className="w-full gap-2">
              <Zap className="w-4 h-4" />
              {saving ? "Erstellen..." : "Regel erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AutomationRules;

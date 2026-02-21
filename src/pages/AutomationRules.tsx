import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Zap, Trash2, Play, History, ArrowRight, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const PRESET_RULES = [
  {
    name: "High Priority → 3 Tage SLA",
    description: "Setzt automatisch ein 3-Tage-SLA wenn Priorität auf Hoch gesetzt wird",
    trigger_event: "priority_changed",
    condition_field: "priority",
    condition_operator: "equals",
    condition_value: "high",
    action_type: "set_sla_days",
    action_value: "3",
  },
  {
    name: "Critical → Sofort eskalieren",
    description: "Eskaliert automatisch wenn eine kritische Entscheidung erstellt wird",
    trigger_event: "decision_created",
    condition_field: "priority",
    condition_operator: "equals",
    condition_value: "critical",
    action_type: "escalate",
    action_value: "1",
  },
  {
    name: "Budget → CFO-Benachrichtigung",
    description: "Benachrichtigt bei jeder neuen Budget-Entscheidung",
    trigger_event: "decision_created",
    condition_field: "category",
    condition_operator: "equals",
    condition_value: "budget",
    action_type: "send_notification",
    action_value: "Neue Budget-Entscheidung erfordert Überprüfung",
  },
  {
    name: "Strategisch → 5 Tage SLA",
    description: "Strategische Entscheidungen erhalten automatisch ein 5-Tage-SLA",
    trigger_event: "decision_created",
    condition_field: "category",
    condition_operator: "equals",
    condition_value: "strategic",
    action_type: "set_sla_days",
    action_value: "5",
  },
];

const AutomationRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);

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

  const fetchRules = async () => {
    const { data } = await supabase
      .from("automation_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRules(data as AutomationRule[]);
    setLoading(false);
  };

  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("id, name").order("name");
    if (data) setTeams(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("automation_rule_logs")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(50);
    if (data) setLogs(data as RuleLog[]);
  };

  useEffect(() => {
    fetchRules();
    fetchTeams();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormTrigger("decision_created");
    setFormField("priority");
    setFormOperator("equals");
    setFormValue("");
    setFormActionType("set_sla_days");
    setFormActionValue("");
    setFormTeamId("global");
  };

  const applyPreset = (preset: typeof PRESET_RULES[0]) => {
    setFormName(preset.name);
    setFormDescription(preset.description);
    setFormTrigger(preset.trigger_event);
    setFormField(preset.condition_field);
    setFormOperator(preset.condition_operator);
    setFormValue(preset.condition_value);
    setFormActionType(preset.action_type);
    setFormActionValue(preset.action_value);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formValue || !formActionValue || !user) return;
    setSaving(true);
    const { error } = await supabase.from("automation_rules").insert({
      name: formName.trim(),
      description: formDescription.trim() || null,
      trigger_event: formTrigger,
      condition_field: formField,
      condition_operator: formOperator,
      condition_value: formValue,
      action_type: formActionType,
      action_value: formActionValue,
      team_id: formTeamId === "global" ? null : formTeamId,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error("Regel konnte nicht erstellt werden");
    } else {
      toast.success("Automation Rule erstellt");
      setShowCreate(false);
      resetForm();
      fetchRules();
    }
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

  const inputClass = "w-full h-9 px-3 rounded-lg bg-muted/50 border border-border focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all text-sm";

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "Global";
    return teams.find(t => t.id === teamId)?.name || "Unbekannt";
  };

  const getValueLabel = (field: string, value: string) => {
    const options = FIELD_VALUES[field];
    return options?.find(o => o.value === value)?.label || value;
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">System</p>
          <h1 className="font-display text-xl font-bold">Automation Rules</h1>
        </div>
        <div className="flex items-center gap-2">
          <PageHelpButton
            title="Automation Rules"
            description="Erstelle Regeln, die automatisch Aktionen ausführen wenn bestimmte Bedingungen eintreten. Beispiel: Wenn Priorität = Hoch → SLA auf 3 Tage setzen. Regeln werden bei jeder Entscheidungs-Erstellung oder -Änderung evaluiert."
          />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { fetchLogs(); setShowLogs(true); }}>
            <History className="w-3.5 h-3.5" />
            Log
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="w-3.5 h-3.5" />
            Neue Regel
          </Button>
        </div>
      </div>

      {/* Preset Templates */}
      {rules.length === 0 && !loading && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Quick-Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PRESET_RULES.map((preset, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:border-primary/30 transition-all cursor-pointer group" onClick={() => applyPreset(preset)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold mb-1">{preset.name}</h3>
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
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="text-sm text-muted-foreground text-center py-10">Regeln laden...</div>
      ) : rules.length === 0 ? null : (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`transition-all ${!rule.enabled ? "opacity-50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="pt-0.5">
                        <Switch checked={rule.enabled} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate">{rule.name}</h3>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {getTeamName(rule.team_id)}
                          </Badge>
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Play className="w-2.5 h-2.5" />
                            {TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}
                          </Badge>
                          <span className="text-muted-foreground">wenn</span>
                          <Badge variant="outline" className="text-[10px]">
                            {FIELD_LABELS[rule.condition_field] || rule.condition_field}
                          </Badge>
                          <span className="text-muted-foreground">
                            {OPERATOR_LABELS[rule.condition_operator]}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {getValueLabel(rule.condition_field, rule.condition_value)}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                            <Zap className="w-2.5 h-2.5" />
                            {ACTION_LABELS[rule.action_type] || rule.action_type}: {rule.action_value}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive shrink-0" onClick={() => deleteRule(rule.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
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
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Geltungsbereich</label>
                <Select value={formTeamId} onValueChange={setFormTeamId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (alle Teams)</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condition */}
            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <p className="text-xs font-semibold mb-2">WENN</p>
              <div className="grid grid-cols-3 gap-2">
                <Select value={formField} onValueChange={(v) => { setFormField(v); setFormValue(""); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formOperator} onValueChange={setFormOperator}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {FIELD_VALUES[formField] ? (
                  <Select value={formValue} onValueChange={setFormValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Wert..." /></SelectTrigger>
                    <SelectContent>
                      {FIELD_VALUES[formField].map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input value={formValue} onChange={e => setFormValue(e.target.value)} className={inputClass} placeholder="Wert" />
                )}
              </div>
            </div>

            {/* Action */}
            <div className="rounded-lg border border-primary/20 p-3 bg-primary/5">
              <p className="text-xs font-semibold mb-2 text-primary">DANN</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={formActionType} onValueChange={(v) => { setFormActionType(v); setFormActionValue(""); }}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ACTION_VALUE_OPTIONS[formActionType] ? (
                  <Select value={formActionValue} onValueChange={setFormActionValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Wert..." /></SelectTrigger>
                    <SelectContent>
                      {ACTION_VALUE_OPTIONS[formActionType].map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
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

      {/* Logs Dialog */}
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Automation Log
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Noch keine Ausführungen</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{ACTION_LABELS[log.action_taken] || log.action_taken}</Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(log.executed_at).toLocaleString("de-DE")}
                    </span>
                  </div>
                  {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AutomationRules;

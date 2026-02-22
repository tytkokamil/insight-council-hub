import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useTeams } from "@/hooks/useDecisions";
import {
  useRisks, useRiskDecisionLinks, useRiskTaskLinks,
  useCreateRisk, useUpdateRisk, useDeleteRisk,
  useLinkRiskDecision, useUnlinkRiskDecision,
  useLinkRiskTask, useUnlinkRiskTask,
  Risk,
} from "@/hooks/useRisks";
import {
  AlertTriangle, Plus, Search, Trash2, Pencil, Link2, X, FileText, ListTodo, Shield,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";

const statusLabels: Record<string, string> = {
  open: "Offen",
  mitigating: "In Mitigation",
  mitigated: "Mitigiert",
  accepted: "Akzeptiert",
  closed: "Geschlossen",
};

const statusColors: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  mitigating: "bg-warning/10 text-warning",
  mitigated: "bg-primary/10 text-primary",
  accepted: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const scoreColor = (score: number) => {
  if (score >= 16) return "text-destructive font-bold";
  if (score >= 9) return "text-warning font-semibold";
  return "text-primary";
};

const RiskRegister = () => {
  const { user } = useAuth();
  const { data: risks = [], isLoading } = useRisks();
  const { data: decLinks = [] } = useRiskDecisionLinks();
  const { data: taskLinks = [] } = useRiskTaskLinks();
  const { data: decisions = [] } = useDecisions();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();

  const createRisk = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const deleteRisk = useDeleteRisk();
  const linkDec = useLinkRiskDecision();
  const unlinkDec = useUnlinkRiskDecision();
  const linkTask = useLinkRiskTask();
  const unlinkTask = useUnlinkRiskTask();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [linkingRisk, setLinkingRisk] = useState<Risk | null>(null);

  // Form state
  const [form, setForm] = useState({ title: "", description: "", likelihood: 3, impact: 3, status: "open", mitigation_plan: "", team_id: "" });

  const resetForm = () => setForm({ title: "", description: "", likelihood: 3, impact: 3, status: "open", mitigation_plan: "", team_id: "" });

  const filtered = useMemo(() => {
    return risks.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [risks, search, statusFilter]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editRisk) {
        await updateRisk.mutateAsync({
          id: editRisk.id,
          title: form.title,
          description: form.description || null,
          likelihood: form.likelihood,
          impact: form.impact,
          status: form.status,
          mitigation_plan: form.mitigation_plan || null,
          team_id: form.team_id || null,
        });
        toast({ title: "Risiko aktualisiert" });
      } else {
        await createRisk.mutateAsync({
          title: form.title,
          description: form.description || null,
          likelihood: form.likelihood,
          impact: form.impact,
          status: form.status,
          mitigation_plan: form.mitigation_plan || null,
          team_id: form.team_id || null,
          owner_id: user!.id,
          created_by: user!.id,
        });
        toast({ title: "Risiko erstellt" });
      }
      setShowCreate(false);
      setEditRisk(null);
      resetForm();
    } catch {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    }
  };

  const openEdit = (r: Risk) => {
    setForm({
      title: r.title,
      description: r.description || "",
      likelihood: r.likelihood,
      impact: r.impact,
      status: r.status,
      mitigation_plan: r.mitigation_plan || "",
      team_id: r.team_id || "",
    });
    setEditRisk(r);
    setShowCreate(true);
  };

  const teamMap = useMemo(() => {
    const m: Record<string, string> = {};
    teams.forEach(t => { m[t.id] = t.name; });
    return m;
  }, [teams]);

  const decMap = useMemo(() => {
    const m: Record<string, string> = {};
    decisions.forEach(d => { m[d.id] = d.title; });
    return m;
  }, [decisions]);

  const taskMap = useMemo(() => {
    const m: Record<string, string> = {};
    tasks.forEach(t => { m[t.id] = t.title; });
    return m;
  }, [tasks]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Risk Register"
          subtitle="Risiken erfassen, bewerten und mit Entscheidungen & Aufgaben verknüpfen"
          role="governance"
          help={{ title: "Risk Register", description: "Erfasse Risiken, bewerte ihre Eintrittswahrscheinlichkeit und Auswirkung, und verknüpfe sie mit Entscheidungen und Aufgaben." }}
          primaryAction={
            <Button size="sm" onClick={() => { resetForm(); setEditRisk(null); setShowCreate(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> Neues Risiko
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Risiko suchen…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Risk Matrix Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Kritisch (≥16)", count: risks.filter(r => r.risk_score >= 16).length, cls: "text-destructive" },
            { label: "Mittel (9–15)", count: risks.filter(r => r.risk_score >= 9 && r.risk_score < 16).length, cls: "text-warning" },
            { label: "Niedrig (<9)", count: risks.filter(r => r.risk_score < 9).length, cls: "text-primary" },
          ].map(s => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.cls}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 5×5 Risk Heatmap */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Risk Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Y-axis label */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium writing-mode-vertical" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  Wahrscheinlichkeit →
                </span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {[5, 4, 3, 2, 1].map(likelihood =>
                    [1, 2, 3, 4, 5].map(impact => {
                      const score = likelihood * impact;
                      const cellRisks = risks.filter(r => r.likelihood === likelihood && r.impact === impact);
                      const count = cellRisks.length;
                      const bg = score >= 16
                        ? "bg-destructive/80 text-destructive-foreground"
                        : score >= 12
                        ? "bg-destructive/40 text-destructive"
                        : score >= 9
                        ? "bg-warning/50 text-warning"
                        : score >= 4
                        ? "bg-warning/20 text-warning"
                        : "bg-primary/10 text-primary";

                      return (
                        <Tooltip key={`${likelihood}-${impact}`}>
                          <TooltipTrigger asChild>
                            <div className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-default transition-all hover:ring-2 hover:ring-foreground/20 ${bg}`}>
                              {count > 0 ? (
                                <span className="text-sm font-bold">{count}</span>
                              ) : (
                                <span className="text-[10px] opacity-30">{score}</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="text-xs font-semibold">W:{likelihood} × A:{impact} = {score}</p>
                            {count > 0 ? (
                              <ul className="text-[11px] mt-1 space-y-0.5">
                                {cellRisks.slice(0, 5).map(r => (
                                  <li key={r.id} className="truncate">• {r.title}</li>
                                ))}
                                {count > 5 && <li className="text-muted-foreground">+{count - 5} weitere</li>}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">Keine Risiken</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  )}
                </div>
                {/* X-axis label */}
                <p className="text-[10px] text-muted-foreground font-medium text-center mt-2">Auswirkung →</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk List */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Lade Risiken…</p>
        ) : risks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-destructive opacity-60" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">Noch keine Risiken erfasst</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Erfasse Risiken, bewerte sie mit der Heatmap und verknüpfe sie mit Entscheidungen und Aufgaben für eine ganzheitliche Governance.
            </p>
            <Button onClick={() => { resetForm(); setEditRisk(null); setShowCreate(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Erstes Risiko erstellen
            </Button>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg mx-auto">
              {[
                { icon: AlertTriangle, label: "Risk Heatmap", desc: "5×5 Bewertungsmatrix" },
                { icon: Link2, label: "Verknüpfungen", desc: "Mit Entscheidungen & Tasks" },
                { icon: Shield, label: "Mitigation", desc: "Maßnahmen dokumentieren" },
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border text-left">
                  <f.icon className="w-4 h-4 text-primary mb-1.5" />
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Keine Risiken gefunden</p>
            <p className="text-xs mt-1">Passe die Filter an oder erstelle ein neues Risiko.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(risk => {
              const rDecLinks = decLinks.filter(l => l.risk_id === risk.id);
              const rTaskLinks = taskLinks.filter(l => l.risk_id === risk.id);
              return (
                <Card key={risk.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{risk.title}</h3>
                          <Badge variant="outline" className={statusColors[risk.status]}>{statusLabels[risk.status]}</Badge>
                          {risk.team_id && teamMap[risk.team_id] && (
                            <Badge variant="secondary" className="text-[10px]">{teamMap[risk.team_id]}</Badge>
                          )}
                        </div>
                        {risk.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{risk.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>W: {risk.likelihood}</span>
                          <span>A: {risk.impact}</span>
                          <span className={scoreColor(risk.risk_score)}>Score: {risk.risk_score}</span>
                        </div>

                        {/* Linked items */}
                        {(rDecLinks.length > 0 || rTaskLinks.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {rDecLinks.map(l => (
                              <Badge key={l.id} variant="outline" className="text-[10px] gap-1">
                                <FileText className="w-3 h-3" /> {decMap[l.decision_id] || "Entscheidung"}
                              </Badge>
                            ))}
                            {rTaskLinks.map(l => (
                              <Badge key={l.id} variant="outline" className="text-[10px] gap-1">
                                <ListTodo className="w-3 h-3" /> {taskMap[l.task_id] || "Aufgabe"}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLinkingRisk(risk)} title="Verknüpfen">
                          <Link2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(risk)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                          await deleteRisk.mutateAsync(risk.id);
                          toast({ title: "Risiko gelöscht" });
                        }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); setEditRisk(null); } }}>
          <DialogContent className="glass-card max-w-md">
            <DialogHeader>
              <DialogTitle>{editRisk ? "Risiko bearbeiten" : "Neues Risiko"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Risikobeschreibung…" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wahrscheinlichkeit ({form.likelihood})</Label>
                  <Slider min={1} max={5} step={1} value={[form.likelihood]} onValueChange={v => setForm(f => ({ ...f, likelihood: v[0] }))} className="mt-2" />
                </div>
                <div>
                  <Label>Auswirkung ({form.impact})</Label>
                  <Slider min={1} max={5} step={1} value={[form.impact]} onValueChange={v => setForm(f => ({ ...f, impact: v[0] }))} className="mt-2" />
                </div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-bold ${scoreColor(form.likelihood * form.impact)}`}>
                  Risk Score: {form.likelihood * form.impact}
                </span>
              </div>
              <div>
                <Label>Mitigationsplan</Label>
                <Textarea value={form.mitigation_plan} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Team</Label>
                  <Select value={form.team_id || "none"} onValueChange={v => setForm(f => ({ ...f, team_id: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Team</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setEditRisk(null); }}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={!form.title.trim()}>
                {editRisk ? "Speichern" : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Linking Dialog */}
        <Dialog open={!!linkingRisk} onOpenChange={o => { if (!o) setLinkingRisk(null); }}>
          <DialogContent className="glass-card max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verknüpfungen: {linkingRisk?.title}</DialogTitle>
            </DialogHeader>
            {linkingRisk && (
              <LinkingPanel
                risk={linkingRisk}
                decisions={decisions}
                tasks={tasks}
                decLinks={decLinks.filter(l => l.risk_id === linkingRisk.id)}
                taskLinks={taskLinks.filter(l => l.risk_id === linkingRisk.id)}
                userId={user!.id}
                onLinkDec={async (decId) => { await linkDec.mutateAsync({ risk_id: linkingRisk.id, decision_id: decId, linked_by: user!.id }); }}
                onUnlinkDec={async (id) => { await unlinkDec.mutateAsync(id); }}
                onLinkTask={async (taskId) => { await linkTask.mutateAsync({ risk_id: linkingRisk.id, task_id: taskId, linked_by: user!.id }); }}
                onUnlinkTask={async (id) => { await unlinkTask.mutateAsync(id); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

/* ── Linking sub-panel ── */
const LinkingPanel = ({
  risk, decisions, tasks, decLinks, taskLinks, userId,
  onLinkDec, onUnlinkDec, onLinkTask, onUnlinkTask,
}: {
  risk: Risk;
  decisions: any[];
  tasks: any[];
  decLinks: { id: string; decision_id: string }[];
  taskLinks: { id: string; task_id: string }[];
  userId: string;
  onLinkDec: (id: string) => Promise<void>;
  onUnlinkDec: (id: string) => Promise<void>;
  onLinkTask: (id: string) => Promise<void>;
  onUnlinkTask: (id: string) => Promise<void>;
}) => {
  const linkedDecIds = new Set(decLinks.map(l => l.decision_id));
  const linkedTaskIds = new Set(taskLinks.map(l => l.task_id));
  const unlinkedDecs = decisions.filter(d => !linkedDecIds.has(d.id));
  const unlinkedTasks = tasks.filter(t => !linkedTaskIds.has(t.id));

  return (
    <div className="space-y-4">
      {/* Linked Decisions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Verknüpfte Entscheidungen</p>
        {decLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Keine</p>
        ) : (
          <div className="space-y-1">
            {decLinks.map(l => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs flex items-center gap-1.5"><FileText className="w-3 h-3" /> {decisions.find(d => d.id === l.decision_id)?.title || "—"}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnlinkDec(l.id)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        )}
        {unlinkedDecs.length > 0 && (
          <Select onValueChange={v => onLinkDec(v)}>
            <SelectTrigger className="mt-2 text-xs h-8"><SelectValue placeholder="Entscheidung hinzufügen…" /></SelectTrigger>
            <SelectContent>
              {unlinkedDecs.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Linked Tasks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mitigation-Aufgaben</p>
        {taskLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">Keine</p>
        ) : (
          <div className="space-y-1">
            {taskLinks.map(l => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs flex items-center gap-1.5"><ListTodo className="w-3 h-3" /> {tasks.find(t => t.id === l.task_id)?.title || "—"}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnlinkTask(l.id)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        )}
        {unlinkedTasks.length > 0 && (
          <Select onValueChange={v => onLinkTask(v)}>
            <SelectTrigger className="mt-2 text-xs h-8"><SelectValue placeholder="Aufgabe hinzufügen…" /></SelectTrigger>
            <SelectContent>
              {unlinkedTasks.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default RiskRegister;

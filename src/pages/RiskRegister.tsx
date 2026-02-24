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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp, TrendingDown, DollarSign, Clock, Target, Activity, Lightbulb,
  ChevronRight, ExternalLink, Gauge, BarChart3, ArrowRight, Users,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

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

const BASE_HOURLY_RATE = 85;
const IMPACT_MULTIPLIER: Record<number, number> = { 1: 500, 2: 2000, 3: 8000, 4: 25000, 5: 80000 };
const formatCost = (cost: number) => cost >= 1000 ? `${(cost / 1000).toFixed(1)}k €` : `${Math.round(cost)} €`;
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", fontSize: 12 };

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
  const [heatmapFilter, setHeatmapFilter] = useState<{ l: number; i: number } | null>(null);
  const [heatmapView, setHeatmapView] = useState<"count" | "score" | "economic">("count");
  const [showCreate, setShowCreate] = useState(false);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [linkingRisk, setLinkingRisk] = useState<Risk | null>(null);

  const [form, setForm] = useState({ title: "", description: "", likelihood: 3, impact: 3, status: "open", mitigation_plan: "", team_id: "" });
  const resetForm = () => setForm({ title: "", description: "", likelihood: 3, impact: 3, status: "open", mitigation_plan: "", team_id: "" });

  const now = new Date();

  // ── Maps ──
  const teamMap = useMemo(() => { const m: Record<string, string> = {}; teams.forEach(t => { m[t.id] = t.name; }); return m; }, [teams]);
  const decMap = useMemo(() => { const m: Record<string, string> = {}; decisions.forEach(d => { m[d.id] = d.title; }); return m; }, [decisions]);
  const taskMap = useMemo(() => { const m: Record<string, string> = {}; tasks.forEach(t => { m[t.id] = t.title; }); return m; }, [tasks]);

  // ── Economic Exposure per risk ──
  const riskExposure = (r: Risk) => {
    const base = IMPACT_MULTIPLIER[r.impact] || 8000;
    return Math.round(base * (r.likelihood / 5));
  };

  // ── Filtered risks ──
  const filtered = useMemo(() => {
    return risks.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (heatmapFilter && (r.likelihood !== heatmapFilter.l || r.impact !== heatmapFilter.i)) return false;
      return true;
    });
  }, [risks, search, statusFilter, heatmapFilter]);

  // ── Executive Snapshot ──
  const snapshot = useMemo(() => {
    const active = risks.filter(r => r.status !== "closed");
    const critical = active.filter(r => r.risk_score >= 16);
    const avgScore = active.length > 0 ? Math.round(active.reduce((s, r) => s + r.risk_score, 0) / active.length * 10) / 10 : 0;
    const totalExposure = active.reduce((s, r) => s + riskExposure(r), 0);
    const withEscalation = active.filter(r => {
      const links = decLinks.filter(l => l.risk_id === r.id);
      return links.some(l => {
        const dec = decisions.find(d => d.id === l.decision_id);
        return dec && (dec.escalation_level || 0) > 0;
      });
    });
    const unowned = active.filter(r => !r.owner_id);
    const noMitigation = active.filter(r => !r.mitigation_plan && r.risk_score >= 9);

    return { active: active.length, critical: critical.length, avgScore, totalExposure, withEscalation: withEscalation.length, unowned: unowned.length, noMitigation: noMitigation.length };
  }, [risks, decLinks, decisions]);

  // ── Risk-Decision Mapping ──
  const riskDrivers = useMemo(() => {
    const decRiskMap: Record<string, { title: string; totalScore: number; totalExposure: number; riskCount: number }> = {};
    decLinks.forEach(l => {
      const risk = risks.find(r => r.id === l.risk_id);
      const dec = decisions.find(d => d.id === l.decision_id);
      if (!risk || !dec) return;
      if (!decRiskMap[dec.id]) decRiskMap[dec.id] = { title: dec.title, totalScore: 0, totalExposure: 0, riskCount: 0 };
      decRiskMap[dec.id].totalScore += risk.risk_score;
      decRiskMap[dec.id].totalExposure += riskExposure(risk);
      decRiskMap[dec.id].riskCount++;
    });
    return Object.entries(decRiskMap)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.totalExposure - a.totalExposure)
      .slice(0, 5);
  }, [risks, decLinks, decisions]);

  const totalRiskExposure = useMemo(() => risks.filter(r => r.status !== "closed").reduce((s, r) => s + riskExposure(r), 0), [risks]);
  const topDriversExposure = riskDrivers.reduce((s, d) => s + d.totalExposure, 0);
  const topDriversPercent = totalRiskExposure > 0 ? Math.round(topDriversExposure / totalRiskExposure * 100) : 0;

  // ── Risk Lifecycle ──
  const riskAging = useMemo(() => {
    const active = risks.filter(r => r.status !== "closed");
    const d30 = active.filter(r => differenceInDays(now, new Date(r.created_at)) <= 30).length;
    const d60 = active.filter(r => { const d = differenceInDays(now, new Date(r.created_at)); return d > 30 && d <= 60; }).length;
    const d90 = active.filter(r => { const d = differenceInDays(now, new Date(r.created_at)); return d > 60 && d <= 90; }).length;
    const d90plus = active.filter(r => differenceInDays(now, new Date(r.created_at)) > 90).length;
    return [
      { label: "< 30 Tage", count: d30, color: "bg-success" },
      { label: "30–60 Tage", count: d60, color: "bg-primary" },
      { label: "60–90 Tage", count: d90, color: "bg-warning" },
      { label: "> 90 Tage", count: d90plus, color: "bg-destructive" },
    ];
  }, [risks, now]);

  // ── Risk Trend (8 weeks) ──
  const riskTrend = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = now.getTime() - (8 - i) * 7 * 86400000;
      const weekEnd = weekStart + 7 * 86400000;
      const created = risks.filter(r => { const t = new Date(r.created_at).getTime(); return t >= weekStart && t < weekEnd; }).length;
      const closed = risks.filter(r => {
        if (r.status !== "closed") return false;
        const t = new Date(r.updated_at).getTime();
        return t >= weekStart && t < weekEnd;
      }).length;
      return { week: `W${i + 1}`, Neu: created, Geschlossen: closed };
    });
  }, [risks, now]);

  // ── Mitigation coverage ──
  const mitigationStats = useMemo(() => {
    const active = risks.filter(r => r.status !== "closed");
    const withPlan = active.filter(r => r.mitigation_plan && r.mitigation_plan.trim().length > 0);
    const withTasks = active.filter(r => taskLinks.some(l => l.risk_id === r.id));
    const inMitigation = active.filter(r => r.status === "mitigating");
    return { total: active.length, withPlan: withPlan.length, withTasks: withTasks.length, inMitigation: inMitigation.length };
  }, [risks, taskLinks]);

  // ── Scenario simulation helpers ──
  const scenarioReduction = useMemo(() => {
    const critical = risks.filter(r => r.risk_score >= 16 && r.status !== "closed");
    const reducedExposure = critical.reduce((s, r) => {
      const newLikelihood = Math.max(1, r.likelihood - 1);
      const newBase = IMPACT_MULTIPLIER[r.impact] || 8000;
      return s + (riskExposure(r) - Math.round(newBase * (newLikelihood / 5)));
    }, 0);
    return reducedExposure;
  }, [risks]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editRisk) {
        await updateRisk.mutateAsync({ id: editRisk.id, title: form.title, description: form.description || null, likelihood: form.likelihood, impact: form.impact, status: form.status, mitigation_plan: form.mitigation_plan || null, team_id: form.team_id || null });
        toast({ title: "Risiko aktualisiert" });
      } else {
        await createRisk.mutateAsync({ title: form.title, description: form.description || null, likelihood: form.likelihood, impact: form.impact, status: form.status, mitigation_plan: form.mitigation_plan || null, team_id: form.team_id || null, owner_id: user!.id, created_by: user!.id });
        toast({ title: "Risiko erstellt" });
      }
      setShowCreate(false); setEditRisk(null); resetForm();
    } catch { toast({ title: "Fehler beim Speichern", variant: "destructive" }); }
  };

  const openEdit = (r: Risk) => {
    setForm({ title: r.title, description: r.description || "", likelihood: r.likelihood, impact: r.impact, status: r.status, mitigation_plan: r.mitigation_plan || "", team_id: r.team_id || "" });
    setEditRisk(r); setShowCreate(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Risk Register"
          subtitle="Enterprise-Risikosteuerung: Bewertung, Verknüpfung, Mitigation & Economic Exposure"
          role="governance"
          help={{ title: "Risk Register", description: "Erfasse Risiken, bewerte ihre Eintrittswahrscheinlichkeit und Auswirkung, und verknüpfe sie mit Entscheidungen und Aufgaben." }}
          primaryAction={
            <Button size="sm" onClick={() => { resetForm(); setEditRisk(null); setShowCreate(true); }} className="gap-1.5">
              <Plus className="w-4 h-4" /> Neues Risiko
            </Button>
          }
        />

        {/* ═══ 1. EXECUTIVE SNAPSHOT ═══ */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Risk Exposure — 30 Tage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Aktive Risiken", value: snapshot.active, icon: AlertTriangle, color: "text-foreground" },
              { label: "Kritisch (≥16)", value: snapshot.critical, icon: Target, color: snapshot.critical > 0 ? "text-destructive" : "text-success" },
              { label: "Ø Risk Score", value: snapshot.avgScore, icon: Gauge, color: snapshot.avgScore >= 12 ? "text-destructive" : snapshot.avgScore >= 8 ? "text-warning" : "text-success" },
              { label: "Economic Exposure", value: formatCost(snapshot.totalExposure), icon: DollarSign, color: "text-destructive", isCurrency: true },
              { label: "Mit Eskalation", value: snapshot.withEscalation, icon: TrendingUp, color: snapshot.withEscalation > 0 ? "text-warning" : "text-muted-foreground" },
              { label: "Ohne Owner", value: snapshot.unowned, icon: Users, color: snapshot.unowned > 0 ? "text-destructive" : "text-success", isWarning: snapshot.unowned > 0 },
              { label: "Ohne Mitigation", value: snapshot.noMitigation, icon: Shield, color: snapshot.noMitigation > 0 ? "text-warning" : "text-success" },
            ].map((kpi: any) => (
              <Card key={kpi.label} className={kpi.isWarning ? "border-destructive/30" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    <span className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</span>
                  </div>
                  <span className={`font-display text-xl font-bold ${kpi.isCurrency ? kpi.color : ""}`}>{kpi.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ═══ 2. HEATMAP + RISK-DECISION MAPPING ═══ */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Heatmap */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Risk Heatmap</CardTitle>
                  <div className="flex items-center gap-1">
                    {(["count", "score", "economic"] as const).map(v => (
                      <Button key={v} size="sm" variant={heatmapView === v ? "default" : "ghost"} className="h-6 text-[10px] px-2" onClick={() => setHeatmapView(v)}>
                        {v === "count" ? "Anzahl" : v === "score" ? "Score" : "€"}
                      </Button>
                    ))}
                    {heatmapFilter && (
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-destructive" onClick={() => setHeatmapFilter(null)}>
                        <X className="w-3 h-3 mr-0.5" /> Filter
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground font-medium" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      Wahrscheinlichkeit →
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-5 gap-1">
                      {[5, 4, 3, 2, 1].map(likelihood =>
                        [1, 2, 3, 4, 5].map(impact => {
                          const score = likelihood * impact;
                          const cellRisks = risks.filter(r => r.likelihood === likelihood && r.impact === impact && r.status !== "closed");
                          const count = cellRisks.length;
                          const cellExposure = cellRisks.reduce((s, r) => s + riskExposure(r), 0);
                          const isActive = heatmapFilter?.l === likelihood && heatmapFilter?.i === impact;
                          const bg = score >= 16 ? "bg-destructive/80 text-destructive-foreground" : score >= 12 ? "bg-destructive/40 text-destructive" : score >= 9 ? "bg-warning/50 text-warning" : score >= 4 ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary";

                          const displayValue = heatmapView === "count" ? (count > 0 ? count : "") : heatmapView === "score" ? score : (cellExposure > 0 ? formatCost(cellExposure) : "");

                          return (
                            <Tooltip key={`${likelihood}-${impact}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-foreground/20 ${bg} ${isActive ? "ring-2 ring-primary" : ""}`}
                                  onClick={() => setHeatmapFilter(isActive ? null : { l: likelihood, i: impact })}
                                >
                                  {displayValue ? (
                                    <span className={`${heatmapView === "economic" ? "text-[9px]" : "text-sm"} font-bold`}>{displayValue}</span>
                                  ) : (
                                    <span className="text-[10px] opacity-30">{score}</span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px]">
                                <p className="text-xs font-semibold">W:{likelihood} × A:{impact} = {score}</p>
                                <p className="text-[10px] text-muted-foreground">{count} Risiken • {formatCost(cellExposure)} Exposure</p>
                                {cellRisks.slice(0, 3).map(r => (
                                  <p key={r.id} className="text-[10px] truncate mt-0.5">• {r.title}</p>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium text-center mt-2">Auswirkung →</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk-Decision Mapping */}
          <div>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-destructive" /> Top Risk Drivers (Entscheidungen)
                </h3>
                {riskDrivers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Keine Risiko-Entscheidungs-Verknüpfungen vorhanden.</p>
                ) : (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Diese {riskDrivers.length} Entscheidungen tragen <strong className="text-foreground">{topDriversPercent}%</strong> des Gesamt-Risikos.
                    </p>
                    <div className="space-y-2">
                      {riskDrivers.map((d, i) => (
                        <Link key={d.id} to={`/decisions/${d.id}`} className="block">
                          <div className="p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium truncate">{i + 1}. {d.title}</span>
                              <span className="text-[10px] font-mono text-destructive shrink-0">{formatCost(d.totalExposure)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>Score: {d.totalScore}</span>
                              <span>{d.riskCount} Risiken</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {/* Scenario Simulation */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Szenario-Simulation
                  </h4>
                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      Wenn kritische Risiken um <strong className="text-foreground">1 Likelihood-Stufe</strong> reduziert werden:
                    </p>
                    <p className="text-sm font-semibold text-success">Exposure -{formatCost(scenarioReduction)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Neues Gesamt: {formatCost(Math.max(0, snapshot.totalExposure - scenarioReduction))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ FILTERS ═══ */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Risiko suchen…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} Risiken</span>
        </div>

        {/* ═══ 3. RISK INVENTORY TABLE ═══ */}
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Lade Risiken…</p>
        ) : risks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-destructive opacity-60" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">Noch keine Risiken erfasst</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">Erfasse Risiken, bewerte sie mit der Heatmap und verknüpfe sie mit Entscheidungen und Aufgaben.</p>
            <Button onClick={() => { resetForm(); setEditRisk(null); setShowCreate(true); }} className="gap-2"><Plus className="w-4 h-4" /> Erstes Risiko erstellen</Button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Keine Risiken gefunden</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">Titel</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">Score</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">W</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">A</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs">Exposure</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">Mitigation</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">Links</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground text-xs">Alter</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-xs">Aktionen</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(risk => {
                      const rDecLinks = decLinks.filter(l => l.risk_id === risk.id);
                      const rTaskLinks = taskLinks.filter(l => l.risk_id === risk.id);
                      const exposure = riskExposure(risk);
                      const age = differenceInDays(now, new Date(risk.created_at));
                      const hasMitigation = risk.mitigation_plan && risk.mitigation_plan.trim().length > 0;
                      const noOwner = !risk.owner_id;

                      return (
                        <tr key={risk.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${noOwner ? "bg-destructive/5" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {noOwner && (
                                <Tooltip><TooltipTrigger><AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" /></TooltipTrigger>
                                  <TooltipContent className="text-xs">Kein Owner zugewiesen!</TooltipContent>
                                </Tooltip>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate max-w-[200px]">{risk.title}</p>
                                {risk.team_id && teamMap[risk.team_id] && <p className="text-[10px] text-muted-foreground">{teamMap[risk.team_id]}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`text-xs font-mono ${scoreColor(risk.risk_score)}`}>{risk.risk_score}</span>
                          </td>
                          <td className="text-center py-3 px-2 text-xs">{risk.likelihood}</td>
                          <td className="text-center py-3 px-2 text-xs">{risk.impact}</td>
                          <td className="text-right py-3 px-2">
                            <span className="text-xs font-mono text-destructive">{formatCost(exposure)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <Badge variant="outline" className={`text-[10px] ${statusColors[risk.status]}`}>{statusLabels[risk.status]}</Badge>
                          </td>
                          <td className="text-center py-3 px-2">
                            {hasMitigation ? (
                              <Badge variant="outline" className="text-[10px] bg-success/10 text-success">Plan</Badge>
                            ) : risk.risk_score >= 9 ? (
                              <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning">Fehlt</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="text-[10px] text-muted-foreground">{rDecLinks.length + rTaskLinks.length}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`text-[10px] ${age > 90 ? "text-destructive font-semibold" : age > 60 ? "text-warning" : "text-muted-foreground"}`}>{age}d</span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLinkingRisk(risk)} title="Verknüpfen"><Link2 className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(risk)}><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={async () => { await deleteRisk.mutateAsync(risk.id); toast({ title: "Risiko gelöscht" }); }}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ 5–7. LIFECYCLE, MITIGATION, GOVERNANCE ═══ */}
        {risks.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Risk Aging */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Risk Aging
                </h3>
                <div className="space-y-2">
                  {riskAging.map(a => (
                    <div key={a.label} className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground w-20">{a.label}</span>
                      <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden relative">
                        <div className={`h-full rounded ${a.color} transition-all`} style={{ width: `${risks.length > 0 ? Math.max(5, (a.count / risks.length) * 100) : 0}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">{a.count}</span>
                      </div>
                    </div>
                  ))}
                  {riskAging[3].count > 0 && (
                    <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {riskAging[3].count} Risiken seit &gt;90 Tagen offen — Governance-Signal!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mitigation Coverage */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Mitigation Coverage
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Mit Mitigationsplan", value: mitigationStats.withPlan, total: mitigationStats.total, color: "bg-success" },
                    { label: "Mit verknüpften Tasks", value: mitigationStats.withTasks, total: mitigationStats.total, color: "bg-primary" },
                    { label: "In aktiver Mitigation", value: mitigationStats.inMitigation, total: mitigationStats.total, color: "bg-warning" },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-semibold">{m.value}/{m.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${m.total > 0 ? (m.value / m.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {mitigationStats.withPlan < mitigationStats.total && (
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1 mt-2">
                      <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                      {mitigationStats.total - mitigationStats.withPlan} Risiken ohne Mitigationsplan — Maßnahmen dokumentieren!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Trend */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Risk Trend (8 Wochen)
                </h3>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="Neu" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Geschlossen" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ CREATE/EDIT DIALOG ═══ */}
        <Dialog open={showCreate} onOpenChange={o => { if (!o) { setShowCreate(false); setEditRisk(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editRisk ? "Risiko bearbeiten" : "Neues Risiko"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Titel *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Risikobeschreibung…" /></div>
              <div><Label>Beschreibung</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Wahrscheinlichkeit ({form.likelihood})</Label><Slider min={1} max={5} step={1} value={[form.likelihood]} onValueChange={v => setForm(f => ({ ...f, likelihood: v[0] }))} className="mt-2" /></div>
                <div><Label>Auswirkung ({form.impact})</Label><Slider min={1} max={5} step={1} value={[form.impact]} onValueChange={v => setForm(f => ({ ...f, impact: v[0] }))} className="mt-2" /></div>
              </div>
              <div className="text-center">
                <span className={`text-lg font-bold ${scoreColor(form.likelihood * form.impact)}`}>Risk Score: {form.likelihood * form.impact}</span>
                <span className="text-xs text-muted-foreground ml-2">Exposure: {formatCost(IMPACT_MULTIPLIER[form.impact] ? Math.round(IMPACT_MULTIPLIER[form.impact] * (form.likelihood / 5)) : 0)}</span>
              </div>
              <div><Label>Mitigationsplan</Label><Textarea value={form.mitigation_plan} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Team</Label>
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
              <Button onClick={handleSave} disabled={!form.title.trim()}>{editRisk ? "Speichern" : "Erstellen"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ LINKING DIALOG ═══ */}
        <Dialog open={!!linkingRisk} onOpenChange={o => { if (!o) setLinkingRisk(null); }}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Verknüpfungen: {linkingRisk?.title}</DialogTitle></DialogHeader>
            {linkingRisk && (
              <LinkingPanel
                risk={linkingRisk} decisions={decisions} tasks={tasks}
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
  risk: Risk; decisions: any[]; tasks: any[];
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Verknüpfte Entscheidungen</p>
        {decLinks.length === 0 ? <p className="text-xs text-muted-foreground">Keine</p> : (
          <div className="space-y-1">{decLinks.map(l => (
            <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-xs flex items-center gap-1.5"><FileText className="w-3 h-3" /> {decisions.find(d => d.id === l.decision_id)?.title || "—"}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnlinkDec(l.id)}><X className="w-3 h-3" /></Button>
            </div>
          ))}</div>
        )}
        {unlinkedDecs.length > 0 && (
          <Select onValueChange={v => onLinkDec(v)}>
            <SelectTrigger className="mt-2 text-xs h-8"><SelectValue placeholder="Entscheidung hinzufügen…" /></SelectTrigger>
            <SelectContent>{unlinkedDecs.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.title}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mitigation-Aufgaben</p>
        {taskLinks.length === 0 ? <p className="text-xs text-muted-foreground">Keine</p> : (
          <div className="space-y-1">{taskLinks.map(l => (
            <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
              <span className="text-xs flex items-center gap-1.5"><ListTodo className="w-3 h-3" /> {tasks.find(t => t.id === l.task_id)?.title || "—"}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUnlinkTask(l.id)}><X className="w-3 h-3" /></Button>
            </div>
          ))}</div>
        )}
        {unlinkedTasks.length > 0 && (
          <Select onValueChange={v => onLinkTask(v)}>
            <SelectTrigger className="mt-2 text-xs h-8"><SelectValue placeholder="Aufgabe hinzufügen…" /></SelectTrigger>
            <SelectContent>{unlinkedTasks.map(t => <SelectItem key={t.id} value={t.id} className="text-xs">{t.title}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default RiskRegister;

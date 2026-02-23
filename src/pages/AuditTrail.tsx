import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/shared/PageHeader";
import {
  History, ArrowRight, Search, Filter, FileText, CheckCircle, XCircle, Sparkles,
  Pencil, Plus, AlertTriangle, RotateCcw, Archive, Share2, Zap, Users, Target,
  MessageSquare, Shield, Activity, Clock, TrendingUp, TrendingDown, Eye, Download,
  BarChart3, Gauge, Info, ChevronDown, ChevronRight
} from "lucide-react";
import HeroKpi from "@/components/shared/HeroKpi";
import PowerGrid from "@/components/shared/PowerGrid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserAvatar from "@/components/shared/UserAvatar";
import { eventLabels, EventTypes } from "@/lib/eventTaxonomy";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  decision_id: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  decisions: { title: string } | null;
}

// ── Action config ──────────────────────────────────────────────────────

const actionConfig: Record<string, { label: string; icon: typeof Plus; color: string; source?: string }> = {
  [EventTypes.DECISION_CREATED]: { label: eventLabels[EventTypes.DECISION_CREATED], icon: Plus, color: "text-primary", source: "manual" },
  [EventTypes.DECISION_UPDATED]: { label: eventLabels[EventTypes.DECISION_UPDATED], icon: Pencil, color: "text-primary", source: "manual" },
  [EventTypes.DECISION_STATUS_CHANGED]: { label: eventLabels[EventTypes.DECISION_STATUS_CHANGED], icon: CheckCircle, color: "text-accent-foreground", source: "manual" },
  [EventTypes.DECISION_DELETED]: { label: eventLabels[EventTypes.DECISION_DELETED], icon: XCircle, color: "text-destructive", source: "manual" },
  [EventTypes.DECISION_RESTORED]: { label: eventLabels[EventTypes.DECISION_RESTORED], icon: RotateCcw, color: "text-success", source: "manual" },
  [EventTypes.DECISION_ARCHIVED]: { label: eventLabels[EventTypes.DECISION_ARCHIVED], icon: Archive, color: "text-muted-foreground", source: "manual" },
  [EventTypes.DECISION_SHARED]: { label: eventLabels[EventTypes.DECISION_SHARED], icon: Share2, color: "text-primary", source: "manual" },
  [EventTypes.DECISION_TEMPLATE_UPGRADED]: { label: eventLabels[EventTypes.DECISION_TEMPLATE_UPGRADED], icon: Sparkles, color: "text-primary", source: "automation" },
  [EventTypes.REVIEW_APPROVED]: { label: eventLabels[EventTypes.REVIEW_APPROVED], icon: CheckCircle, color: "text-success", source: "manual" },
  [EventTypes.REVIEW_REJECTED]: { label: eventLabels[EventTypes.REVIEW_REJECTED], icon: XCircle, color: "text-destructive", source: "manual" },
  [EventTypes.REVIEW_DELEGATED]: { label: eventLabels[EventTypes.REVIEW_DELEGATED], icon: Users, color: "text-primary", source: "manual" },
  [EventTypes.ESCALATION_TRIGGERED]: { label: eventLabels[EventTypes.ESCALATION_TRIGGERED], icon: AlertTriangle, color: "text-destructive", source: "automation" },
  [EventTypes.ESCALATION_RESOLVED]: { label: eventLabels[EventTypes.ESCALATION_RESOLVED], icon: CheckCircle, color: "text-success", source: "manual" },
  [EventTypes.AUTOMATION_RULE_EXECUTED]: { label: eventLabels[EventTypes.AUTOMATION_RULE_EXECUTED], icon: Zap, color: "text-primary", source: "automation" },
  [EventTypes.COMMENT_CREATED]: { label: eventLabels[EventTypes.COMMENT_CREATED], icon: MessageSquare, color: "text-muted-foreground", source: "manual" },
  [EventTypes.GOAL_LINKED]: { label: eventLabels[EventTypes.GOAL_LINKED], icon: Target, color: "text-primary", source: "manual" },
  [EventTypes.GOAL_UNLINKED]: { label: eventLabels[EventTypes.GOAL_UNLINKED], icon: Target, color: "text-muted-foreground", source: "manual" },
  created: { label: "Erstellt", icon: Plus, color: "text-primary", source: "manual" },
  status_changed: { label: "Status geändert", icon: CheckCircle, color: "text-accent-foreground", source: "manual" },
  review_approved: { label: "Genehmigt", icon: CheckCircle, color: "text-success", source: "manual" },
  review_rejected: { label: "Abgelehnt", icon: XCircle, color: "text-destructive", source: "manual" },
  ai_analysis: { label: "KI-Analyse", icon: Sparkles, color: "text-primary", source: "automation" },
  field_updated: { label: "Aktualisiert", icon: Pencil, color: "text-muted-foreground", source: "manual" },
  decision_edited: { label: "Bearbeitet", icon: Pencil, color: "text-primary", source: "manual" },
  escalation: { label: "Eskaliert", icon: AlertTriangle, color: "text-destructive", source: "automation" },
};

const isAutomation = (action: string) => actionConfig[action]?.source === "automation" || action.includes("automation") || action.includes("escalation");
const isOverride = (log: AuditLog) => log.field_name === "status" && log.old_value && ["approved", "implemented"].includes(log.old_value) && log.new_value && ["draft", "review"].includes(log.new_value);
const isStatusFlip = (log: AuditLog) => log.action.includes("status") && log.field_name === "status";
const isEscalation = (action: string) => action.includes("escalation") || action === "escalate";
const isSlaViolation = (log: AuditLog) => log.field_name === "sla" || (log.action.includes("automation") && log.new_value?.includes("SLA"));
const isCompliance = (log: AuditLog) => isEscalation(log.action) || isSlaViolation(log) || isOverride(log) || log.action.includes("risk");

// ── Main Component ─────────────────────────────────────────────────────

const AuditTrail = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [complianceMode, setComplianceMode] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles!audit_logs_user_id_fkey(full_name, avatar_url), decisions!audit_logs_decision_id_fkey(title)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setLogs(data as AuditLog[]);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  // ── Computed KPIs (30 days) ──

  const last30DaysCutoff = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; }, []);

  const kpis = useMemo(() => {
    const recent = logs.filter(l => new Date(l.created_at) > last30DaysCutoff);
    return {
      total: recent.length,
      statusChanges: recent.filter(l => isStatusFlip(l)).length,
      escalations: recent.filter(l => isEscalation(l.action)).length,
      slaViolations: recent.filter(l => isSlaViolation(l)).length,
      automationRuns: recent.filter(l => isAutomation(l.action)).length,
      overrides: recent.filter(l => isOverride(l)).length,
    };
  }, [logs, last30DaysCutoff]);

  // ── Governance Flags ──

  const governanceFlags = useMemo(() => {
    const flags: { title: string; detail: string; severity: "warning" | "error" }[] = [];
    // Frequent status flips per decision
    const decisionStatusChanges: Record<string, number> = {};
    const last7d = new Date(); last7d.setDate(last7d.getDate() - 7);
    logs.filter(l => new Date(l.created_at) > last7d && isStatusFlip(l)).forEach(l => {
      decisionStatusChanges[l.decision_id] = (decisionStatusChanges[l.decision_id] || 0) + 1;
    });
    Object.entries(decisionStatusChanges).forEach(([dId, count]) => {
      if (count >= 4) {
        const title = logs.find(l => l.decision_id === dId)?.decisions?.title || "Entscheidung";
        flags.push({ title: `${title}: ${count} Status-Wechsel in 7 Tagen`, detail: "Häufige Status-Wechsel deuten auf Instabilität hin.", severity: "warning" });
      }
    });
    // Overrides
    if (kpis.overrides > 0) {
      flags.push({ title: `${kpis.overrides} manuelle Overrides (30T)`, detail: "Genehmigte Entscheidungen wurden auf Draft/Review zurückgesetzt.", severity: "error" });
    }
    // Multiple escalations
    if (kpis.escalations >= 5) {
      flags.push({ title: `${kpis.escalations} Eskalationen in 30 Tagen`, detail: "Hohe Eskalationsrate deutet auf strukturelle Governance-Probleme hin.", severity: "warning" });
    }
    return flags;
  }, [logs, kpis]);

  // ── Change Statistics ──

  const stats = useMemo(() => {
    const recent = logs.filter(l => new Date(l.created_at) > last30DaysCutoff);
    // Changes per user
    const perUser: Record<string, { name: string; count: number }> = {};
    recent.forEach(l => {
      const name = l.profiles?.full_name || "System";
      if (!perUser[l.user_id]) perUser[l.user_id] = { name, count: 0 };
      perUser[l.user_id].count++;
    });
    const topUsers = Object.values(perUser).sort((a, b) => b.count - a.count).slice(0, 5);
    // Changes per decision
    const perDecision: Record<string, { title: string; count: number }> = {};
    recent.forEach(l => {
      const title = l.decisions?.title || "Unbekannt";
      if (!perDecision[l.decision_id]) perDecision[l.decision_id] = { title, count: 0 };
      perDecision[l.decision_id].count++;
    });
    const topDecisions = Object.values(perDecision).sort((a, b) => b.count - a.count).slice(0, 5);
    const avgPerDecision = Object.keys(perDecision).length > 0 ? (recent.length / Object.keys(perDecision).length).toFixed(1) : "0";
    return { topUsers, topDecisions, avgPerDecision };
  }, [logs, last30DaysCutoff]);

  // ── Audit Stability Score ──

  const stabilityScore = useMemo(() => {
    let score = 100;
    // Rework rate (overrides)
    score -= kpis.overrides * 8;
    // Status flips per decision > 3
    const recent = logs.filter(l => new Date(l.created_at) > last30DaysCutoff && isStatusFlip(l));
    const perDec: Record<string, number> = {};
    recent.forEach(l => { perDec[l.decision_id] = (perDec[l.decision_id] || 0) + 1; });
    const highFlips = Object.values(perDec).filter(v => v > 3).length;
    score -= highFlips * 5;
    // Escalation frequency
    score -= Math.min(kpis.escalations * 2, 20);
    // SLA violations
    score -= kpis.slaViolations * 6;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [kpis, logs, last30DaysCutoff]);

  // ── Filtering ──

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (complianceMode && !isCompliance(log)) return false;
      const matchSearch = search === "" ||
        (log.decisions?.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.field_name || "").toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === "all" || log.action === actionFilter;
      const matchSource = sourceFilter === "all" ||
        (sourceFilter === "automation" && isAutomation(log.action)) ||
        (sourceFilter === "manual" && !isAutomation(log.action));
      return matchSearch && matchAction && matchSource;
    });
  }, [logs, search, actionFilter, sourceFilter, complianceMode]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    filtered.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [filtered]);

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);

  const exportAuditLog = () => {
    const csv = [
      "Zeitpunkt,Benutzer,Aktion,Entscheidung,Feld,Alter Wert,Neuer Wert,Quelle",
      ...filtered.map(l => [
        new Date(l.created_at).toISOString(),
        l.profiles?.full_name || "System",
        actionConfig[l.action]?.label || l.action,
        l.decisions?.title || "",
        l.field_name || "",
        l.old_value || "",
        l.new_value || "",
        isAutomation(l.action) ? "Automation" : "Manuell",
      ].map(v => `"${v}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Audit Trail"
          subtitle="Revisionssichere Governance-Transparenz – Immutable Log"
          role="governance"
          help={{ title: "Audit Trail", description: "Lückenlose, nicht löschbare Änderungshistorie aller Entscheidungen. Filtere nach Quelle, Typ oder Compliance-Relevanz." }}
          secondaryActions={
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAuditLog}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          }
        />

        {/* ═══ LAYER 1 – DOMINANCE ═══ */}
        <HeroKpi columns={3} items={[
          { label: "Audit Stability", value: `${stabilityScore}`, icon: Gauge, sentiment: stabilityScore >= 75 ? "positive" : stabilityScore >= 50 ? "warning" : "critical" },
          { label: "Critical Changes", value: `${kpis.overrides + kpis.escalations}`, icon: AlertTriangle, sentiment: (kpis.overrides + kpis.escalations) > 0 ? "warning" : "positive" },
          { label: "Compliance", value: kpis.slaViolations === 0 && kpis.overrides === 0 ? "Konform" : "Auffällig", sentiment: kpis.slaViolations === 0 && kpis.overrides === 0 ? "positive" : "warning" },
        ]} />

        {/* ═══ LAYER 2 – POWER GRID ═══ */}
        <PowerGrid title="Audit Matrix" columns={3} items={[
          { label: "Änderungen (30T)", value: kpis.total, icon: Activity },
          { label: "Status-Änderungen", value: kpis.statusChanges, icon: CheckCircle },
          { label: "Eskalationen", value: kpis.escalations, icon: AlertTriangle, sentiment: kpis.escalations >= 5 ? "critical" : "neutral" },
          { label: "SLA-Verstöße", value: kpis.slaViolations, icon: Clock, sentiment: kpis.slaViolations > 0 ? "warning" : "positive" },
          { label: "Regel-Auslösungen", value: kpis.automationRuns, icon: Zap },
          { label: "Manuelle Overrides", value: kpis.overrides, icon: Shield, sentiment: kpis.overrides > 0 ? "critical" : "positive" },
        ]} />

        {/* ── 10. Governance Integrity Score + 7. Stats ──────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stability Score */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Audit Stability Score</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>Basiert auf: Rework-Rate, Status-Flips, Eskalationshäufigkeit, SLA-Verstöße, Override-Rate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${stabilityScore >= 75 ? "text-success" : stabilityScore >= 50 ? "text-warning" : "text-destructive"}`}>{stabilityScore}</span>
                <div className="flex-1">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${stabilityScore}%` }} transition={{ duration: 1 }}
                      className={`h-full rounded-full ${stabilityScore >= 75 ? "bg-success" : stabilityScore >= 50 ? "bg-warning" : "bg-destructive"}`} />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                <p>Overrides: -{kpis.overrides * 8}p</p>
                <p>Eskalationen: -{Math.min(kpis.escalations * 2, 20)}p</p>
                <p>SLA-Verstöße: -{kpis.slaViolations * 6}p</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Users */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Meiste Änderungen (Benutzer)</h3>
              </div>
              <div className="space-y-2">
                {stats.topUsers.length === 0 ? <p className="text-xs text-muted-foreground">Keine Daten</p> :
                  stats.topUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate">{u.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{u.count}</Badge>
                    </div>
                  ))
                }
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Ø {stats.avgPerDecision} Änderungen pro Entscheidung</p>
            </CardContent>
          </Card>

          {/* Top Decisions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Meiste Änderungen (Entscheidung)</h3>
              </div>
              <div className="space-y-2">
                {stats.topDecisions.length === 0 ? <p className="text-xs text-muted-foreground">Keine Daten</p> :
                  stats.topDecisions.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate">{d.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{d.count}</Badge>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Governance Flags ──────────────────────────────────── */}
        {governanceFlags.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">Governance-Warnungen</h3>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">{governanceFlags.length}</Badge>
              </div>
              <div className="space-y-2">
                {governanceFlags.map((flag, i) => (
                  <div key={i} className={`p-2 rounded-lg bg-background border ${flag.severity === "error" ? "border-destructive/30" : "border-warning/30"} flex items-start gap-2 text-xs`}>
                    <AlertTriangle className={`w-3 h-3 shrink-0 mt-0.5 ${flag.severity === "error" ? "text-destructive" : "text-warning"}`} />
                    <div>
                      <p className="font-medium">{flag.title}</p>
                      <p className="text-muted-foreground">{flag.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 5. Filters ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Entscheidung, Nutzer oder Feld suchen..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] h-9"><Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Alle Aktionen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              {uniqueActions.map(a => <SelectItem key={a} value={a}>{actionConfig[a]?.label || a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Alle Quellen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Quellen</SelectItem>
              <SelectItem value="manual">Manuell</SelectItem>
              <SelectItem value="automation">Automation</SelectItem>
            </SelectContent>
          </Select>
          {/* 6. Compliance Mode */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium">Compliance</span>
            <Switch checked={complianceMode} onCheckedChange={setComplianceMode} />
          </div>
          <Badge variant="outline" className="h-9 px-3 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5" />{filtered.length} Einträge
          </Badge>
        </div>

        {/* ── 9. Immutable Log Notice ──────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Immutable Log – Einträge können nicht gelöscht oder verändert werden. Alle Aktionen sind revisionssicher protokolliert mit Zeitstempel und User-ID.</span>
        </div>

        {/* ── 2. Timeline ──────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4"><Skeleton className="w-10 h-10 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <History className="w-8 h-8 text-primary opacity-60" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              {search || actionFilter !== "all" || complianceMode ? "Keine Einträge gefunden" : "Noch keine Audit-Einträge"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search || actionFilter !== "all" || complianceMode
                ? "Versuche andere Filter oder Suchbegriffe."
                : "Alle Änderungen an Entscheidungen werden hier automatisch protokolliert."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">{date}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="relative ml-5">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-1">
                    {entries.map(log => {
                      const config = actionConfig[log.action] || { label: log.action, icon: FileText, color: "text-muted-foreground" };
                      const Icon = config.icon;
                      const time = new Date(log.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                      const automated = isAutomation(log.action);
                      const override = isOverride(log);

                      return (
                        <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="relative flex items-start gap-4 py-3 group cursor-pointer" onClick={() => setSelectedLog(log)}>
                            <div className={`relative z-10 w-[30px] h-[30px] rounded-full border-2 border-background flex items-center justify-center shrink-0 shadow-sm ring-1 ring-border ${automated ? "bg-primary/10" : "bg-card"}`}>
                              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                            </div>

                            <div className={`flex-1 min-w-0 border rounded-xl p-3.5 group-hover:border-primary/20 transition-colors ${override ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <UserAvatar avatarUrl={log.profiles?.avatar_url || null} fullName={log.profiles?.full_name} size="sm" />
                                  <span className="text-sm font-medium">{automated ? "Governance Engine" : log.profiles?.full_name || "System"}</span>
                                  <Badge variant="outline" className={`text-[10px] ${config.color} border-current/20`}>{config.label}</Badge>
                                  {/* Source badge */}
                                  <Badge variant={automated ? "default" : "outline"} className={`text-[10px] ${automated ? "bg-primary/10 text-primary border-primary/20" : ""}`}>
                                    {automated ? "⚡ Automation" : "✋ Manuell"}
                                  </Badge>
                                  {override && <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Override</Badge>}
                                </div>
                                <span className="text-[11px] text-muted-foreground shrink-0">{time}</span>
                              </div>

                              {log.decisions?.title && (
                                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                                  <FileText className="w-3 h-3 inline mr-1" />{log.decisions.title}
                                </p>
                              )}

                              {log.field_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Feld: <span className="font-medium text-foreground">{log.field_name}</span>
                                </p>
                              )}

                              {(log.old_value || log.new_value) && (
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                                  {log.old_value && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through truncate max-w-[200px]">{log.old_value}</span>}
                                  {log.old_value && log.new_value && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                                  {log.new_value && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[200px]">{log.new_value}</span>}
                                </div>
                              )}

                              {/* Automation source detail */}
                              {automated && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5" /> Ausgelöst durch Automatisierungsregel
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Detail / Diff Dialog ──────────────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Audit-Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Zeitpunkt</p>
                  <p className="font-medium">{new Date(selectedLog.created_at).toLocaleString("de-DE")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Benutzer</p>
                  <p className="font-medium">{isAutomation(selectedLog.action) ? "Governance Engine" : selectedLog.profiles?.full_name || "System"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Aktion</p>
                  <p className="font-medium">{actionConfig[selectedLog.action]?.label || selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Quelle</p>
                  <Badge variant="outline" className="text-[10px]">{isAutomation(selectedLog.action) ? "⚡ Automation" : "✋ Manuell"}</Badge>
                </div>
              </div>

              {selectedLog.decisions?.title && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">Entscheidung</p>
                  <p className="font-medium">{selectedLog.decisions.title}</p>
                </div>
              )}

              {selectedLog.field_name && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">Geändertes Feld</p>
                  <p className="font-medium">{selectedLog.field_name}</p>
                </div>
              )}

              {/* Diff View */}
              {(selectedLog.old_value || selectedLog.new_value) && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                    Vorher / Nachher
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Vorher</p>
                      <p className="text-xs font-mono break-all bg-destructive/5 text-destructive rounded p-2">{selectedLog.old_value || "—"}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Nachher</p>
                      <p className="text-xs font-mono break-all bg-primary/5 text-primary rounded p-2">{selectedLog.new_value || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="rounded-lg border border-border p-3 bg-muted/20 text-[10px] text-muted-foreground space-y-1">
                <p>Log-ID: <span className="font-mono">{selectedLog.id}</span></p>
                <p>Decision-ID: <span className="font-mono">{selectedLog.decision_id}</span></p>
                <p>User-ID: <span className="font-mono">{selectedLog.user_id}</span></p>
                <div className="flex items-center gap-1 mt-2">
                  <Shield className="w-3 h-3" />
                  <span>Immutable – Dieser Eintrag kann nicht verändert oder gelöscht werden.</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AuditTrail;

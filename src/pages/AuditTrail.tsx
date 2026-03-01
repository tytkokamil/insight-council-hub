import { useState, useEffect, useMemo, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useTranslation } from "react-i18next";
import {
  History, ArrowRight, Search, Filter, FileText, CheckCircle, XCircle, Sparkles,
  Pencil, Plus, AlertTriangle, RotateCcw, Archive, Share2, Zap, Users, Target,
  MessageSquare, Shield, Activity, Clock, TrendingUp, TrendingDown, Eye, Download,
  BarChart3, Gauge, Info, ChevronDown, ChevronRight, CalendarIcon, Layers, Fingerprint
} from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import UserAvatar from "@/components/shared/UserAvatar";
import { eventLabels, EventTypes } from "@/lib/eventTaxonomy";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
// jsPDF loaded dynamically on export
import DiffViewer from "@/components/audit/DiffViewer";

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
  change_reason: string | null;
  signed_by: string | null;
  signed_at: string | null;
  signature_method: string | null;
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
  created: { label: eventLabels[EventTypes.DECISION_CREATED] || "Created", icon: Plus, color: "text-primary", source: "manual" },
  status_changed: { label: eventLabels[EventTypes.DECISION_STATUS_CHANGED] || "Status changed", icon: CheckCircle, color: "text-accent-foreground", source: "manual" },
  review_approved: { label: eventLabels[EventTypes.REVIEW_APPROVED] || "Approved", icon: CheckCircle, color: "text-success", source: "manual" },
  review_rejected: { label: eventLabels[EventTypes.REVIEW_REJECTED] || "Rejected", icon: XCircle, color: "text-destructive", source: "manual" },
  ai_analysis: { label: "AI Analysis", icon: Sparkles, color: "text-primary", source: "automation" },
  field_updated: { label: eventLabels[EventTypes.DECISION_UPDATED] || "Updated", icon: Pencil, color: "text-muted-foreground", source: "manual" },
  decision_edited: { label: eventLabels[EventTypes.DECISION_UPDATED] || "Edited", icon: Pencil, color: "text-primary", source: "manual" },
  escalation: { label: eventLabels[EventTypes.ESCALATION_TRIGGERED] || "Escalated", icon: AlertTriangle, color: "text-destructive", source: "automation" },
};

const isAutomation = (action: string) => actionConfig[action]?.source === "automation" || action.includes("automation") || action.includes("escalation");
const isOverride = (log: AuditLog) => log.field_name === "status" && log.old_value && ["approved", "implemented"].includes(log.old_value) && log.new_value && ["draft", "review"].includes(log.new_value);
const isStatusFlip = (log: AuditLog) => log.action.includes("status") && log.field_name === "status";
const isEscalation = (action: string) => action.includes("escalation") || action === "escalate";
const isSlaViolation = (log: AuditLog) => log.field_name === "sla" || (log.action.includes("automation") && log.new_value?.includes("SLA"));
const isCompliance = (log: AuditLog) => isEscalation(log.action) || isSlaViolation(log) || isOverride(log) || log.action.includes("risk");

// ── Helpers ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

/** Format a value: if it looks like an ISO timestamp, format it human-readable */
function formatValue(val: string | null, locale: string): string {
  if (!val) return "—";
  // ISO timestamp pattern
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString(locale === "de-DE" ? "de-DE" : "en-US", {
          day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
      }
    } catch { /* fall through */ }
  }
  // Date-only pattern
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    try {
      const d = new Date(val + "T00:00:00");
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(locale === "de-DE" ? "de-DE" : "en-US", {
          day: "numeric", month: "long", year: "numeric",
        });
      }
    } catch { /* fall through */ }
  }
  return val;
}

// ── Main Component ─────────────────────────────────────────────────────

const AuditTrail = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [complianceMode, setComplianceMode] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [groupByDecision, setGroupByDecision] = useState(false);
  const locale = i18n.language === "de" ? "de-DE" : "en-US";
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles!audit_logs_user_id_fkey(full_name, avatar_url), decisions!audit_logs_decision_id_fkey(title)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (data) setLogs(data as AuditLog[]);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

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

  const governanceFlags = useMemo(() => {
    const flags: { title: string; detail: string; severity: "warning" | "error" }[] = [];
    const decisionStatusChanges: Record<string, number> = {};
    const last7d = new Date(); last7d.setDate(last7d.getDate() - 7);
    logs.filter(l => new Date(l.created_at) > last7d && isStatusFlip(l)).forEach(l => {
      decisionStatusChanges[l.decision_id] = (decisionStatusChanges[l.decision_id] || 0) + 1;
    });
    Object.entries(decisionStatusChanges).forEach(([dId, count]) => {
      if (count >= 4) {
        const title = logs.find(l => l.decision_id === dId)?.decisions?.title || t("auditTrail.decision");
        flags.push({ title: t("auditTrail.statusFlipsWarning", { title, count }), detail: t("auditTrail.statusFlipsDetail"), severity: "warning" });
      }
    });
    if (kpis.overrides > 0) {
      flags.push({ title: t("auditTrail.overridesWarning", { count: kpis.overrides }), detail: t("auditTrail.overridesDetail"), severity: "error" });
    }
    if (kpis.escalations >= 5) {
      flags.push({ title: t("auditTrail.escalationsWarning", { count: kpis.escalations }), detail: t("auditTrail.escalationsDetail"), severity: "warning" });
    }
    return flags;
  }, [logs, kpis, t]);

  const stats = useMemo(() => {
    const recent = logs.filter(l => new Date(l.created_at) > last30DaysCutoff);
    const perUser: Record<string, { name: string; count: number }> = {};
    recent.forEach(l => {
      const name = l.profiles?.full_name || t("auditTrail.system");
      if (!perUser[l.user_id]) perUser[l.user_id] = { name, count: 0 };
      perUser[l.user_id].count++;
    });
    const topUsers = Object.values(perUser).sort((a, b) => b.count - a.count).slice(0, 5);
    const perDecision: Record<string, { title: string; count: number }> = {};
    recent.forEach(l => {
      const title = l.decisions?.title || "—";
      if (!perDecision[l.decision_id]) perDecision[l.decision_id] = { title, count: 0 };
      perDecision[l.decision_id].count++;
    });
    const topDecisions = Object.values(perDecision).sort((a, b) => b.count - a.count).slice(0, 5);
    const avgPerDecision = Object.keys(perDecision).length > 0 ? (recent.length / Object.keys(perDecision).length).toFixed(1) : "0";
    return { topUsers, topDecisions, avgPerDecision };
  }, [logs, last30DaysCutoff, t]);

  const stabilityScore = useMemo(() => {
    let score = 100;
    score -= kpis.overrides * 8;
    const recent = logs.filter(l => new Date(l.created_at) > last30DaysCutoff && isStatusFlip(l));
    const perDec: Record<string, number> = {};
    recent.forEach(l => { perDec[l.decision_id] = (perDec[l.decision_id] || 0) + 1; });
    const highFlips = Object.values(perDec).filter(v => v > 3).length;
    score -= highFlips * 5;
    score -= Math.min(kpis.escalations * 2, 20);
    score -= kpis.slaViolations * 6;
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [kpis, logs, last30DaysCutoff]);

  // ── Filtering (with date range) ──
  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (complianceMode && !isCompliance(log)) return false;
      // Date range filter
      const logDate = new Date(log.created_at);
      if (dateFrom && logDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
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
  }, [logs, search, actionFilter, sourceFilter, complianceMode, dateFrom, dateTo]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, actionFilter, sourceFilter, complianceMode, dateFrom, dateTo, groupByDecision]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // ── Grouping (date-based or decision-based) ──
  const grouped = useMemo(() => {
    const source = groupByDecision ? filtered : paginatedLogs;
    const groups: Record<string, AuditLog[]> = {};
    if (groupByDecision) {
      source.forEach(log => {
        const key = log.decisions?.title || log.decision_id;
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
      });
    } else {
      source.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
        if (!groups[date]) groups[date] = [];
        groups[date].push(log);
      });
    }
    return groups;
  }, [groupByDecision ? filtered : paginatedLogs, locale, groupByDecision]);

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);

  // ── Exports ──
  const exportAuditLog = () => {
    const csv = [
      [t("auditTrail.csvTimestamp"), t("auditTrail.csvUser"), t("auditTrail.csvAction"), t("auditTrail.csvDecision"), t("auditTrail.csvField"), t("auditTrail.csvOldValue"), t("auditTrail.csvNewValue"), t("auditTrail.csvSource")].join(","),
      ...filtered.map(l => [
        new Date(l.created_at).toISOString(),
        l.profiles?.full_name || t("auditTrail.system"),
        actionConfig[l.action]?.label || l.action,
        l.decisions?.title || "",
        l.field_name || "",
        l.old_value || "",
        l.new_value || "",
        isAutomation(l.action) ? t("auditTrail.automation") : t("auditTrail.manual"),
      ].map(v => `"${v}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Decivio-Audit-Trail-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const { addPdfHeader, addPdfFooter } = await import("@/lib/pdfBranding");
    const doc = new jsPDF({ orientation: "landscape" });
    const dateRange = dateFrom || dateTo
      ? `${dateFrom ? format(dateFrom, "dd.MM.yyyy") : "…"} – ${dateTo ? format(dateTo, "dd.MM.yyyy") : "…"}`
      : t("auditTrail.allTime");
    const y = addPdfHeader(doc, t("auditTrail.title"), `${filtered.length} ${t("auditTrail.entries", { count: filtered.length })}  |  ${t("auditTrail.period")}: ${dateRange}`, "Audit Trail");

    const head = [[t("auditTrail.csvTimestamp"), t("auditTrail.csvUser"), t("auditTrail.csvAction"), t("auditTrail.csvDecision"), t("auditTrail.csvField"), t("auditTrail.csvOldValue"), t("auditTrail.csvNewValue"), t("auditTrail.csvSource")]];
    const body = filtered.map(l => [
      new Date(l.created_at).toLocaleString(locale),
      isAutomation(l.action) ? t("auditTrail.governanceEngine") : l.profiles?.full_name || t("auditTrail.system"),
      actionConfig[l.action]?.label || l.action,
      l.decisions?.title || "",
      l.field_name || "",
      formatValue(l.old_value, locale),
      formatValue(l.new_value, locale),
      isAutomation(l.action) ? t("auditTrail.automation") : t("auditTrail.manual"),
    ]);
    autoTable(doc, { head, body, startY: y, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [15, 23, 42], textColor: 255 } });

    // Add cryptographic verification info
    const lastLog = filtered[filtered.length - 1] as any;
    const lastHash = lastLog?.integrity_hash;
    if (lastHash) {
      const pageCount = doc.getNumberOfPages();
      doc.setPage(pageCount);
      const ph = doc.internal.pageSize.getHeight();
      const pw = doc.internal.pageSize.getWidth();
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(130, 130, 130);
      const secText = i18n.language === "de"
        ? `Dieser Audit Trail ist kryptographisch gesichert. Verifizierungscode: ${lastHash.substring(0, 16)}...`
        : `This audit trail is cryptographically secured. Verification code: ${lastHash.substring(0, 16)}...`;
      doc.text(secText, pw / 2, ph - 20, { align: "center" });
    }

    addPdfFooter(doc);
    doc.save(`Decivio-Audit-Trail-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── Render helpers ──
  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(locale, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const renderLogEntry = (log: AuditLog) => {
    const config = actionConfig[log.action] || { label: log.action, icon: FileText, color: "text-muted-foreground" };
    const Icon = config.icon;
    const time = new Date(log.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const automated = isAutomation(log.action);
    const override = isOverride(log);

    return (
      <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="relative flex items-start gap-4 py-3 group cursor-pointer" onClick={() => setSelectedLog(log)}>
          <div className={`relative z-10 w-[30px] h-[30px] rounded-full border-2 border-background flex items-center justify-center shrink-0 shadow-sm ring-1 ring-border ${automated ? "bg-primary/10" : "bg-card"}`}>
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
          </div>

          <div className={`flex-1 min-w-0 border rounded-xl p-3.5 group-hover:border-primary/20 transition-colors ${override ? "border-destructive/30 bg-destructive/5" : "border-border/60 bg-card"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <UserAvatar avatarUrl={log.profiles?.avatar_url || null} fullName={log.profiles?.full_name} size="sm" />
                <span className="text-sm font-medium">{automated ? t("auditTrail.governanceEngine") : log.profiles?.full_name || t("auditTrail.system")}</span>
                <Badge variant="outline" className={`text-[10px] ${config.color} border-current/20`}>{config.label}</Badge>
                <Badge variant={automated ? "default" : "outline"} className={`text-[10px] ${automated ? "bg-primary/10 text-primary border-primary/20" : ""}`}>
                  {automated ? t("auditTrail.automationBadge") : t("auditTrail.manualBadge")}
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
                {t("auditTrail.field")}: <span className="font-medium text-foreground">{log.field_name}</span>
              </p>
            )}

            {(log.old_value || log.new_value) && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                {log.old_value && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through truncate max-w-[200px]">{formatValue(log.old_value, locale)}</span>}
                {log.old_value && log.new_value && <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                {log.new_value && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[200px]">{formatValue(log.new_value, locale)}</span>}
              </div>
            )}

            {log.change_reason && (
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1 italic">
                <MessageSquare className="w-2.5 h-2.5" /> „{log.change_reason}"
              </p>
            )}

            {log.signed_by && (
              <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> {t("audit.signedLabel")}
                {log.signature_method === "password" ? " 🔐" : " ✓"}
              </p>
            )}

            {automated && (
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> {t("auditTrail.triggeredByRule")}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={t("auditTrail.title")}
          subtitle={t("auditTrail.subtitle")}
          role="governance"
          help={{ title: t("auditTrail.title"), description: t("auditTrail.helpDesc") }}
          secondaryActions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportAuditLog}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPdf}>
                <FileText className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t("auditTrail.changes30d"), value: kpis.total, icon: <Activity className="w-4 h-4 text-primary" /> },
            { label: t("auditTrail.statusChanges"), value: kpis.statusChanges, icon: <CheckCircle className="w-4 h-4 text-accent-foreground" /> },
            { label: t("auditTrail.escalations"), value: kpis.escalations, icon: <AlertTriangle className="w-4 h-4 text-destructive" />, highlight: kpis.escalations >= 5 },
            { label: t("auditTrail.slaViolations"), value: kpis.slaViolations, icon: <Clock className="w-4 h-4 text-warning" />, highlight: kpis.slaViolations > 0 },
            { label: t("auditTrail.ruleExecutions"), value: kpis.automationRuns, icon: <Zap className="w-4 h-4 text-primary" /> },
            { label: t("auditTrail.manualOverrides"), value: kpis.overrides, icon: <Shield className="w-4 h-4 text-destructive" />, highlight: kpis.overrides > 0 },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={kpi.highlight ? "border-destructive/30 bg-destructive/5" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    {kpi.icon}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${kpi.highlight ? "text-destructive" : ""}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {logs.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("auditTrail.stabilityScore")}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs"><p>{t("auditTrail.stabilityTooltip")}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {logs.length >= 10 ? (
                <>
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
                    <p>{t("auditTrail.overridesImpact", { points: kpis.overrides * 8 })}</p>
                    <p>{t("auditTrail.escalationsImpact", { points: Math.min(kpis.escalations * 2, 20) })}</p>
                    <p>{t("auditTrail.slaImpact", { points: kpis.slaViolations * 6 })}</p>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-4xl font-bold text-muted-foreground">—</span>
                  <p className="text-xs text-muted-foreground mt-2">{t("auditTrail.scoreMinEntries", { defaultValue: "Score verfügbar ab 10 Einträgen." })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("auditTrail.topUsers")}</h3>
              </div>
              <div className="space-y-2">
                {stats.topUsers.length === 0 ? <p className="text-xs text-muted-foreground">{t("auditTrail.noData")}</p> :
                  stats.topUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate">{u.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{u.count}</Badge>
                    </div>
                  ))
                }
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{t("auditTrail.avgPerDecision", { avg: stats.avgPerDecision })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("auditTrail.topDecisions")}</h3>
              </div>
              <div className="space-y-2">
                {stats.topDecisions.length === 0 ? <p className="text-xs text-muted-foreground">{t("auditTrail.noData")}</p> :
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
        </div>}

        {governanceFlags.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">{t("auditTrail.govWarnings")}</h3>
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

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t("auditTrail.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] h-9"><Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder={t("auditTrail.allActions")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("auditTrail.allActions")}</SelectItem>
              {uniqueActions.map(a => <SelectItem key={a} value={a}>{actionConfig[a]?.label || a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder={t("auditTrail.allSources")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("auditTrail.allSources")}</SelectItem>
              <SelectItem value="manual">{t("auditTrail.manual")}</SelectItem>
              <SelectItem value="automation">{t("auditTrail.automation")}</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 gap-1.5 text-xs", (dateFrom || dateTo) && "border-primary text-primary")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateFrom ? format(dateFrom, "dd.MM.yy") : t("auditTrail.from")}
                {" – "}
                {dateTo ? format(dateTo, "dd.MM.yy") : t("auditTrail.to")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex" align="start">
              <div className="p-2 border-r border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground px-3 pt-1 mb-1">{t("auditTrail.from")}</p>
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={dateFnsLocale}
                  className={cn("p-3 pointer-events-auto")} disabled={(d) => dateTo ? d > dateTo : false} />
              </div>
              <div className="p-2">
                <p className="text-[10px] font-semibold text-muted-foreground px-3 pt-1 mb-1">{t("auditTrail.to")}</p>
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={dateFnsLocale}
                  className={cn("p-3 pointer-events-auto")} disabled={(d) => dateFrom ? d < dateFrom : false} />
              </div>
            </PopoverContent>
          </Popover>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              ✕ {t("auditTrail.clearDates")}
            </Button>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium">{t("auditTrail.compliance")}</span>
                  <Switch checked={complianceMode} onCheckedChange={setComplianceMode} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <p>{t("auditTrail.complianceTooltip", { defaultValue: "Zeigt nur compliance-relevante Ereignisse: Genehmigungen, Ablehnungen, Eskalationen und manuelle Overrides." })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant={groupByDecision ? "default" : "outline"} size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setGroupByDecision(!groupByDecision)}>
            <Layers className="w-3.5 h-3.5" /> {t("auditTrail.groupByDecision")}
          </Button>

          <Badge variant="outline" className="h-9 px-3 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5" />{t("auditTrail.entries", { count: filtered.length })}
          </Badge>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>{t("auditTrail.immutableNotice")}</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4"><Skeleton className="w-10 h-10 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyAnalysisState
            icon={History}
            title={search || actionFilter !== "all" || complianceMode || dateFrom || dateTo ? t("auditTrail.noEntries") : t("auditTrail.noAuditYet", { defaultValue: "Noch keine Audit-Einträge" })}
            description={search || actionFilter !== "all" || complianceMode || dateFrom || dateTo ? t("auditTrail.tryOtherFilters") : t("auditTrail.autoLogged", { defaultValue: "Jede Änderung an Entscheidungen wird automatisch und revisionssicher protokolliert." })}
          />
        ) : (
          <>
            <div className="space-y-8">
              {Object.entries(grouped).map(([groupKey, entries]) => (
                <div key={groupKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                      {groupByDecision && <FileText className="w-3 h-3 inline mr-1" />}
                      {groupKey}
                      {groupByDecision && <Badge variant="outline" className="ml-2 text-[10px]">{entries.length}</Badge>}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="relative ml-5">
                    <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-1">
                      {entries.map(log => renderLogEntry(log))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!groupByDecision && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  ← {t("auditTrail.prev")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("auditTrail.pageOf", { page, total: totalPages })}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  {t("auditTrail.next")} →
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t("auditTrail.auditDetail")}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.timestamp")}</p>
                  <p className="font-medium">{formatTimestamp(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.user")}</p>
                  <p className="font-medium">{isAutomation(selectedLog.action) ? t("auditTrail.governanceEngine") : selectedLog.profiles?.full_name || t("auditTrail.system")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.action")}</p>
                  <p className="font-medium">{actionConfig[selectedLog.action]?.label || selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.source")}</p>
                  <Badge variant="outline" className={`text-[10px] ${isAutomation(selectedLog.action) ? "bg-primary/10 text-primary border-primary/20" : ""}`}>
                    {isAutomation(selectedLog.action) ? t("auditTrail.automationBadge") : t("auditTrail.manualBadge")}
                  </Badge>
                </div>
              </div>

              {selectedLog.decisions?.title && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.decision")}</p>
                  <p className="font-medium">{selectedLog.decisions.title}</p>
                </div>
              )}

              {selectedLog.field_name && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">{t("auditTrail.changedField")}</p>
                  <p className="font-medium">{selectedLog.field_name}</p>
                </div>
              )}

              {selectedLog.change_reason && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-0.5">{t("audit.reasonLabel")}</p>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/60 italic">
                    <MessageSquare className="w-3 h-3 inline mr-1 text-muted-foreground" />
                    „{selectedLog.change_reason}"
                  </div>
                </div>
              )}

              {selectedLog.signed_by && (
                <div className="text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <Fingerprint className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-primary">{t("audit.signedLabel")}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("audit.signatureMethod")}: {selectedLog.signature_method === "password" ? t("audit.methodPassword") : t("audit.methodAcknowledge")}
                        {selectedLog.signed_at && ` · ${formatTimestamp(selectedLog.signed_at)}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.old_value && selectedLog.new_value && selectedLog.old_value.length > 30 && selectedLog.new_value.length > 30 ? (
                <DiffViewer oldText={selectedLog.old_value} newText={selectedLog.new_value} />
              ) : (selectedLog.old_value || selectedLog.new_value) && (
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <div className="bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
                    {t("auditTrail.beforeAfter")}
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{t("auditTrail.before")}</p>
                      <p className="text-xs font-mono break-all bg-destructive/5 text-destructive rounded p-2">{formatValue(selectedLog.old_value, locale)}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{t("auditTrail.after")}</p>
                      <p className="text-xs font-mono break-all bg-primary/5 text-primary rounded p-2">{formatValue(selectedLog.new_value, locale)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border/60 p-3 bg-muted/20 text-[10px] text-muted-foreground space-y-1">
                <p>Log-ID: <span className="font-mono">{selectedLog.id}</span></p>
                <p>Decision-ID: <span className="font-mono">{selectedLog.decision_id}</span></p>
                <p>User-ID: <span className="font-mono">{selectedLog.user_id}</span></p>
                <div className="flex items-center gap-1 mt-2">
                  <Shield className="w-3 h-3" />
                  <span>{t("auditTrail.immutableEntry")}</span>
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

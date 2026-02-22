import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import {
  Archive, RotateCcw, Trash2, Download, Search, AlertTriangle, Clock, Shield,
  ChevronRight, FileText, Filter, BarChart3, Eye, EyeOff, BookOpen, Target,
  TrendingDown, CalendarDays, Users, DollarSign, Activity, CheckCircle2, XCircle,
  Zap, Lock, Unlock, ChevronDown, X, FileJson, FileSpreadsheet, ClipboardList,
  Timer, ShieldCheck, ArrowRight, Info, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { exportAllDataAsJSON } from "@/lib/exportAllData";
import { EventTypes } from "@/lib/eventTaxonomy";

const priorityLabels: Record<string, string> = { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" };
const categoryLabels: Record<string, string> = { strategic: "Strategisch", budget: "Budget", hr: "Personal", technical: "Technisch", operational: "Operativ", marketing: "Marketing" };
const statusLabels: Record<string, string> = { draft: "Entwurf", proposed: "Vorgeschlagen", review: "In Review", approved: "Genehmigt", implemented: "Umgesetzt", rejected: "Abgelehnt", archived: "Archiviert", cancelled: "Abgebrochen", superseded: "Ersetzt" };

const archiveReasons = [
  { value: "completed", label: "Abgeschlossen", icon: CheckCircle2 },
  { value: "superseded", label: "Ersetzt durch neue Entscheidung", icon: RotateCcw },
  { value: "rejected", label: "Abgelehnt", icon: XCircle },
  { value: "compliance", label: "Compliance abgeschlossen", icon: ShieldCheck },
  { value: "auto", label: "Automatisch nach Retention Policy", icon: Clock },
];

const deleteReasons = [
  { value: "privacy", label: "Datenschutzanfrage" },
  { value: "wrong", label: "Falsche Anlage" },
  { value: "duplicate", label: "Dublette" },
  { value: "test", label: "Test-Daten" },
];

type Tab = "archive" | "trash" | "retention" | "export";

const ArchivePage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("archive");
  const [archived, setArchived] = useState<any[]>([]);
  const [deleted, setDeleted] = useState<any[]>([]);
  const [allDecisions, setAllDecisions] = useState<any[]>([]);
  const [lessonsData, setLessonsData] = useState<any[]>([]);
  const [risksLinked, setRisksLinked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Retention config
  const [retentionEnabled, setRetentionEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(90);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null);
  const [savingRetention, setSavingRetention] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportScope, setExportScope] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [archRes, trashRes, roleRes, retRes, allDecRes, lessonsRes, riskLinksRes] = await Promise.all([
      supabase.from("decisions").select("*").eq("status", "archived").is("deleted_at", null).order("archived_at", { ascending: false }),
      supabase.from("decisions").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
      supabase.from("data_retention_config").select("*").limit(1).single(),
      supabase.from("decisions").select("*").is("deleted_at", null),
      supabase.from("lessons_learned").select("*"),
      supabase.from("risk_decision_links").select("*"),
    ]);
    setArchived(archRes.data || []);
    setDeleted(trashRes.data || []);
    setAllDecisions(allDecRes.data || []);
    setLessonsData(lessonsRes.data || []);
    setRisksLinked(riskLinksRes.data || []);
    const role = roleRes.data?.role;
    const admin = role === "org_owner" || role === "org_admin";
    setIsAdmin(admin);
    setIsOrgOwner(role === "org_owner");
    if (retRes.data) {
      setRetentionEnabled(retRes.data.enabled);
      setAutoArchiveDays(retRes.data.auto_archive_days);
      setAutoDeleteDays(retRes.data.auto_delete_archived_days);
    }
    setLoading(false);
  };

  const loadAuditLogs = async (decisionId: string) => {
    const { data } = await supabase.from("audit_logs").select("*").eq("decision_id", decisionId).order("created_at", { ascending: false });
    setAuditLogs(data || []);
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const archivedCount = archived.length;
    const implementedDecisions = allDecisions.filter(d => d.status === "implemented" || d.status === "archived");
    const withLessons = implementedDecisions.filter(d => lessonsData.some(l => l.decision_id === d.id));
    const docRate = implementedDecisions.length > 0 ? Math.round((withLessons.length / implementedDecisions.length) * 100) : 0;
    const withRisk = archived.filter(d => risksLinked.some(r => r.decision_id === d.id));
    const avgArchiveDays = archived.length > 0
      ? Math.round(archived.reduce((sum, d) => {
          if (d.archived_at && d.created_at) {
            return sum + differenceInDays(new Date(d.archived_at), new Date(d.created_at));
          }
          return sum;
        }, 0) / archived.length)
      : 0;

    return {
      archivedCount,
      avgArchiveDays,
      docRate,
      withRiskPercent: archivedCount > 0 ? Math.round((withRisk.length / archivedCount) * 100) : 0,
      withLessonsCount: withLessons.length,
      implementedCount: implementedDecisions.length,
    };
  }, [archived, allDecisions, lessonsData, risksLinked]);

  // Filtered list
  const currentList = tab === "trash" ? deleted : archived;
  const filtered = useMemo(() => {
    let list = currentList;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q));
    }
    if (filterCategory !== "all") list = list.filter(d => d.category === filterCategory);
    if (filterPriority !== "all") list = list.filter(d => d.priority === filterPriority);
    if (filterRisk !== "all") {
      if (filterRisk === "high") list = list.filter(d => (d.ai_risk_score || 0) >= 15);
      if (filterRisk === "medium") list = list.filter(d => (d.ai_risk_score || 0) >= 8 && (d.ai_risk_score || 0) < 15);
      if (filterRisk === "low") list = list.filter(d => (d.ai_risk_score || 0) < 8);
    }
    return list;
  }, [currentList, search, filterCategory, filterPriority, filterRisk]);

  // Archive analytics
  const analytics = useMemo(() => {
    const reopenCount = 0; // would track via audit_logs status changes from archived back
    const lessonsQuote = archived.length > 0
      ? Math.round((archived.filter(d => lessonsData.some(l => l.decision_id === d.id)).length / archived.length) * 100)
      : 0;
    const totalImpact = archived.reduce((s, d) => s + (d.actual_impact_score || 0), 0);
    return { reopenCount, lessonsQuote, totalImpact };
  }, [archived, lessonsData]);

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("decisions").update({ status: "implemented" as any, archived_at: null, deleted_at: null } as any).eq("id", id);
    if (error) { toast.error("Fehler beim Wiederherstellen"); return; }
    if (user) {
      await supabase.from("audit_logs").insert({
        decision_id: id, user_id: user.id, action: EventTypes.DECISION_RESTORED,
        field_name: "deleted_at", old_value: "soft-deleted", new_value: null,
      });
    }
    toast.success("Entscheidung wiederhergestellt");
    fetchData();
    setSelectedIds(prev => { prev.delete(id); return new Set(prev); });
  };

  const handleBulkRestore = async () => {
    for (const id of selectedIds) {
      await supabase.from("decisions").update({ status: "implemented" as any, archived_at: null, deleted_at: null } as any).eq("id", id);
    }
    toast.success(`${selectedIds.size} Entscheidung(en) wiederhergestellt`);
    setSelectedIds(new Set());
    fetchData();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Entscheidung UNWIDERRUFLICH löschen? Audit-Einträge bleiben erhalten.")) return;
    const { error } = await supabase.from("decisions").delete().eq("id", id);
    if (error) { toast.error("Fehler beim Löschen – nur Org-Admins können endgültig löschen."); return; }
    toast.success("Entscheidung endgültig gelöscht");
    fetchData();
  };

  const handleSaveRetention = async () => {
    if (!user) return;
    setSavingRetention(true);
    const payload = {
      enabled: retentionEnabled, auto_archive_days: autoArchiveDays,
      auto_delete_archived_days: autoDeleteDays, updated_by: user.id, updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase.from("data_retention_config").select("id").limit(1).single();
    if (existing) {
      await supabase.from("data_retention_config").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("data_retention_config").insert(payload);
    }
    toast.success("Retention Policy gespeichert");
    setSavingRetention(false);
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      await exportAllDataAsJSON();
      toast.success("Daten exportiert");
    } catch { toast.error("Export fehlgeschlagen"); }
    setExporting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getArchiveReason = (d: any) => {
    if (d.superseded_by) return archiveReasons[1];
    if (d.status === "rejected") return archiveReasons[2];
    if (d.status === "archived" && d.cancelled_at) return archiveReasons[3];
    return archiveReasons[0];
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";
  const selectClass = "h-8 px-2 rounded-md bg-background border border-input text-xs focus:border-foreground focus:outline-none transition-colors";

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "archive", label: "Archiv", icon: Archive, count: archived.length },
    { key: "trash", label: "Papierkorb", icon: Trash2, count: deleted.length },
    { key: "retention", label: "Retention Policy", icon: Clock },
    { key: "export", label: "Daten-Export", icon: Download },
  ];

  // ── KPI Bar ──
  const renderKpiBar = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {[
        { label: "Archiviert", value: kpis.archivedCount, icon: Archive, color: "text-primary" },
        { label: "Ø Tage bis Archiv", value: `${kpis.avgArchiveDays}d`, icon: Timer, color: "text-muted-foreground" },
        { label: "Lessons verknüpft", value: `${kpis.docRate}%`, icon: BookOpen, color: kpis.docRate >= 70 ? "text-success" : kpis.docRate >= 40 ? "text-warning" : "text-destructive" },
        { label: "Mit Risiko", value: `${kpis.withRiskPercent}%`, icon: AlertTriangle, color: "text-warning" },
        { label: "Im Papierkorb", value: deleted.length, icon: Trash2, color: "text-muted-foreground" },
        { label: "Umgesetzt gesamt", value: kpis.implementedCount, icon: CheckCircle2, color: "text-success" },
      ].map((kpi, i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-1">
            <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
          </div>
          <p className="text-lg font-semibold tracking-tight">{kpi.value}</p>
        </div>
      ))}
    </div>
  );

  // ── Decision Detail Drawer ──
  const renderDetailDrawer = () => {
    if (!selectedDecision) return null;
    const d = selectedDecision;
    const reason = getArchiveReason(d);
    const hasLessons = lessonsData.filter(l => l.decision_id === d.id);
    const hasRiskLinks = risksLinked.filter(r => r.decision_id === d.id);
    const durationDays = d.archived_at && d.created_at ? differenceInDays(new Date(d.archived_at), new Date(d.created_at)) : null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold">Decision Traceability</h2>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedDecision(null); setAuditLogs([]); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-2">{d.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] || d.category}</Badge>
                <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority] || d.priority}</Badge>
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  <reason.icon className="w-3 h-3 mr-1" />{reason.label}
                </Badge>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Gesamtdauer", value: durationDays !== null ? `${durationDays} Tage` : "–" },
                { label: "Risk Score", value: d.ai_risk_score ?? 0 },
                { label: "Impact Score", value: d.actual_impact_score ?? d.ai_impact_score ?? 0 },
                { label: "Lessons", value: hasLessons.length },
                { label: "Risiko-Links", value: hasRiskLinks.length },
                { label: "Finaler Status", value: statusLabels[d.status] || d.status },
              ].map((m, i) => (
                <div key={i} className="p-2.5 rounded-md border border-border bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <p className="text-sm font-semibold mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {d.description && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Beschreibung</h4>
                <p className="text-sm text-foreground/80">{d.description}</p>
              </div>
            )}

            {/* Outcome */}
            {d.outcome && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Ergebnis</h4>
                <div className="p-3 rounded-md border border-border bg-muted/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    {d.outcome_type === "successful" && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                    {d.outcome_type === "partial" && <AlertCircle className="w-3.5 h-3.5 text-warning" />}
                    {d.outcome_type === "failed" && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                    <span className="text-xs font-medium capitalize">{d.outcome_type || "Nicht bewertet"}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{d.outcome}</p>
                </div>
              </div>
            )}

            {/* Lessons */}
            {hasLessons.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Lessons Learned ({hasLessons.length})</h4>
                <div className="space-y-2">
                  {hasLessons.map(l => (
                    <div key={l.id} className="p-3 rounded-md border border-border bg-muted/20">
                      <p className="text-sm font-medium mb-1">{l.key_takeaway}</p>
                      {l.what_went_well && <p className="text-xs text-success">✓ {l.what_went_well}</p>}
                      {l.what_went_wrong && <p className="text-xs text-destructive">✗ {l.what_went_wrong}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Timeline */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Vollständige Timeline</h4>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Audit-Einträge geladen.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex gap-3 text-xs">
                      <div className="w-1 rounded-full bg-border shrink-0" />
                      <div>
                        <p className="text-muted-foreground">{format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                        <p className="font-medium">{log.action}</p>
                        {log.field_name && (
                          <p className="text-muted-foreground">{log.field_name}: {log.old_value || "–"} → {log.new_value || "–"}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleRestore(d.id)}>
                <RotateCcw className="w-3.5 h-3.5" /> Wiederherstellen
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── Archive Tab ──
  const renderArchiveTab = () => (
    <div className="space-y-6">
      {renderKpiBar()}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Archiv durchsuchen..." className={`${inputClass} pl-9`} />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5" /> Filter {showFilters ? "▲" : "▼"}
          </Button>
          {selectedIds.size > 0 && (
            <Button size="sm" variant="outline" onClick={handleBulkRestore} className="gap-1.5 shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> {selectedIds.size} wiederherstellen
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-muted/20">
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}>
                  <option value="all">Alle Kategorien</option>
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectClass}>
                  <option value="all">Alle Prioritäten</option>
                  {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className={selectClass}>
                  <option value="all">Alle Risiko-Level</option>
                  <option value="high">Hoch (≥15)</option>
                  <option value="medium">Mittel (8–14)</option>
                  <option value="low">Niedrig (&lt;8)</option>
                </select>
                {(filterCategory !== "all" || filterPriority !== "all" || filterRisk !== "all") && (
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => { setFilterCategory("all"); setFilterPriority("all"); setFilterRisk("all"); }}>
                    <X className="w-3 h-3" /> Zurücksetzen
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decision List */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Archive className="w-7 h-7 text-muted-foreground opacity-50" />
          </div>
          <h3 className="font-semibold mb-1">Keine archivierten Entscheidungen</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search ? "Keine Treffer für deine Suche." : "Archivierte Entscheidungen erscheinen hier."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const daysSince = d.archived_at ? differenceInDays(new Date(), new Date(d.archived_at)) : null;
            const reason = getArchiveReason(d);
            const hasLessons = lessonsData.some(l => l.decision_id === d.id);
            const durationDays = d.archived_at && d.created_at ? differenceInDays(new Date(d.archived_at), new Date(d.created_at)) : null;

            return (
              <div
                key={d.id}
                className={`group p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedIds.has(d.id)
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-border/80 hover:bg-muted/20"
                }`}
                onClick={() => { setSelectedDecision(d); loadAuditLogs(d.id); }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(d.id); }}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] || d.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority] || d.priority}</Badge>
                      <Badge className="text-[10px] bg-muted/50 text-muted-foreground border-border">
                        <reason.icon className="w-2.5 h-2.5 mr-0.5" />{reason.label}
                      </Badge>
                      {(d.ai_risk_score || 0) >= 15 && (
                        <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Risk {d.ai_risk_score}</Badge>
                      )}
                      {hasLessons && (
                        <Badge className="text-[10px] bg-success/10 text-success border-success/20">
                          <BookOpen className="w-2.5 h-2.5 mr-0.5" />Lessons
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      {durationDays !== null && <span>Dauer: {durationDays}d</span>}
                      {daysSince !== null && <span>Archiviert vor {daysSince}d</span>}
                      {d.actual_impact_score && <span>Impact: {d.actual_impact_score}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); handleRestore(d.id); }}>
                    <RotateCcw className="w-3 h-3" /> Restore
                  </Button>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-2">{filtered.length} von {archived.length} Einträgen</p>
        </div>
      )}

      {/* Archive Analytics */}
      {archived.length > 0 && (
        <div className="mt-8 p-4 rounded-lg border border-border bg-card">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Archiv Performance Analyse
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Ø Dauer bis Archiv", value: `${kpis.avgArchiveDays}d` },
              { label: "Lessons-Quote", value: `${analytics.lessonsQuote}%` },
              { label: "Impact gesamt", value: analytics.totalImpact },
              { label: "Reopen-Rate", value: `${analytics.reopenCount}` },
            ].map((a, i) => (
              <div key={i}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{a.label}</p>
                <p className="text-base font-semibold">{a.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Trash Tab ──
  const renderTrashTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        <p className="text-xs text-warning">
          Gelöschte Entscheidungen können wiederhergestellt werden. Audit-Einträge werden <strong>niemals</strong> gelöscht.
          {isAdmin && " Nur Admins können Einträge endgültig löschen."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Papierkorb durchsuchen..." className={`${inputClass} pl-9`} />
        </div>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="outline" onClick={handleBulkRestore} className="gap-1.5 shrink-0">
            <RotateCcw className="w-3.5 h-3.5" /> {selectedIds.size} wiederherstellen
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-muted-foreground opacity-50" />
          </div>
          <h3 className="font-semibold mb-1">Papierkorb ist leer</h3>
          <p className="text-xs text-muted-foreground">Gelöschte Entscheidungen erscheinen hier und können wiederhergestellt werden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const daysSinceDelete = d.deleted_at ? differenceInDays(new Date(), new Date(d.deleted_at)) : 0;
            const retentionDaysLeft = autoDeleteDays ? Math.max(0, autoDeleteDays - daysSinceDelete) : null;
            const isHighValue = (d.ai_risk_score || 0) >= 15 || d.category === "strategic";

            return (
              <div key={d.id} className={`p-3.5 rounded-lg border transition-colors ${selectedIds.has(d.id) ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/20"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id)} className="w-4 h-4 rounded border-border mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] || d.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority] || d.priority}</Badge>
                      <span className="text-[10px] text-muted-foreground">Gelöscht vor {daysSinceDelete}d</span>
                      {retentionDaysLeft !== null && (
                        <Badge className={`text-[10px] ${retentionDaysLeft <= 7 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          {retentionDaysLeft > 0 ? `Endgültige Löschung in ${retentionDaysLeft}d` : "Löschung überfällig"}
                        </Badge>
                      )}
                      {isHighValue && (
                        <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                          <Shield className="w-2.5 h-2.5 mr-0.5" />Admin-Freigabe empfohlen
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => handleRestore(d.id)}>
                      <RotateCcw className="w-3 h-3" /> Restore
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handlePermanentDelete(d.id)} title="Endgültig löschen">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground pt-2">{filtered.length} Einträge im Papierkorb</p>
        </div>
      )}
    </div>
  );

  // ── Retention Tab ──
  const renderRetentionTab = () => (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">Nur Admins können die Retention Policy konfigurieren.</p>
        </div>
      )}

      {/* Standard Rules */}
      <section>
        <h2 className="text-sm font-medium mb-3">Standard-Aufbewahrungsregeln</h2>
        <div className="space-y-2">
          {[
            { cat: "Strategische Entscheidungen", years: "5 Jahre", icon: Target },
            { cat: "Budgetentscheidungen > 50k", years: "10 Jahre", icon: DollarSign },
            { cat: "Operative Entscheidungen", years: "2 Jahre", icon: Activity },
            { cat: "Abgelehnte Entscheidungen", years: "1 Jahr", icon: XCircle },
          ].map((rule, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-md border border-border">
              <div className="flex items-center gap-2">
                <rule.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm">{rule.cat}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">{rule.years}</Badge>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* Auto-Archivierung */}
      <section>
        <h2 className="text-sm font-medium mb-4">Auto-Archivierung</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm">Automatische Archivierung</p>
            <p className="text-xs text-muted-foreground">Umgesetzte Entscheidungen nach X Tagen automatisch archivieren.</p>
          </div>
          <Switch checked={retentionEnabled} onCheckedChange={setRetentionEnabled} disabled={!isAdmin} />
        </div>
        {retentionEnabled && (
          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Archivieren nach (Tagen)</label>
              <input type="number" min={7} max={365} value={autoArchiveDays} onChange={e => setAutoArchiveDays(Number(e.target.value))} disabled={!isAdmin} className={`${inputClass} max-w-[120px]`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endgültig löschen nach (Tagen, optional)</label>
              <input type="number" min={30} max={3650} value={autoDeleteDays ?? ""} onChange={e => setAutoDeleteDays(e.target.value ? Number(e.target.value) : null)} disabled={!isAdmin} placeholder="Nie" className={`${inputClass} max-w-[120px]`} />
            </div>
          </div>
        )}
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={handleSaveRetention} disabled={savingRetention} className="mt-4 gap-1.5">
            {savingRetention ? "Speichern..." : "Policy speichern"}
          </Button>
        )}
      </section>

      <hr className="border-border" />

      {/* Lifecycle Visualization */}
      <section>
        <h2 className="text-sm font-medium mb-3">Decision Lifecycle</h2>
        <div className="flex items-center gap-0 flex-wrap">
          {["Aktiv", "Umgesetzt", "Archiviert", "Retention", "Anonymisiert", "Gelöscht"].map((step, i, arr) => (
            <div key={i} className="flex items-center">
              <div className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                i <= 2 ? "bg-primary/10 text-primary border-primary/20" :
                i <= 4 ? "bg-warning/10 text-warning border-warning/20" :
                "bg-destructive/10 text-destructive border-destructive/20"
              }`}>{step}</div>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">⚠ Audit-Logs werden NIEMALS gelöscht – weder durch Soft Delete noch durch Retention Policies.</p>
      </section>
    </div>
  );

  // ── Export Tab ──
  const renderExportTab = () => (
    <div className="space-y-6">
      {/* Export Types */}
      <section>
        <h2 className="text-sm font-medium mb-3">Export-Formate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "JSON-Export", desc: "Vollständiger strukturierter Export aller Daten. Ideal für Backups und Migration.", icon: FileJson, action: handleExportAll },
            { label: "CSV-Export", desc: "Tabellarischer Export für Excel und Analyse-Tools.", icon: FileSpreadsheet, action: handleExportAll },
            { label: "Audit-Report", desc: "Compliance-Export mit allen Änderungen, SLA-Verletzungen und Eskalationen.", icon: ClipboardList, action: handleExportAll },
            { label: "Board Report (PDF)", desc: "Management-Bericht mit Metriken, Risiko-Übersichten und KI-Empfehlungen.", icon: FileText, action: handleExportAll },
          ].map((exp, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <exp.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{exp.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{exp.desc}</p>
              <Button size="sm" variant="outline" onClick={exp.action} disabled={exporting} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Exportieren
              </Button>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      {/* Compliance Export */}
      <section>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary" /> Compliance-Export für Wirtschaftsprüfung
        </h2>
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs text-foreground/80 mb-3">
            Erstellt einen umfassenden Export mit allen Entscheidungen, Statusänderungen, Zeitstempeln, SLA-Verletzungen, Eskalationen und Risiko-Historien. Ideal für Audit und Revision.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <select value={exportScope} onChange={e => setExportScope(e.target.value)} className={selectClass}>
              <option value="all">Alle Zeiträume</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="1y">Letztes Jahr</option>
              <option value="3y">Letzte 3 Jahre</option>
            </select>
            <select className={selectClass}>
              <option value="all">Alle Kategorien</option>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={selectClass}>
              <option value="all">Alle Teams</option>
            </select>
          </div>
          <Button size="sm" onClick={handleExportAll} disabled={exporting} className="gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {exporting ? "Exportiere..." : "Compliance-Export starten"}
          </Button>
        </div>
      </section>

      <hr className="border-border" />

      {/* Data Privacy */}
      <section>
        <h2 className="text-sm font-medium mb-2">Datenschutz & DSGVO</h2>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p>• Dein Export enthält nur Daten, auf die du Zugriff hast</p>
          <p>• Soft-gelöschte Entscheidungen sind im Export enthalten (mit deleted_at Markierung)</p>
          <p>• Audit-Logs sind immer vollständig im Export enthalten</p>
          <p>• Der Export erfolgt clientseitig – keine Daten werden an Dritte übermittelt</p>
          <p>• Personenbezogene Daten können vor Export anonymisiert werden</p>
        </div>
      </section>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight">Archiv & Daten-Lifecycle</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Governance: Archivierung, Aufbewahrung, Compliance-Export und Decision Traceability.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedIds(new Set()); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
              {tab === t.key && <motion.div layoutId="archive-tab" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {tab === "archive" && renderArchiveTab()}
          {tab === "trash" && renderTrashTab()}
          {tab === "retention" && renderRetentionTab()}
          {tab === "export" && renderExportTab()}
        </motion.div>
      </div>

      {/* Decision Traceability Drawer */}
      {selectedDecision && (
        <>
          <div className="fixed inset-0 bg-background/50 z-40" onClick={() => { setSelectedDecision(null); setAuditLogs([]); }} />
          {renderDetailDrawer()}
        </>
      )}
    </AppLayout>
  );
};

export default ArchivePage;

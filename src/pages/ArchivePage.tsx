import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Archive, RotateCcw, Trash2, Download, Search, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { exportAllDataAsJSON } from "@/lib/exportAllData";
import { EventTypes } from "@/lib/eventTaxonomy";

const priorityLabels: Record<string, string> = { low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch" };
const categoryLabels: Record<string, string> = { strategic: "Strategisch", budget: "Budget", hr: "Personal", technical: "Technisch", operational: "Operativ", marketing: "Marketing" };

type Tab = "archive" | "trash" | "retention" | "export";

const ArchivePage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("archive");
  const [archived, setArchived] = useState<any[]>([]);
  const [deleted, setDeleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrgOwner, setIsOrgOwner] = useState(false);

  // Retention config
  const [retentionEnabled, setRetentionEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(90);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number | null>(null);
  const [savingRetention, setSavingRetention] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [archRes, trashRes, roleRes, retRes] = await Promise.all([
      // Archived = status 'archived' but NOT soft-deleted
      supabase.from("decisions").select("*").eq("status", "archived").is("deleted_at", null).order("archived_at", { ascending: false }),
      // Soft-deleted (trash)
      supabase.from("decisions").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
      supabase.from("data_retention_config").select("*").limit(1).single(),
    ]);
    setArchived(archRes.data || []);
    setDeleted(trashRes.data || []);
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

  const currentList = tab === "trash" ? deleted : archived;
  const filtered = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(d => d.title.toLowerCase().includes(q));
  }, [currentList, search]);

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from("decisions").update({ status: "implemented" as any, archived_at: null, deleted_at: null } as any).eq("id", id);
    if (error) { toast.error("Fehler beim Wiederherstellen"); return; }
    // Audit
    if (user) {
      await supabase.from("audit_logs").insert({
        decision_id: id,
        user_id: user.id,
        action: EventTypes.DECISION_RESTORED,
        field_name: "deleted_at",
        old_value: "soft-deleted",
        new_value: null,
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
      enabled: retentionEnabled,
      auto_archive_days: autoArchiveDays,
      auto_delete_archived_days: autoDeleteDays,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
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
    } catch {
      toast.error("Export fehlgeschlagen");
    }
    setExporting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "archive", label: "Archiv", icon: Archive },
    { key: "trash", label: `Papierkorb (${deleted.length})`, icon: Trash2 },
    { key: "retention", label: "Retention Policy", icon: Clock },
    { key: "export", label: "Daten-Export", icon: Download },
  ];

  const renderDecisionList = (items: any[], showPermanentDelete: boolean) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Durchsuchen..." className={`${inputClass} pl-9`} />
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
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
            {tab === "trash" ? <Trash2 className="w-7 h-7 text-muted-foreground opacity-50" /> : <Archive className="w-7 h-7 text-muted-foreground opacity-50" />}
          </div>
          <h3 className="font-display font-semibold mb-1">
            {tab === "trash" ? "Papierkorb ist leer" : "Keine archivierten Entscheidungen"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {tab === "trash"
              ? "Gelöschte Entscheidungen erscheinen hier und können wiederhergestellt werden."
              : search ? "Keine Treffer für deine Suche." : "Archivierte Entscheidungen erscheinen hier."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => {
            const refDate = d.deleted_at || d.archived_at;
            const daysSince = refDate ? differenceInDays(new Date(), new Date(refDate)) : null;
            return (
              <div key={d.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedIds.has(d.id) ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/30"}`}>
                <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id)} className="w-4 h-4 rounded border-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] || d.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority] || d.priority}</Badge>
                    {daysSince !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        {d.deleted_at ? `Gelöscht vor ${daysSince}d` : `Archiviert vor ${daysSince}d`}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => handleRestore(d.id)}>
                  <RotateCcw className="w-3 h-3" /> Restore
                </Button>
                {showPermanentDelete && isAdmin && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handlePermanentDelete(d.id)} title="Endgültig löschen (nur Admin)">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} Einträge</p>
    </div>
  );

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight">Archiv & Daten-Lifecycle</h1>
          <p className="text-sm text-muted-foreground mt-1">Archivierte und gelöschte Entscheidungen verwalten, Aufbewahrungsregeln und Daten-Export.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-border mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedIds(new Set()); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative ${tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {tab === t.key && <motion.div layoutId="archive-tab" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {tab === "archive" && renderDecisionList(archived, false)}
          {tab === "trash" && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <p className="text-xs text-warning">
                  Gelöschte Entscheidungen können wiederhergestellt werden. Audit-Einträge werden <strong>niemals</strong> gelöscht.
                  {isAdmin && " Nur Admins können Einträge endgültig löschen."}
                </p>
              </div>
              {renderDecisionList(deleted, true)}
            </>
          )}

          {tab === "retention" && (
            <div className="space-y-6">
              {!isAdmin && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <p className="text-xs text-warning">Nur Admins können die Retention Policy konfigurieren.</p>
                </div>
              )}
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
                      <p className="text-[10px] text-muted-foreground mt-1">Umgesetzte Entscheidungen werden nach {autoArchiveDays} Tagen archiviert.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endgültig löschen nach (Tagen, optional)</label>
                      <input type="number" min={30} max={3650} value={autoDeleteDays ?? ""} onChange={e => setAutoDeleteDays(e.target.value ? Number(e.target.value) : null)} disabled={!isAdmin} placeholder="Nie" className={`${inputClass} max-w-[120px]`} />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {autoDeleteDays ? `Archivierte Entscheidungen werden nach ${autoDeleteDays} Tagen endgültig gelöscht.` : "Archivierte Entscheidungen werden niemals automatisch gelöscht."}
                      </p>
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
              <section>
                <h2 className="text-sm font-medium mb-2">Lifecycle-Übersicht</h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Aktiv → Umgesetzt → Archiviert{autoDeleteDays ? ` → Auto-Löschung nach ${autoDeleteDays}d` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span>Gelöscht (Papierkorb) → Wiederherstellbar → Nur Admin kann endgültig löschen</span>
                  </div>
                  <p className="mt-2 font-medium text-foreground/80">⚠ Audit-Logs werden NIEMALS gelöscht – weder durch Soft Delete noch durch Retention Policies.</p>
                </div>
              </section>
            </div>
          )}

          {tab === "export" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium mb-4">Vollständiger Daten-Export</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Exportiere alle deine Daten als JSON-Datei. Der Export enthält Entscheidungen, Aufgaben, Abhängigkeiten, Reviews, Audit-Logs und Kommentare.
                </p>
                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">JSON-Export</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Enthält alle Tabellen als strukturierte JSON-Datei. Ideal für Backups und Migration.</p>
                  <Button size="sm" onClick={handleExportAll} disabled={exporting} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> {exporting ? "Exportiere..." : "Alle Daten exportieren"}
                  </Button>
                </div>
              </section>
              <hr className="border-border" />
              <section>
                <h2 className="text-sm font-medium mb-2">Datenschutz</h2>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>• Dein Export enthält nur Daten, auf die du Zugriff hast</p>
                  <p>• Soft-gelöschte Entscheidungen sind im Export enthalten (mit deleted_at Markierung)</p>
                  <p>• Audit-Logs sind immer vollständig im Export enthalten</p>
                  <p>• Der Export erfolgt clientseitig – keine Daten werden an Dritte übermittelt</p>
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ArchivePage;

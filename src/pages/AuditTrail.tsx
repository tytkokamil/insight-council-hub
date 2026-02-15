import { useState, useEffect, useMemo } from "react";
import { History, ArrowRight, Search, Filter, FileText, CheckCircle, XCircle, Sparkles, Pencil, Plus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/shared/UserAvatar";

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

const actionConfig: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  created: { label: "Erstellt", icon: Plus, color: "text-primary" },
  status_changed: { label: "Status geändert", icon: CheckCircle, color: "text-accent-foreground" },
  review_approved: { label: "Genehmigt", icon: CheckCircle, color: "text-success" },
  review_rejected: { label: "Abgelehnt", icon: XCircle, color: "text-destructive" },
  ai_analysis: { label: "KI-Analyse", icon: Sparkles, color: "text-primary" },
  field_updated: { label: "Aktualisiert", icon: Pencil, color: "text-muted-foreground" },
  decision_edited: { label: "Bearbeitet", icon: Pencil, color: "text-primary" },
  escalation: { label: "Eskaliert", icon: AlertTriangle, color: "text-destructive" },
};

const AuditTrail = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles!audit_logs_user_id_fkey(full_name, avatar_url), decisions!audit_logs_decision_id_fkey(title)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setLogs(data as AuditLog[]);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        search === "" ||
        (log.decisions?.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (log.field_name || "").toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === "all" || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, search, actionFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    filtered.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [filtered]);

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set);
  }, [logs]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vollständige Änderungshistorie aller Entscheidungen
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Entscheidung, Nutzer oder Feld suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] h-10">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Alle Aktionen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {actionConfig[a]?.label || a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="h-10 px-3 flex items-center gap-1.5 shrink-0">
            <FileText className="w-3.5 h-3.5" />
            {filtered.length} Einträge
          </Badge>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Keine Audit-Einträge gefunden.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Timeline entries */}
                <div className="relative ml-5">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

                  <div className="space-y-1">
                    {entries.map((log, idx) => {
                      const config = actionConfig[log.action] || {
                        label: log.action,
                        icon: FileText,
                        color: "text-muted-foreground",
                      };
                      const Icon = config.icon;
                      const time = new Date(log.created_at).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div key={log.id} className="relative flex items-start gap-4 py-3 group">
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-[30px] h-[30px] rounded-full border-2 border-background bg-card flex items-center justify-center shrink-0 shadow-sm ring-1 ring-border`}>
                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 bg-card border border-border rounded-xl p-3.5 group-hover:border-primary/20 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <UserAvatar
                                  avatarUrl={log.profiles?.avatar_url || null}
                                  fullName={log.profiles?.full_name}
                                  size="sm"
                                />
                                <span className="text-sm font-medium">
                                  {log.profiles?.full_name || "System"}
                                </span>
                                <Badge variant="outline" className={`text-[10px] ${config.color} border-current/20`}>
                                  {config.label}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground shrink-0">{time}</span>
                            </div>

                            {/* Decision title */}
                            {log.decisions?.title && (
                              <p className="text-xs text-muted-foreground mt-1.5 truncate">
                                <FileText className="w-3 h-3 inline mr-1" />
                                {log.decisions.title}
                              </p>
                            )}

                            {/* Field change details */}
                            {log.field_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Feld: <span className="font-medium text-foreground">{log.field_name}</span>
                              </p>
                            )}

                            {(log.old_value || log.new_value) && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                                {log.old_value && (
                                  <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive line-through truncate max-w-[150px]">
                                    {log.old_value}
                                  </span>
                                )}
                                {log.old_value && log.new_value && (
                                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                                {log.new_value && (
                                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary truncate max-w-[150px]">
                                    {log.new_value}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AuditTrail;

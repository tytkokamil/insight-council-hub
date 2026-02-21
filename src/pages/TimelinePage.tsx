import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useDecisions, useReviews, useNotifications, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  FileText, ListTodo, AlertTriangle, Shield, CheckCircle2,
  Clock, Filter, Search, XCircle, ArrowUpCircle, Eye,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHelpButton from "@/components/shared/PageHelpButton";

// ── Event types ──

type TimelineEventType =
  | "decision_created"
  | "decision_status"
  | "decision_implemented"
  | "task_created"
  | "task_completed"
  | "review_submitted"
  | "escalation"
  | "audit_change";

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  entityId?: string;
  userId?: string;
  meta?: Record<string, string>;
}

const typeConfig: Record<TimelineEventType, { icon: React.ElementType; color: string; label: string }> = {
  decision_created:     { icon: FileText,       color: "text-foreground bg-muted border-border",       label: "Entscheidung erstellt" },
  decision_status:      { icon: ArrowUpCircle,  color: "text-warning bg-warning/10 border-warning/20",    label: "Status geändert" },
  decision_implemented: { icon: CheckCircle2,   color: "text-success bg-success/10 border-success/20", label: "Umgesetzt" },
  task_created:         { icon: ListTodo,        color: "text-muted-foreground bg-muted border-border", label: "Aufgabe erstellt" },
  task_completed:       { icon: CheckCircle2,   color: "text-success bg-success/10 border-success/20",    label: "Aufgabe erledigt" },
  review_submitted:     { icon: Eye,            color: "text-foreground bg-muted border-border",       label: "Review" },
  escalation:           { icon: AlertTriangle,  color: "text-destructive bg-destructive/10 border-destructive/20",          label: "Eskalation" },
  audit_change:         { icon: Shield,         color: "text-warning bg-warning/10 border-warning/20", label: "Änderung" },
};

// ── Hooks ──

const useAuditLogs = () =>
  useQuery({
    queryKey: ["audit_logs_timeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

// ── Helpers ──

function buildEvents(
  decisions: any[],
  tasks: any[],
  reviews: any[],
  notifications: any[],
  auditLogs: any[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  decisions.forEach(d => {
    events.push({
      id: `dec-created-${d.id}`,
      type: "decision_created",
      title: d.title,
      description: d.description?.slice(0, 120) || undefined,
      timestamp: d.created_at,
      entityId: d.id,
      userId: d.created_by,
      meta: { category: d.category, priority: d.priority, status: d.status },
    });
    if (d.implemented_at) {
      events.push({
        id: `dec-impl-${d.id}`,
        type: "decision_implemented",
        title: `${d.title} umgesetzt`,
        timestamp: d.implemented_at,
        entityId: d.id,
        userId: d.created_by,
      });
    }
  });

  tasks.forEach(t => {
    events.push({
      id: `task-created-${t.id}`,
      type: "task_created",
      title: t.title,
      description: t.description?.slice(0, 120) || undefined,
      timestamp: t.created_at,
      entityId: t.id,
      userId: t.created_by,
      meta: { priority: t.priority, status: t.status },
    });
    if (t.completed_at) {
      events.push({
        id: `task-done-${t.id}`,
        type: "task_completed",
        title: `${t.title} erledigt`,
        timestamp: t.completed_at,
        entityId: t.id,
        userId: t.assignee_id || t.created_by,
      });
    }
  });

  reviews.forEach(r => {
    if (r.reviewed_at) {
      events.push({
        id: `review-${r.id}`,
        type: "review_submitted",
        title: `Review abgeschlossen`,
        description: r.feedback?.slice(0, 120) || undefined,
        timestamp: r.reviewed_at,
        entityId: r.decision_id,
        userId: r.reviewer_id,
        meta: { status: r.status },
      });
    }
  });

  notifications.forEach(n => {
    if (n.type === "escalation") {
      events.push({
        id: `esc-${n.id}`,
        type: "escalation",
        title: n.title,
        description: n.message?.slice(0, 120) || undefined,
        timestamp: n.created_at,
        entityId: n.decision_id || undefined,
        userId: n.user_id,
      });
    }
  });

  auditLogs.forEach(a => {
    if (a.action === "status_change" || a.action === "field_update") {
      events.push({
        id: `audit-${a.id}`,
        type: a.action === "status_change" ? "decision_status" : "audit_change",
        title: a.field_name
          ? `${a.field_name} geändert`
          : "Status geändert",
        description: a.old_value && a.new_value
          ? `${a.old_value} → ${a.new_value}`
          : a.new_value || undefined,
        timestamp: a.created_at,
        entityId: a.decision_id,
        userId: a.user_id,
      });
    }
  });

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return events;
}

function formatDayLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Heute";
  if (isYesterday(d)) return "Gestern";
  return format(d, "EEEE, d. MMMM yyyy", { locale: de });
}

function groupByDay(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const map = new Map<string, TimelineEvent[]>();
  events.forEach(e => {
    const key = startOfDay(parseISO(e.timestamp)).toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return Array.from(map.entries());
}

// ── Components ──

function TimelineItem({ event, profileMap }: { event: TimelineEvent; profileMap: Record<string, string> }) {
  const cfg = typeConfig[event.type];
  const Icon = cfg.icon;
  const userName = event.userId ? profileMap[event.userId] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${cfg.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-border/40 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{event.title}</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {cfg.label}
          </Badge>
          {event.meta?.priority && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {event.meta.priority}
            </Badge>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(parseISO(event.timestamp), "HH:mm", { locale: de })}
          </span>
          {userName && <span>{userName}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──

export default function Timeline() {
  const { data: decisions = [], isLoading: loadDec } = useDecisions();
  const { data: tasks = [], isLoading: loadTask } = useTasks();
  const { data: reviews = [], isLoading: loadRev } = useReviews();
  const { data: notifications = [], isLoading: loadNot } = useNotifications();
  const { data: auditLogs = [], isLoading: loadAudit } = useAuditLogs();
  const { data: profiles = [] } = useProfiles();

  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);
  const isLoading = loadDec || loadTask || loadRev || loadNot || loadAudit;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const allEvents = useMemo(
    () => buildEvents(decisions, tasks, reviews, notifications, auditLogs),
    [decisions, tasks, reviews, notifications, auditLogs],
  );

  const filtered = useMemo(() => {
    let list = allEvents;
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allEvents, typeFilter, search]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  // Stats
  const stats = useMemo(() => ({
    total: allEvents.length,
    decisions: allEvents.filter(e => e.type.startsWith("decision_")).length,
    tasks: allEvents.filter(e => e.type.startsWith("task_")).length,
    escalations: allEvents.filter(e => e.type === "escalation").length,
  }), [allEvents]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Chronologie</p>
            <h1 className="text-xl font-bold">Decision Timeline</h1>
          </div>
          <PageHelpButton title="Decision Timeline" description="Chronologische Ansicht aller Entscheidungs-, Task-, Review- und Eskalations-Events" />
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Gesamt-Events", value: stats.total, icon: TrendingUp },
            { label: "Entscheidungen", value: stats.decisions, icon: FileText },
            { label: "Aufgaben", value: stats.tasks, icon: ListTodo },
            { label: "Eskalationen", value: stats.escalations, icon: AlertTriangle },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Events durchsuchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Alle Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Events</SelectItem>
              <SelectItem value="decision_created">Entscheidungen erstellt</SelectItem>
              <SelectItem value="decision_implemented">Umgesetzt</SelectItem>
              <SelectItem value="decision_status">Status-Änderungen</SelectItem>
              <SelectItem value="task_created">Aufgaben erstellt</SelectItem>
              <SelectItem value="task_completed">Aufgaben erledigt</SelectItem>
              <SelectItem value="review_submitted">Reviews</SelectItem>
              <SelectItem value="escalation">Eskalationen</SelectItem>
              <SelectItem value="audit_change">Audit-Änderungen</SelectItem>
            </SelectContent>
          </Select>
          {(search || typeFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Zurücksetzen
            </button>
          )}
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-primary opacity-60" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              {search || typeFilter !== "all" ? "Keine Events gefunden" : "Noch keine Aktivitäten"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search || typeFilter !== "all"
                ? "Versuche andere Filter oder Suchbegriffe."
                : "Die Timeline zeigt chronologisch alle Aktivitäten — erstellte Entscheidungen, Statusänderungen, Reviews, abgeschlossene Aufgaben und Eskalationen."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([dayKey, events]) => (
              <div key={dayKey}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDayLabel(events[0].timestamp)}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground">{events.length} Events</span>
                </div>
                <div className="pl-1">
                  {events.map(event => (
                    <TimelineItem key={event.id} event={event} profileMap={profileMap} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

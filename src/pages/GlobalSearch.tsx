import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, FileText, ListTodo, Lightbulb, AlertTriangle, MessageSquare, X, ChevronRight, ExternalLink, CheckCircle2, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslatedLabels } from "@/lib/labels";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import { de } from "date-fns/locale";

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return <>{parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">{p}</mark> : p)}</>;
};

type EntityType = "all" | "decisions" | "tasks" | "lessons" | "risks" | "comments";

interface SearchResult {
  type: EntityType;
  id: string;
  title: string;
  subtitle: string | null;
  meta: string;
  link: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
}

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  in_review: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  decided: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  implemented: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-muted text-muted-foreground",
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  done: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
};

const priorityColor: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  medium: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  low: "bg-muted text-muted-foreground",
};

const GlobalSearch = () => {
  const { t, i18n } = useTranslation();
  const tl = useTranslatedLabels(t);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<EntityType>("all");

  const ENTITY_TABS: { value: EntityType; label: string; icon: React.ElementType }[] = [
    { value: "all", label: t("globalSearch.all"), icon: Search },
    { value: "decisions", label: t("globalSearch.decisions"), icon: FileText },
    { value: "tasks", label: t("globalSearch.tasks"), icon: ListTodo },
    { value: "lessons", label: t("globalSearch.lessons"), icon: Lightbulb },
    { value: "risks", label: t("globalSearch.risks"), icon: AlertTriangle },
    { value: "comments", label: t("globalSearch.comments"), icon: MessageSquare },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: decisions = [] } = useQuery({
    queryKey: ["search-decisions"],
    queryFn: async () => {
      const { data } = await supabase.from("decisions").select("id, title, description, status, priority, category, due_date").is("deleted_at", null);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["search-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id, title, description, status, priority, due_date").is("deleted_at", null);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["search-lessons"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons_learned").select("id, decision_id, key_takeaway, what_went_well, what_went_wrong, recommendations");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: risks = [] } = useQuery({
    queryKey: ["search-risks"],
    queryFn: async () => {
      const { data } = await supabase.from("risks").select("id, title, description, status, impact, likelihood");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["search-comments"],
    queryFn: async () => {
      const { data } = await supabase.from("comments").select("id, decision_id, content, type");
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    const res: SearchResult[] = [];

    if (entityFilter === "all" || entityFilter === "decisions") {
      decisions.forEach(d => {
        if (d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)) {
          res.push({
            type: "decisions", id: d.id, title: d.title,
            subtitle: d.description?.slice(0, 120) || null,
            meta: `${tl.categoryLabels[d.category] || d.category}`,
            link: `/decisions/${d.id}`,
            status: d.status,
            priority: d.priority,
            dueDate: d.due_date,
          });
        }
      });
    }

    if (entityFilter === "all" || entityFilter === "tasks") {
      tasks.forEach(tk => {
        if (tk.title?.toLowerCase().includes(q) || tk.description?.toLowerCase().includes(q)) {
          res.push({
            type: "tasks", id: tk.id, title: tk.title,
            subtitle: tk.description?.slice(0, 120) || null,
            meta: "",
            link: "/tasks",
            status: tk.status,
            priority: tk.priority,
            dueDate: tk.due_date,
          });
        }
      });
    }

    if (entityFilter === "all" || entityFilter === "lessons") {
      lessons.forEach(l => {
        const fields = [l.key_takeaway, l.what_went_well, l.what_went_wrong, l.recommendations];
        if (fields.some(f => f?.toLowerCase().includes(q))) {
          res.push({
            type: "lessons", id: l.id, title: l.key_takeaway,
            subtitle: [l.what_went_well, l.what_went_wrong].filter(Boolean).join(" | ")?.slice(0, 120) || null,
            meta: "Lesson Learned",
            link: "/knowledge-base",
          });
        }
      });
    }

    if (entityFilter === "all" || entityFilter === "risks") {
      risks.forEach(r => {
        if (r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)) {
          res.push({
            type: "risks", id: r.id, title: r.title,
            subtitle: r.description?.slice(0, 120) || null,
            meta: `Impact ${r.impact} × Likelihood ${r.likelihood}`,
            link: "/risks",
            status: r.status,
          });
        }
      });
    }

    if (entityFilter === "all" || entityFilter === "comments") {
      comments.forEach(c => {
        if (c.content?.toLowerCase().includes(q)) {
          res.push({
            type: "comments", id: c.id, title: c.content.slice(0, 80),
            subtitle: null,
            meta: `${c.type} · ${t("globalSearch.decision")}`,
            link: c.decision_id ? `/decisions/${c.decision_id}` : "/decisions",
          });
        }
      });
    }

    return res.slice(0, 50);
  }, [debouncedQuery, entityFilter, decisions, tasks, lessons, risks, comments, tl, t]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  const entityCounts = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return {} as Record<EntityType, number>;
    const q = debouncedQuery.toLowerCase();
    return {
      all: 0,
      decisions: decisions.filter(d => d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)).length,
      tasks: tasks.filter(tk => tk.title?.toLowerCase().includes(q) || tk.description?.toLowerCase().includes(q)).length,
      lessons: lessons.filter(l => [l.key_takeaway, l.what_went_well, l.what_went_wrong, l.recommendations].some(f => f?.toLowerCase().includes(q))).length,
      risks: risks.filter(r => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)).length,
      comments: comments.filter(c => c.content?.toLowerCase().includes(q)).length,
    };
  }, [debouncedQuery, decisions, tasks, lessons, risks, comments]);

  const typeIcon: Record<string, React.ElementType> = {
    decisions: FileText, tasks: ListTodo, lessons: Lightbulb, risks: AlertTriangle, comments: MessageSquare,
  };

  const typeColor: Record<string, string> = {
    decisions: "text-primary", tasks: "text-accent-blue", lessons: "text-warning", risks: "text-destructive", comments: "text-muted-foreground",
  };

  const typeLabel: Record<string, string> = {
    decisions: t("globalSearch.decisions"),
    tasks: t("globalSearch.tasks"),
    lessons: t("globalSearch.lessons"),
    risks: t("globalSearch.risks"),
    comments: t("globalSearch.comments"),
  };

  const handleMarkTaskDone = useCallback(async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", taskId);
    if (error) { toast.error(t("hooks.statusChangeFailed")); return; }
    qc.invalidateQueries({ queryKey: ["search-tasks"] });
    toast.success(t("globalSearch.taskMarkedDone"));
  }, [qc, t]);

  const formatDue = (d: string | null | undefined) => {
    if (!d) return null;
    try {
      const date = parseISO(d);
      const overdue = isPast(date);
      const formatted = format(date, "dd. MMM", { locale: i18n.language === "de" ? de : undefined });
      return { formatted, overdue };
    } catch { return null; }
  };

  const renderResultRow = (r: SearchResult) => {
    const Icon = typeIcon[r.type] || FileText;
    const due = formatDue(r.dueDate);

    return (
      <div
        key={`${r.type}-${r.id}`}
        className="group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors border border-transparent hover:border-border/50"
        onClick={() => navigate(r.link)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/50 ${typeColor[r.type]}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            <Highlight text={r.title} query={debouncedQuery} />
          </p>
          {r.subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              <Highlight text={r.subtitle} query={debouncedQuery} />
            </p>
          )}
        </div>

        {/* Status + Priority badges for decisions & tasks */}
        <div className="flex items-center gap-1.5 shrink-0">
          {r.status && (
            <Badge variant="outline" className={`text-[10px] border ${statusColor[r.status] || ""}`}>
              {tl.statusLabels[r.status] || r.status}
            </Badge>
          )}
          {r.priority && (r.type === "tasks" || r.type === "decisions") && (
            <Badge variant="outline" className={`text-[10px] border ${priorityColor[r.priority] || ""}`}>
              {tl.priorityLabels[r.priority] || r.priority}
            </Badge>
          )}
          {due && (
            <span className={`text-[10px] font-medium ${due.overdue ? "text-destructive" : "text-muted-foreground"}`}>
              {due.formatted}
            </span>
          )}
        </div>

        {/* Hover actions */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); navigate(r.link); }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            {t("globalSearch.open")}
          </Button>

          {r.type === "decisions" && r.status === "in_review" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-amber-600"
              onClick={(e) => { e.stopPropagation(); navigate(`${r.link}?tab=review`); }}
            >
              <PlayCircle className="w-3 h-3 mr-1" />
              Review
            </Button>
          )}

          {r.type === "tasks" && r.status !== "done" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-emerald-600"
              onClick={(e) => handleMarkTaskDone(r.id, e)}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t("globalSearch.markDone")}
            </Button>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:hidden" />
      </div>
    );
  };

  const groupOrder: EntityType[] = ["decisions", "tasks", "risks", "lessons", "comments"];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">{t("globalSearch.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("globalSearch.label")}</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder={t("globalSearch.placeholder")}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-10 rounded-xl bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {ENTITY_TABS.map(tab => {
            const count = tab.value === "all"
              ? Object.values(entityCounts).reduce((s, n) => s + n, 0)
              : entityCounts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                onClick={() => setEntityFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  entityFilter === tab.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border/50 hover:border-primary/30"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {debouncedQuery.length >= 2 && count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    entityFilter === tab.value ? "bg-primary-foreground/20" : "bg-muted"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {debouncedQuery.length < 2 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t("globalSearch.minChars")}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t("globalSearch.noResults", { query: debouncedQuery })}</p>
          </div>
        ) : entityFilter !== "all" ? (
          /* Flat list when a specific type is selected */
          <div className="space-y-1">
            {results.map(renderResultRow)}
          </div>
        ) : (
          /* Grouped by type when "All" is selected */
          <div className="space-y-6">
            {groupOrder.map(type => {
              const group = groupedResults[type];
              if (!group || group.length === 0) return null;
              const Icon = typeIcon[type] || FileText;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Icon className={`w-4 h-4 ${typeColor[type]}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {typeLabel[type]} <span className="text-[10px] font-normal">({group.length})</span>
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {group.map(renderResultRow)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length >= 50 && (
          <p className="text-xs text-muted-foreground text-center py-2 mt-4">{t("globalSearch.showingFirst50")}</p>
        )}
      </div>
    </AppLayout>
  );
};

export default GlobalSearch;

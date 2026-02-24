import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, FileText, ListTodo, Lightbulb, AlertTriangle, MessageSquare, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTranslatedLabels } from "@/lib/labels";

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
}

const GlobalSearch = () => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const navigate = useNavigate();
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
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: decisions = [] } = useQuery({
    queryKey: ["search-decisions"],
    queryFn: async () => {
      const { data } = await supabase.from("decisions").select("id, title, description, status, priority, category").is("deleted_at", null);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["search-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("id, title, description, status, priority").is("deleted_at", null);
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
            meta: `${tl.statusLabels[d.status] || d.status} · ${tl.priorityLabels[d.priority] || d.priority} · ${tl.categoryLabels[d.category] || d.category}`,
            link: `/decisions/${d.id}`,
          });
        }
      });
    }

    if (entityFilter === "all" || entityFilter === "tasks") {
      tasks.forEach(t => {
        if (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
          res.push({
            type: "tasks", id: t.id, title: t.title,
            subtitle: t.description?.slice(0, 120) || null,
            meta: `${t.status} · ${tl.priorityLabels[t.priority] || t.priority}`,
            link: "/tasks",
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
            link: "/knowledge",
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
            meta: `${r.status} · Impact ${r.impact} × Likelihood ${r.likelihood}`,
            link: "/risks",
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

  const entityCounts = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return {} as Record<EntityType, number>;
    const q = debouncedQuery.toLowerCase();
    return {
      all: 0,
      decisions: decisions.filter(d => d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)).length,
      tasks: tasks.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)).length,
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("globalSearch.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("globalSearch.title")}</h1>
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
        ) : (
          <div className="space-y-2">
            {results.map(r => {
              const Icon = typeIcon[r.type] || FileText;
              return (
                <Card
                  key={`${r.type}-${r.id}`}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(r.link)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/50 ${typeColor[r.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium truncate">
                            <Highlight text={r.title} query={debouncedQuery} />
                          </p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{ENTITY_TABS.find(tab => tab.value === r.type)?.label}</Badge>
                        </div>
                        {r.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            <Highlight text={r.subtitle} query={debouncedQuery} />
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{r.meta}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {results.length >= 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">{t("globalSearch.showingFirst50")}</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GlobalSearch;

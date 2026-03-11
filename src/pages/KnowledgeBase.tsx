import { useState, useMemo, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslatedLabels, categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import { useTranslation } from "react-i18next";
import {
  BookOpen, Search, Tag, Plus, Lightbulb, ThumbsUp, ThumbsDown,
  ArrowRight, Clock, Users, X, Sparkles, FileText, ChevronRight, Download, Loader2, Brain,
  Filter, ClipboardCheck, TrendingUp, TrendingDown, AlertTriangle, Shield, Gauge, Info,
  Zap, BarChart3, Activity, Target, Repeat, CheckCircle2, RefreshCw, Archive,
} from "lucide-react";
import { generateLessonsReport } from "@/lib/generateLessonsReport";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DecisionRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  outcome_notes: string | null;
  actual_impact_score: number | null;
  ai_impact_score: number | null;
  ai_risk_score: number | null;
  implemented_at: string | null;
  created_at: string;
  created_by: string;
  team_id: string | null;
}

interface TagRow { id: string; name: string; color: string }
interface DecisionTagRow { id: string; decision_id: string; tag_id: string }
interface LessonRow {
  id: string;
  decision_id: string;
  what_went_well: string | null;
  what_went_wrong: string | null;
  key_takeaway: string;
  recommendations: string | null;
  created_by: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const TAG_COLORS = [
  "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent-violet))",
  "hsl(var(--accent-rose))", "hsl(var(--accent-teal))", "hsl(var(--accent-amber))", "hsl(var(--accent-blue))", "hsl(var(--accent-teal))",
];

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">{part}</mark>
          : part
      )}
    </>
  );
};

const ALL_CATEGORIES = ["strategic", "budget", "hr", "technical", "operational", "marketing"] as const;
const OUTCOME_FILTERS_KEYS = [
  { value: "implemented", key: "status.implemented" },
  { value: "rejected", key: "status.rejected" },
  { value: "approved", key: "status.approved" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const KnowledgeBase = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const { statusLabels: tStatusLabels, categoryLabels: tCategoryLabels, priorityLabels: tPriorityLabels } = useTranslatedLabels(t);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<string[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detailTab, setDetailTab] = useState("lessons");
  const [listSort, setListSort] = useState<"newest" | "impact" | "risk">("newest");
  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set());

  const [lessonForm, setLessonForm] = useState({
    key_takeaway: "",
    what_went_well: "",
    what_went_wrong: "",
    recommendations: "",
  });

  /* --- Queries --- */
  const { data: decisions = [] } = useQuery<DecisionRow[]>({
    queryKey: ["kb-decisions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("decisions")
        .select("id,title,description,category,priority,status,outcome_notes,actual_impact_score,ai_impact_score,ai_risk_score,implemented_at,created_at,created_by,team_id")
        .in("status", ["implemented", "approved", "rejected"])
        .order("implemented_at", { ascending: false, nullsFirst: false });
      return (data ?? []) as DecisionRow[];
    },
  });

  const { data: tags = [] } = useQuery<TagRow[]>({
    queryKey: ["kb-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      return (data ?? []) as TagRow[];
    },
  });

  const { data: decisionTags = [] } = useQuery<DecisionTagRow[]>({
    queryKey: ["kb-decision-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("decision_tags").select("id,decision_id,tag_id");
      return (data ?? []) as DecisionTagRow[];
    },
  });

  const { data: lessons = [] } = useQuery<LessonRow[]>({
    queryKey: ["kb-lessons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons_learned")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as LessonRow[];
    },
  });

  /* --- Mutations --- */
  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const { error } = await supabase.from("tags").insert({ name, color });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb-tags"] }); setNewTagName(""); toast.success(t("knowledge.tagCreated")); },
    onError: () => toast.error(t("knowledge.tagExists")),
  });

  const toggleTag = useMutation({
    mutationFn: async ({ decisionId, tagId, exists, linkId }: { decisionId: string; tagId: string; exists: boolean; linkId?: string }) => {
      if (exists && linkId) {
        const { error } = await supabase.from("decision_tags").delete().eq("id", linkId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("decision_tags").insert({ decision_id: decisionId, tag_id: tagId, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb-decision-tags"] }),
  });

  const createLesson = useMutation({
    mutationFn: async () => {
      if (!selectedDecision || !lessonForm.key_takeaway) return;
      const { error } = await supabase.from("lessons_learned").insert({
        decision_id: selectedDecision,
        ...lessonForm,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kb-lessons"] });
      setLessonOpen(false);
      setLessonForm({ key_takeaway: "", what_went_well: "", what_went_wrong: "", recommendations: "" });
      toast.success(t("knowledge.lessonSaved"));
    },
  });

  /* --- Derived data --- */
  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);
  const lessonsMap = useMemo(() => {
    const m = new Map<string, LessonRow[]>();
    lessons.forEach(l => {
      const arr = m.get(l.decision_id) || [];
      arr.push(l);
      m.set(l.decision_id, arr);
    });
    return m;
  }, [lessons]);

  const searchMatchesLesson = useCallback((l: LessonRow, q: string): boolean => {
    return [l.key_takeaway, l.what_went_well, l.what_went_wrong, l.recommendations]
      .some(field => field?.toLowerCase().includes(q));
  }, []);

  const filteredDecisions = useMemo(() => {
    let list = decisions;
    if (selectedCategories.length > 0) list = list.filter(d => selectedCategories.includes(d.category));
    if (selectedOutcomes.length > 0) list = list.filter(d => selectedOutcomes.includes(d.status));
    if (selectedTags.length > 0) {
      const decIdsWithTags = new Set(decisionTags.filter(dt => selectedTags.includes(dt.tag_id)).map(dt => dt.decision_id));
      list = list.filter(d => decIdsWithTags.has(d.id));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => {
        const decMatch = d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.outcome_notes?.toLowerCase().includes(q);
        if (decMatch) return true;
        const dLessons = lessonsMap.get(d.id) || [];
        return dLessons.some(l => searchMatchesLesson(l, q));
      });
      list = [...list].sort((a, b) => {
        const aLessonMatch = (lessonsMap.get(a.id) || []).some(l => searchMatchesLesson(l, q));
        const bLessonMatch = (lessonsMap.get(b.id) || []).some(l => searchMatchesLesson(l, q));
        if (aLessonMatch && !bLessonMatch) return -1;
        if (!aLessonMatch && bLessonMatch) return 1;
        return new Date(b.implemented_at || b.created_at).getTime() - new Date(a.implemented_at || a.created_at).getTime();
      });
    }
    return list;
  }, [decisions, search, selectedTags, selectedCategories, selectedOutcomes, decisionTags, lessonsMap, searchMatchesLesson]);

  const selected = decisions.find(d => d.id === selectedDecision);
  const selectedLessons = lessons.filter(l => l.decision_id === selectedDecision);
  const selectedDecTags = decisionTags.filter(dt => dt.decision_id === selectedDecision);

  // AI similarity
  const [aiSimilarities, setAiSimilarities] = useState<{ decision_id: string; score: number; reason: string }[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState<string | null>(null);

  const fetchSimilarity = async (decId: string) => {
    setSimilarLoading(true);
    setSimilarError(null);
    setAiSimilarities([]);
    try {
      const { data, error } = await supabase.functions.invoke("similarity-score", { body: { decisionId: decId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSimilarities(data?.similarities ?? []);
    } catch (e: any) {
      setSimilarError(e.message || t("knowledge.similarityError"));
    } finally {
      setSimilarLoading(false);
    }
  };

  const similarDecisions = useMemo(() => {
    return aiSimilarities
      .map(s => ({ ...s, decision: decisions.find(d => d.id === s.decision_id) }))
      .filter(s => s.decision) as { decision_id: string; score: number; reason: string; decision: DecisionRow }[];
  }, [aiSimilarities, decisions]);

  const getDecisionTags = (decisionId: string) =>
    decisionTags.filter(dt => dt.decision_id === decisionId).map(dt => tagMap.get(dt.tag_id)).filter(Boolean) as TagRow[];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    decisions.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [decisions]);

  const activeFilterCount = selectedCategories.length + selectedOutcomes.length + selectedTags.length;

  /* ── 1. Learning Snapshot KPIs (90 days) ── */
  const snapshot = useMemo(() => {
    const cutoff90 = new Date(); cutoff90.setDate(cutoff90.getDate() - 90);
    const recentDec = decisions.filter(d => new Date(d.implemented_at || d.created_at) > cutoff90);
    const recentLessons = lessons.filter(l => new Date(l.created_at) > cutoff90);
    const documented = recentDec.filter(d => lessonsMap.has(d.id)).length;
    const docRate = recentDec.length > 0 ? Math.round((documented / recentDec.length) * 100) : 0;

    // Recurring patterns: categories with >2 lessons that have similar what_went_wrong
    const wrongPatterns = new Map<string, string[]>();
    lessons.forEach(l => {
      if (l.what_went_wrong) {
        const dec = decisions.find(d => d.id === l.decision_id);
        const cat = dec?.category || "other";
        const arr = wrongPatterns.get(cat) || [];
        arr.push(l.what_went_wrong);
        wrongPatterns.set(cat, arr);
      }
    });
    const recurringPatterns = Array.from(wrongPatterns.values()).filter(arr => arr.length >= 2).length;

    // Repeated failures: decisions with what_went_wrong and rejected status
    const repeatedFailures = lessons.filter(l => {
      const dec = decisions.find(d => d.id === l.decision_id);
      return dec?.status === "rejected" && l.what_went_wrong;
    }).length;

    // Avg time to document lesson
    const timesToDoc: number[] = [];
    lessons.forEach(l => {
      const dec = decisions.find(d => d.id === l.decision_id);
      if (dec?.implemented_at) {
        const days = Math.round((new Date(l.created_at).getTime() - new Date(dec.implemented_at).getTime()) / 86400000);
        if (days >= 0) timesToDoc.push(days);
      }
    });
    const avgTimeToDoc = timesToDoc.length > 0 ? Math.round(timesToDoc.reduce((a, b) => a + b, 0) / timesToDoc.length) : 0;

    return { completedDec: recentDec.length, documented, docRate, recurringPatterns, repeatedFailures, avgTimeToDoc };
  }, [decisions, lessons, lessonsMap]);

  /* ── 4. Pattern Recognition ── */
  const patterns = useMemo(() => {
    const results: { title: string; detail: string; severity: "info" | "warning" | "error" }[] = [];

    // Category-based failure patterns
    const catFailures: Record<string, number> = {};
    const catTotal: Record<string, number> = {};
    decisions.forEach(d => {
      catTotal[d.category] = (catTotal[d.category] || 0) + 1;
      if (d.status === "rejected") catFailures[d.category] = (catFailures[d.category] || 0) + 1;
    });
    Object.entries(catFailures).forEach(([cat, count]) => {
      const total = catTotal[cat] || 1;
      const rate = Math.round((count / total) * 100);
      if (rate >= 25 && count >= 2) {
        results.push({
          title: `${categoryLabels[cat] || cat}: ${rate}% Ablehnungsrate`,
          detail: `${count} von ${total} Entscheidungen abgelehnt – potentielles Strukturproblem.`,
          severity: rate >= 40 ? "error" : "warning",
        });
      }
    });

    // Lessons with repeated what_went_wrong keywords
    const wrongKeywords: Record<string, number> = {};
    lessons.forEach(l => {
      if (l.what_went_wrong) {
        const words = l.what_went_wrong.toLowerCase().split(/\s+/).filter(w => w.length > 5);
        words.forEach(w => { wrongKeywords[w] = (wrongKeywords[w] || 0) + 1; });
      }
    });
    const frequentProblems = Object.entries(wrongKeywords).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (frequentProblems.length > 0) {
      results.push({
        title: `Wiederkehrende Problem-Themen erkannt`,
        detail: `Häufige Begriffe in Fehleranalysen: ${frequentProblems.map(([w, c]) => `"${w}" (${c}×)`).join(", ")}`,
        severity: "warning",
      });
    }

    // Decisions without lessons that are older than 14 days
    const cutoff14 = new Date(); cutoff14.setDate(cutoff14.getDate() - 14);
    const undocumented = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) < cutoff14 && !lessonsMap.has(d.id));
    if (undocumented.length >= 3) {
      results.push({
        title: `${undocumented.length} Entscheidungen ohne Lessons (>14 Tage)`,
        detail: "Dokumentationslücke – organisationales Wissen geht verloren.",
        severity: "warning",
      });
    }

    return results;
  }, [decisions, lessons, lessonsMap]);

  /* ── 7. Knowledge Quality Score ── */
  const knowledgeScore = useMemo(() => {
    let score = 0;
    // Documentation rate (max 40)
    score += Math.min(snapshot.docRate * 0.4, 40);
    // Avg time to document (<7 days = 20, <14 = 10)
    if (snapshot.avgTimeToDoc <= 7) score += 20;
    else if (snapshot.avgTimeToDoc <= 14) score += 10;
    // Lesson quality: % with recommendations (max 20)
    const withRec = lessons.filter(l => l.recommendations && l.recommendations.length > 10).length;
    const recRate = lessons.length > 0 ? withRec / lessons.length : 0;
    score += recRate * 20;
    // Low repeat failures (max 20)
    score += Math.max(0, 20 - snapshot.repeatedFailures * 5);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [snapshot, lessons]);

  /* ── 9. Category Intelligence Heatmap ── */
  const categoryHeatmap = useMemo(() => {
    return ALL_CATEGORIES.map(cat => {
      const catDecs = decisions.filter(d => d.category === cat);
      const catLessons = lessons.filter(l => catDecs.some(d => d.id === l.decision_id));
      const failures = catDecs.filter(d => d.status === "rejected").length;
      const failRate = catDecs.length > 0 ? Math.round((failures / catDecs.length) * 100) : 0;
      const reworks = catLessons.filter(l => l.what_went_wrong && l.what_went_wrong.length > 10).length;
      return {
        category: cat,
        label: categoryLabels[cat] || cat,
        decisions: catDecs.length,
        lessons: catLessons.length,
        failRate,
        reworks,
      };
    }).filter(c => c.decisions > 0);
  }, [decisions, lessons]);

  if (decisions.length === 0) {
    return (
      <AppLayout>
        <PageHeader title={t("knowledge.title")} subtitle={t("knowledge.subtitle")} role="knowledge" help={{ title: t("knowledge.title"), description: t("knowledge.help") }} />
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <Archive className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-3">
            Hier entsteht das Entscheidungsgedächtnis Ihrer Organisation.
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Jede abgeschlossene Entscheidung wird durchsuchbar archiviert — mit Kontext, Begründung und allen Beteiligten.
          </p>
          <Button onClick={() => navigate("/decisions/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            Erste Entscheidung anlegen
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={t("knowledge.title")}
          subtitle={t("knowledge.subtitle")}
          role="knowledge"
          help={{ title: t("knowledge.title"), description: t("knowledge.help") }}
          primaryAction={
            <Button size="sm" onClick={() => generateLessonsReport(decisions, lessons, tags, decisionTags)} disabled={decisions.length === 0} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4" /> {t("knowledge.executiveReport")}
            </Button>
          }
        />

        {/* ── 1. Learning Snapshot ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t("knowledge.completed90d"), value: snapshot.completedDec, icon: <CheckCircle2 className="w-4 h-4 text-primary" />, benchmark: null },
            { label: t("knowledge.lessonsDocumented"), value: snapshot.documented, icon: <Lightbulb className="w-4 h-4 text-warning" />, benchmark: null },
            { label: t("knowledge.documentationRate"), value: `${snapshot.docRate}%`, icon: <BarChart3 className="w-4 h-4 text-primary" />, highlight: snapshot.docRate < 50, benchmark: "Ø Branche: 62%" },
            { label: t("knowledge.recurringPatterns"), value: snapshot.recurringPatterns, icon: <Repeat className="w-4 h-4 text-accent-foreground" />, benchmark: null },
            { label: t("knowledge.repeatedFailures"), value: snapshot.repeatedFailures, icon: <AlertTriangle className="w-4 h-4 text-destructive" />, highlight: snapshot.repeatedFailures > 0, benchmark: null },
            { label: t("knowledge.avgTimeToLearning"), value: `${snapshot.avgTimeToDoc} ${t("knowledge.days")}`, icon: <Clock className="w-4 h-4 text-muted-foreground" />, benchmark: null },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={kpi.highlight ? "border-warning/30 bg-warning/5" : ""}>
                <CardContent className="p-3 min-h-[90px] flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    {kpi.icon}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${kpi.highlight ? "text-warning" : ""}`}>{kpi.value}</p>
                  {kpi.benchmark && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-[11px] mt-0.5 cursor-help text-muted-foreground">{kpi.benchmark}</p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          <p>Basiert auf Decivio-Nutzerdaten aus vergleichbaren Organisationen.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── 7. Knowledge Quality Score + 9. Category Heatmap ───── — 32px spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Knowledge Quality Score */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("knowledge.knowledgeMaturity")}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>{t("knowledge.maturityTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${knowledgeScore >= 70 ? "text-success" : knowledgeScore >= 40 ? "text-warning" : "text-destructive"}`}>{knowledgeScore}</span>
                <div className="flex-1">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${knowledgeScore}%` }} transition={{ duration: 1 }}
                      className={`h-full rounded-full ${knowledgeScore >= 70 ? "bg-success" : knowledgeScore >= 40 ? "bg-warning" : "bg-destructive"}`} />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                <p>{t("knowledge.documentation")}: {snapshot.docRate}% — 40 Punkte möglich</p>
                <p>{t("knowledge.captureTime")}: {snapshot.avgTimeToDoc}d — 20 Punkte möglich</p>
                <p>{t("knowledge.recommendationQuality")}: {lessons.filter(l => l.recommendations && l.recommendations.length > 10).length}/{lessons.length} — 20 Punkte möglich</p>
                <p>{t("knowledge.failureRepeat")}: −{snapshot.repeatedFailures * 5} Punkte</p>
              </div>
            </CardContent>
          </Card>

          {/* Category Heatmap */}
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{t("knowledge.categoryIntelligence")}</h3>
              </div>
              {categoryHeatmap.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("knowledge.noData")}</p>
              ) : (
                <div className="space-y-2">
                  {categoryHeatmap.map(cat => (
                    <div key={cat.category} className="flex items-center gap-3 text-xs">
                      <span className="w-24 font-medium truncate">{cat.label}</span>
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <div className="text-center p-1.5 rounded bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.decisionsLabel")}</p>
                          <p className="font-bold">{cat.decisions}</p>
                        </div>
                        <div className="text-center p-1.5 rounded bg-muted/30">
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.lessonsLabel")}</p>
                          <p className="font-bold">{cat.lessons}</p>
                        </div>
                        <div className={`text-center p-1.5 rounded ${cat.failRate >= 30 ? "bg-destructive/10" : "bg-muted/30"}`}>
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.failureRate")}</p>
                          <p className={`font-bold ${cat.failRate >= 30 ? "text-destructive" : ""}`}>{cat.failRate}%</p>
                        </div>
                        <div className={`text-center p-1.5 rounded ${cat.reworks >= 3 ? "bg-warning/10" : "bg-muted/30"}`}>
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.reworks")}</p>
                          <p className={`font-bold ${cat.reworks >= 3 ? "text-warning" : ""}`}>{cat.reworks}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Pattern Recognition ───────────────────────────────── */}
        {patterns.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold">{t("knowledge.patternsDetected")}</h3>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">{patterns.length}</Badge>
              </div>
              <div className="space-y-2">
                {patterns.map((p, i) => (
                  <div key={i} className={`p-2.5 rounded-lg bg-background border ${p.severity === "error" ? "border-destructive/30" : "border-warning/30"} flex items-start gap-2 text-xs`}>
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${p.severity === "error" ? "text-destructive" : "text-warning"}`} />
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-muted-foreground">{p.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Search & Filters — 32px spacing ──────────────────────── */}
        <div className="space-y-3 mt-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("knowledge.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant={showFilters || activeFilterCount > 0 ? "default" : "outline"} size="icon" onClick={() => setShowFilters(v => !v)} className="relative shrink-0">
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </Button>
          </div>

          {showFilters && (
            <Card className="p-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("knowledge.categoryFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CATEGORIES.map(cat => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <button key={cat} onClick={() => setSelectedCategories(prev => active ? prev.filter(c => c !== cat) : [...prev, cat])}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                        {tCategoryLabels[cat] ?? cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("knowledge.outcomeFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOME_FILTERS_KEYS.map(of => {
                    const active = selectedOutcomes.includes(of.value);
                    return (
                      <button key={of.value} onClick={() => setSelectedOutcomes(prev => active ? prev.filter(o => o !== of.value) : [...prev, of.value])}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                        {t(of.key)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("knowledge.tagsFilter")}</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {tags.map(tag => {
                    const active = selectedTags.includes(tag.id);
                    return (
                      <button key={tag.id} onClick={() => setSelectedTags(prev => active ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        {active && <X className="w-3 h-3" />}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1">
                    <Input placeholder={t("knowledge.newTagPlaceholder")} value={newTagName} onChange={e => setNewTagName(e.target.value)} className="h-7 w-28 text-xs"
                      onKeyDown={e => { if (e.key === "Enter" && newTagName.trim()) createTag.mutate(newTagName.trim()); }} />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => newTagName.trim() && createTag.mutate(newTagName.trim())}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCategories([]); setSelectedOutcomes([]); setSelectedTags([]); }} className="text-xs text-muted-foreground">
                  <X className="w-3 h-3 mr-1" /> {t("knowledge.resetAllFilters")}
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* ── Main Content: List + Detail ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── 2. Enriched Decision List ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Sort Toggle */}
            <div className="flex items-center gap-1 mb-1">
              {([
                { key: "newest" as const, label: "Neueste" },
                { key: "impact" as const, label: "Impact ↓" },
                { key: "risk" as const, label: "Risiko ↓" },
              ]).map(s => (
                <button key={s.key} onClick={() => setListSort(s.key)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${listSort === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  style={{ fontSize: "12px" }}>
                  {s.label}
                </button>
              ))}
            </div>
            {filteredDecisions.length === 0 && (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-primary opacity-60" />
                </div>
                <h3 className="font-display font-semibold mb-1">{t("knowledge.noDecisionsFound")}</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {search ? t("knowledge.noDecisionsSearch") : t("knowledge.noDecisionsDefault")}
                </p>
              </Card>
            )}
            {[...filteredDecisions].sort((a, b) => {
              if (listSort === "impact") return ((b.actual_impact_score || b.ai_impact_score || 0) - (a.actual_impact_score || a.ai_impact_score || 0));
              if (listSort === "risk") return ((b.ai_risk_score || 0) - (a.ai_risk_score || 0));
              return new Date(b.implemented_at || b.created_at).getTime() - new Date(a.implemented_at || a.created_at).getTime();
            }).map(d => {
              const dTags = getDecisionTags(d.id);
              const dLessons = lessonsMap.get(d.id) || [];
              const isActive = selectedDecision === d.id;
              const firstTakeaway = dLessons[0]?.key_takeaway;
              return (
                <Card key={d.id} className={`p-3 cursor-pointer transition-all ${isActive ? "border-foreground/20 bg-muted/40" : "hover:bg-muted/30"}`}
                  onClick={() => { setSelectedDecision(d.id); setAiSimilarities([]); }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate"><Highlight text={d.title} query={search} /></h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{tCategoryLabels[d.category] ?? d.category}</Badge>
                        <Badge variant={d.status === "implemented" ? "default" : d.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                          {tStatusLabels[d.status] ?? d.status}
                        </Badge>
                        {d.ai_risk_score != null && d.ai_risk_score > 0 && (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Risk {d.ai_risk_score}</Badge>
                        )}
                        {dLessons.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Lightbulb className="w-3 h-3" /> {dLessons.length}
                          </span>
                        )}
                      </div>
                      {/* Economic Impact preview */}
                      {d.actual_impact_score != null && (
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <span className="text-muted-foreground">Impact:</span>
                          <span className={`font-medium ${d.actual_impact_score >= 70 ? "text-success" : d.actual_impact_score >= 40 ? "text-warning" : "text-destructive"}`}>{d.actual_impact_score}%</span>
                          {d.ai_impact_score != null && d.ai_impact_score > 0 && (
                            <span className="text-muted-foreground">(KI: {d.ai_impact_score}%)</span>
                          )}
                        </div>
                      )}
                      {firstTakeaway && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 italic">
                          <Lightbulb className="w-3 h-3 inline mr-0.5 text-warning" />
                          <Highlight text={firstTakeaway} query={search} />
                        </p>
                      )}
                      {dTags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {dTags.map(t => (
                            <span key={t.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: t.color + "20", color: t.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform ${isActive ? "rotate-90" : ""}`} />
                  </div>
                  {d.implemented_at && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                      <Clock className="w-3 h-3" />
                      {format(new Date(d.implemented_at), "dd. MMM yyyy", { locale: dateFnsLocale })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* ── 3. Structured Detail View ──────────────────────────── */}
          <div className="lg:col-span-3">
            {!selected ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t("knowledge.selectDecision")}</p>
                <p className="text-xs mt-1">{t("knowledge.selectDecisionDesc")}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Decision header */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-lg">{selected.title}</h2>
                      {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground shrink-0" onClick={() => navigate(`/decisions/${selected.id}`)}>
                      {t("knowledge.goToDecision")}
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{tCategoryLabels[selected.category] ?? selected.category}</Badge>
                    <Badge variant="outline">{tPriorityLabels[selected.priority] ?? selected.priority}</Badge>
                    <Badge variant={selected.status === "implemented" ? "default" : "destructive"}>
                      {tStatusLabels[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                </Card>

                {/* ── 3F. Economic Outcome ── */}
                {(selected.actual_impact_score !== null || selected.outcome_notes) && (
                  <Card className="p-4 border-primary/20 bg-primary/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardCheck className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">{t("knowledge.postImplementationReview")}</h3>
                    </div>

                    {/* A) Kontext */}
                    {selected.description && (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("knowledge.context")}</p>
                        <p className="text-xs text-muted-foreground">{selected.description}</p>
                      </div>
                    )}

                    {/* B) Ergebnis: Erwartet vs Tatsächlich */}
                    {selected.actual_impact_score !== null && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-muted/30 text-center">
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.aiPrediction")}</p>
                          <p className="text-lg font-bold font-display tabular-nums text-primary">{selected.ai_impact_score ?? 0}%</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/30 text-center">
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.actual")}</p>
                          <p className="text-lg font-bold font-display tabular-nums">{selected.actual_impact_score}%</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/30 text-center">
                          <p className="text-[10px] text-muted-foreground">{t("knowledge.deviation")}</p>
                          {(() => {
                            const pred = selected.ai_impact_score ?? 0;
                            const diff = selected.actual_impact_score! - pred;
                            return (
                              <p className={`text-lg font-bold font-display ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                                {diff >= 0 ? "+" : ""}{diff}%
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* C) Outcome Notes */}
                    {selected.outcome_notes && (
                      <div className="p-3 bg-muted/30 rounded-lg text-sm mb-3">
                        <span className="text-xs font-medium text-muted-foreground block mb-1">{t("knowledge.outcome")}</span>
                        <Highlight text={selected.outcome_notes} query={search} />
                      </div>
                    )}

                    {/* D/E) Latest lesson structured */}
                    {selectedLessons[0] && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("knowledge.lessonsLearned")}</p>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                          <p className="text-sm font-medium"><Highlight text={selectedLessons[0].key_takeaway} query={search} /></p>
                        </div>
                        {selectedLessons[0].what_went_well && (
                          <div className="flex items-start gap-2 text-xs">
                            <ThumbsUp className="w-3 h-3 text-success mt-0.5 shrink-0" />
                            <span className="text-muted-foreground"><Highlight text={selectedLessons[0].what_went_well} query={search} /></span>
                          </div>
                        )}
                        {selectedLessons[0].what_went_wrong && (
                          <div className="flex items-start gap-2 text-xs">
                            <ThumbsDown className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                            <span className="text-muted-foreground"><Highlight text={selectedLessons[0].what_went_wrong} query={search} /></span>
                          </div>
                        )}
                        {selectedLessons[0].recommendations && (
                          <div className="flex items-start gap-2 text-xs">
                            <ArrowRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <span className="text-muted-foreground"><Highlight text={selectedLessons[0].recommendations} query={search} /></span>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {/* Tabs */}
                <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="lessons" className="flex-1">
                      <Lightbulb className="w-3.5 h-3.5 mr-1" /> {t("knowledge.lessonsTab")} ({selectedLessons.length})
                    </TabsTrigger>
                    <TabsTrigger value="action" className="flex-1">
                      <Zap className="w-3.5 h-3.5 mr-1" /> {t("knowledge.actionTab")}
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="flex-1">
                      <Tag className="w-3.5 h-3.5 mr-1" /> {t("knowledge.tagsTab")} ({selectedDecTags.length})
                    </TabsTrigger>
                    <TabsTrigger value="similar" className="flex-1" onClick={() => { if (selectedDecision && aiSimilarities.length === 0 && !similarLoading) fetchSimilarity(selectedDecision); }}>
                      <Brain className="w-3.5 h-3.5 mr-1" /> {t("knowledge.similarTab")} ({similarDecisions.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Lessons Tab */}
                  <TabsContent value="lessons" className="space-y-3">
                    {selectedLessons.map(l => (
                      <Card key={l.id} className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                          <p className="text-sm font-medium"><Highlight text={l.key_takeaway} query={search} /></p>
                        </div>
                        {l.what_went_well && (
                          <div className="flex items-start gap-2 text-sm">
                            <ThumbsUp className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                            <span><Highlight text={l.what_went_well} query={search} /></span>
                          </div>
                        )}
                        {l.what_went_wrong && (
                          <div className="flex items-start gap-2 text-sm">
                            <ThumbsDown className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                            <span><Highlight text={l.what_went_wrong} query={search} /></span>
                          </div>
                        )}
                        {l.recommendations && (
                          <div className="flex items-start gap-2 text-sm">
                            <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            <span><Highlight text={l.recommendations} query={search} /></span>
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(l.created_at), "dd. MMM yyyy HH:mm", { locale: dateFnsLocale })}
                        </div>
                      </Card>
                    ))}

                    <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant={selectedLessons.length === 0 ? "default" : "outline"} className="w-full">
                          <Plus className="w-4 h-4 mr-1" /> {t("knowledge.addLesson")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{t("knowledge.addLessonTitle")}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">{t("knowledge.keyTakeaway")}</label>
                            <Textarea placeholder={t("knowledge.keyTakeawayPlaceholder")} value={lessonForm.key_takeaway} onChange={e => setLessonForm(f => ({ ...f, key_takeaway: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">{t("knowledge.whatWentWell")}</label>
                            <Textarea placeholder={t("knowledge.whatWentWellPlaceholder")} value={lessonForm.what_went_well} onChange={e => setLessonForm(f => ({ ...f, what_went_well: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">{t("knowledge.whatWentWrong")}</label>
                            <Textarea placeholder={t("knowledge.whatWentWrongPlaceholder")} value={lessonForm.what_went_wrong} onChange={e => setLessonForm(f => ({ ...f, what_went_wrong: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-xs font-medium">{t("knowledge.recommendations")}</label>
                            <Textarea placeholder={t("knowledge.recommendationsPlaceholder")} value={lessonForm.recommendations} onChange={e => setLessonForm(f => ({ ...f, recommendations: e.target.value }))} />
                          </div>
                          <Button onClick={() => createLesson.mutate()} disabled={!lessonForm.key_takeaway.trim()} className="w-full">{t("knowledge.save")}</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>

                  {/* ── 6. Learning-to-Action + Template Feedback Loop ── */}
                  <TabsContent value="action" className="space-y-3">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">{t("knowledge.learningToAction")}</h4>
                      </div>

                      {/* Template Feedback Insights */}
                      {selected && (() => {
                        const catLessons = lessons.filter(l => {
                          const d = decisions.find(dd => dd.id === l.decision_id);
                          return d?.category === selected.category;
                        });
                        const failedInCat = decisions.filter(d => d.category === selected.category && d.status === "rejected");
                        const recurringIssues = catLessons.filter(l => l.what_went_wrong && l.what_went_wrong.length > 10);
                        if (catLessons.length < 2) return null;
                        return (
                          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/15">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-primary" />
                              <h5 className="text-xs font-semibold">{t("knowledge.templateFeedback", { category: tCategoryLabels[selected.category] || selected.category })}</h5>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center">
                                <p className="text-lg font-bold">{catLessons.length}</p>
                                <p className="text-[10px] text-muted-foreground">{t("knowledge.lessonsInCategory")}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-destructive">{failedInCat.length}</p>
                                <p className="text-[10px] text-muted-foreground">{t("knowledge.rejected")}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-warning">{recurringIssues.length}</p>
                                <p className="text-[10px] text-muted-foreground">{t("knowledge.recurringProblems")}</p>
                              </div>
                            </div>
                            {recurringIssues.length >= 2 && (
                              <div className="mb-2 p-2 rounded bg-warning/10 border border-warning/20">
                                <p className="text-[11px] font-medium text-warning flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {t("knowledge.templateAdjustmentRecommended")}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {t("knowledge.templateAdjustmentDesc", { count: recurringIssues.length })}
                                </p>
                              </div>
                            )}
                            <Button size="sm" variant="outline" className="w-full text-[10px] h-7 gap-1"
                              onClick={() => {
                                const suggestions = recurringIssues.map(l => l.what_went_wrong).filter(Boolean).slice(0, 3);
                                const catLabel = tCategoryLabels[selected.category] || selected.category;
                                const text = `Template-Feedback (${catLabel}):\n\nWiederkehrende Probleme:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nEmpfehlung: Pflichtfelder oder Validierungsregeln ergänzen.`;
                                navigator.clipboard.writeText(text);
                                toast.success(t("knowledge.feedbackCopied"));
                                navigate("/templates");
                              }}>
                              <FileText className="w-3 h-3" /> {t("knowledge.feedbackToTemplate")}
                            </Button>
                          </div>
                        );
                      })()}

                      {/* Action Items from Lessons (recommendations starting with →) */}
                      {(() => {
                        const actionItems: { id: string; text: string }[] = [];
                        selectedLessons.forEach(l => {
                          if (l.recommendations) {
                            l.recommendations.split("\n").forEach((line, idx) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith("→") || trimmed.startsWith("->")) {
                                actionItems.push({ id: `${l.id}-${idx}`, text: trimmed.replace(/^(→|->)\s*/, "") });
                              }
                            });
                          }
                        });

                        if (actionItems.length === 0 && selectedLessons.length === 0) {
                          return (
                            <p className="text-xs text-muted-foreground italic">{t("knowledge.noLessonsYet")}</p>
                          );
                        }

                        if (actionItems.length === 0) {
                          return (
                            <div className="text-center py-4">
                              <Zap className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Füge Lessons mit → hinzu um Actions zu generieren.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {actionItems.map(item => (
                              <label key={item.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={checkedActions.has(item.id)}
                                  onChange={() => setCheckedActions(prev => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                                    return next;
                                  })}
                                  className="w-4 h-4 rounded border-border mt-0.5"
                                />
                                <span className={`text-xs ${checkedActions.has(item.id) ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                              </label>
                            ))}
                          </div>
                        );
                      })()}

                      {selectedLessons.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <div className="border-t border-border pt-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Lesson-basierte Aktionen</p>
                          </div>
                          {selectedLessons.map(l => (
                            <div key={l.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                              <p className="text-xs font-medium">{l.key_takeaway}</p>
                              {l.recommendations && (
                                <p className="text-[11px] text-muted-foreground">
                                  <ArrowRight className="w-3 h-3 inline mr-0.5 text-primary" />{l.recommendations}
                                </p>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1"
                                  onClick={() => { navigate("/automation"); toast.info(t("knowledge.automationRuleToast")); }}>
                                  <Zap className="w-3 h-3" /> {t("knowledge.automationRule")}
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1"
                                  onClick={() => {
                                    const text = `Governance-Hinweis (aus Lesson Learned):\n• ${l.key_takeaway}${l.recommendations ? `\n→ ${l.recommendations}` : ""}${l.what_went_wrong ? `\n⚠ Problem: ${l.what_went_wrong}` : ""}`;
                                    navigator.clipboard.writeText(text);
                                    toast.success(t("knowledge.governanceCopied"));
                                    navigate("/templates");
                                  }}>
                                  <FileText className="w-3 h-3" /> {t("knowledge.templateRule")}
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1"
                                  onClick={() => {
                                    const text = `• ${l.key_takeaway}${l.recommendations ? `\n  → ${l.recommendations}` : ""}`;
                                    navigator.clipboard.writeText(text);
                                    toast.success(t("knowledge.copiedToClipboard"));
                                  }}>
                                  <ClipboardCheck className="w-3 h-3" /> {t("knowledge.copy")}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Tags Tab */}
                  <TabsContent value="tags">
                    <Card className="p-4">
                      <h4 className="text-sm font-medium mb-3">{t("knowledge.manageTags")}</h4>
                      {selectedDecTags.length === 0 && tags.length === 0 ? (
                        <div className="text-center py-6">
                          <Tag className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground mb-3">Keine Tags vergeben</p>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowFilters(true)}>
                            <Plus className="w-3 h-3 mr-1" /> Tags hinzufügen
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => {
                            const link = decisionTags.find(dt => dt.decision_id === selectedDecision && dt.tag_id === tag.id);
                            const isLinked = !!link;
                            return (
                              <button key={tag.id} onClick={() => toggleTag.mutate({ decisionId: selectedDecision!, tagId: tag.id, exists: isLinked, linkId: link?.id })}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${isLinked ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                {tag.name}
                                {isLinked && <X className="w-3 h-3" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* ── 5. Similarity Engine ──────────────────────────── */}
                  <TabsContent value="similar" className="space-y-3">
                    {similarLoading && (
                      <Card className="p-6 text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{t("knowledge.aiAnalyzing")}</p>
                      </Card>
                    )}
                    {similarError && (
                      <Card className="p-4 text-center">
                        <p className="text-sm text-destructive">{similarError}</p>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => fetchSimilarity(selectedDecision!)}>{t("knowledge.retryAnalysis")}</Button>
                      </Card>
                    )}
                    {!similarLoading && !similarError && similarDecisions.length === 0 && aiSimilarities.length === 0 && (
                      <Card className="p-6 text-center">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">Noch keine ähnlichen Entscheidungen gefunden</p>
                        <p className="text-xs text-muted-foreground mb-3">Wird automatisch befüllt wenn mehr Entscheidungen archiviert sind.</p>
                        <Button size="sm" variant="outline" onClick={() => fetchSimilarity(selectedDecision!)}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> {t("knowledge.startAnalysis")}
                        </Button>
                      </Card>
                    )}
                    {!similarLoading && similarDecisions.length === 0 && aiSimilarities.length > 0 && (
                      <Card className="p-6 text-center text-muted-foreground text-sm">{t("knowledge.noSimilarFound")}</Card>
                    )}
                    {similarDecisions.map(({ decision: d, score, reason }) => {
                      const dLessons = lessonsMap.get(d.id) || [];
                      return (
                        <Card key={d.id} className="p-3 cursor-pointer hover:bg-muted/30 transition-all"
                          onClick={() => { setSelectedDecision(d.id); setAiSimilarities([]); }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium truncate">{d.title}</h4>
                                <Badge variant="outline" className="text-[10px] shrink-0 font-bold tabular-nums">{score}%</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{tStatusLabels[d.status] ?? d.status}</Badge>
                                <Badge variant="outline" className="text-[10px]">{tCategoryLabels[d.category] ?? d.category}</Badge>
                                {dLessons.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Lightbulb className="w-3 h-3" /> {dLessons.length}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1.5 italic">{reason}</p>
                              <Progress value={score} className="h-1 mt-2" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </Card>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default KnowledgeBase;

import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import {
  BookOpen, Search, Tag, Plus, Lightbulb, ThumbsUp, ThumbsDown,
  ArrowRight, Clock, Users, X, Sparkles, FileText, ChevronRight, Download, Loader2, Brain,
} from "lucide-react";
import { generateLessonsReport } from "@/lib/generateLessonsReport";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
/*  Tag colors                                                         */
/* ------------------------------------------------------------------ */
const TAG_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
const KnowledgeBase = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Lesson form
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
        .select("id,title,description,category,priority,status,outcome_notes,implemented_at,created_at,created_by,team_id")
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kb-tags"] }); setNewTagName(""); toast.success("Tag erstellt"); },
    onError: () => toast.error("Tag existiert bereits"),
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
      toast.success("Lesson Learned gespeichert");
    },
  });

  /* --- Derived data --- */
  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);

  const filteredDecisions = useMemo(() => {
    let list = decisions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.outcome_notes?.toLowerCase().includes(q));
    }
    if (selectedTags.length > 0) {
      const decIdsWithTags = new Set(
        decisionTags.filter(dt => selectedTags.includes(dt.tag_id)).map(dt => dt.decision_id)
      );
      list = list.filter(d => decIdsWithTags.has(d.id));
    }
    return list;
  }, [decisions, search, selectedTags, decisionTags]);

  const selected = decisions.find(d => d.id === selectedDecision);
  const selectedLessons = lessons.filter(l => l.decision_id === selectedDecision);
  const selectedDecTags = decisionTags.filter(dt => dt.decision_id === selectedDecision);

  // AI-based similarity
  const [aiSimilarities, setAiSimilarities] = useState<{ decision_id: string; score: number; reason: string }[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState<string | null>(null);

  const fetchSimilarity = async (decId: string) => {
    setSimilarLoading(true);
    setSimilarError(null);
    setAiSimilarities([]);
    try {
      const { data, error } = await supabase.functions.invoke("similarity-score", {
        body: { decisionId: decId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSimilarities(data?.similarities ?? []);
    } catch (e: any) {
      console.error("Similarity error:", e);
      setSimilarError(e.message || "Fehler bei der Ähnlichkeitsanalyse");
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

  /* --- Stats --- */
  const totalLessons = lessons.length;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    decisions.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return counts;
  }, [decisions]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Wissen</p>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Lessons Learned aus {decisions.length} abgeschlossenen Entscheidungen
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateLessonsReport(decisions, lessons, tags, decisionTags)}
            disabled={decisions.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            PDF-Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Entscheidungen", value: decisions.length, icon: FileText },
            { label: "Lessons Learned", value: totalLessons, icon: Lightbulb },
            { label: "Tags", value: tags.length, icon: Tag },
            { label: "Kategorien", value: Object.keys(categoryCounts).length, icon: Users },
          ].map(s => (
            <Card key={s.label} className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Search & Tag filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Entscheidungen, Learnings oder Keywords suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filter:</span>
            {tags.map(tag => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTags(prev => active ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                  {active && <X className="w-3 h-3" />}
                </button>
              );
            })}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Neuer Tag…"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                className="h-7 w-28 text-xs"
                onKeyDown={e => { if (e.key === "Enter" && newTagName.trim()) createTag.mutate(newTagName.trim()); }}
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => newTagName.trim() && createTag.mutate(newTagName.trim())}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Decision list */}
          <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filteredDecisions.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Keine abgeschlossenen Entscheidungen gefunden</p>
              </Card>
            )}
            {filteredDecisions.map(d => {
              const dTags = getDecisionTags(d.id);
              const dLessons = lessons.filter(l => l.decision_id === d.id);
              const isActive = selectedDecision === d.id;
              return (
                  <Card
                  key={d.id}
                  className={`p-3 cursor-pointer transition-all ${isActive ? "border-foreground/20 bg-muted/40" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedDecision(d.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{d.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] ?? d.category}</Badge>
                        <Badge variant={d.status === "implemented" ? "default" : d.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                          {statusLabels[d.status] ?? d.status}
                        </Badge>
                        {dLessons.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Lightbulb className="w-3 h-3" /> {dLessons.length}
                          </span>
                        )}
                      </div>
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
                      {format(new Date(d.implemented_at), "dd. MMM yyyy", { locale: de })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {!selected ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Entscheidung auswählen</p>
                <p className="text-xs mt-1">Wähle links eine abgeschlossene Entscheidung um Lessons Learned und ähnliche Fälle zu sehen.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Decision header */}
                <Card className="p-4">
                  <h2 className="font-semibold text-lg">{selected.title}</h2>
                  {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{categoryLabels[selected.category] ?? selected.category}</Badge>
                    <Badge variant="outline">{priorityLabels[selected.priority] ?? selected.priority}</Badge>
                    <Badge variant={selected.status === "implemented" ? "default" : "destructive"}>
                      {statusLabels[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                  {selected.outcome_notes && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">Ergebnis</span>
                      {selected.outcome_notes}
                    </div>
                  )}
                </Card>

                <Tabs defaultValue="lessons" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="lessons" className="flex-1">
                      <Lightbulb className="w-3.5 h-3.5 mr-1" /> Lessons ({selectedLessons.length})
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="flex-1">
                      <Tag className="w-3.5 h-3.5 mr-1" /> Tags ({selectedDecTags.length})
                    </TabsTrigger>
                    <TabsTrigger value="similar" className="flex-1" onClick={() => { if (selectedDecision && aiSimilarities.length === 0 && !similarLoading) fetchSimilarity(selectedDecision); }}>
                      <Brain className="w-3.5 h-3.5 mr-1" /> KI-Ähnliche ({similarDecisions.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Lessons */}
                  <TabsContent value="lessons" className="space-y-3">
                    {selectedLessons.map(l => (
                      <Card key={l.id} className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                          <p className="text-sm font-medium">{l.key_takeaway}</p>
                        </div>
                        {l.what_went_well && (
                          <div className="flex items-start gap-2 text-sm">
                            <ThumbsUp className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                            <span>{l.what_went_well}</span>
                          </div>
                        )}
                        {l.what_went_wrong && (
                          <div className="flex items-start gap-2 text-sm">
                            <ThumbsDown className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                            <span>{l.what_went_wrong}</span>
                          </div>
                        )}
                        {l.recommendations && (
                          <div className="flex items-start gap-2 text-sm">
                            <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{l.recommendations}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(l.created_at), "dd. MMM yyyy HH:mm", { locale: de })}
                        </div>
                      </Card>
                    ))}

                    <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-1" /> Lesson Learned hinzufügen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Lesson Learned erfassen</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Kernerkenntnis *</label>
                            <Textarea
                              placeholder="Was ist die wichtigste Erkenntnis?"
                              value={lessonForm.key_takeaway}
                              onChange={e => setLessonForm(f => ({ ...f, key_takeaway: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Was lief gut?</label>
                            <Textarea
                              placeholder="Erfolgsfaktoren…"
                              value={lessonForm.what_went_well}
                              onChange={e => setLessonForm(f => ({ ...f, what_went_well: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Was lief schlecht?</label>
                            <Textarea
                              placeholder="Probleme und Hindernisse…"
                              value={lessonForm.what_went_wrong}
                              onChange={e => setLessonForm(f => ({ ...f, what_went_wrong: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Empfehlungen</label>
                            <Textarea
                              placeholder="Was sollte nächstes Mal anders gemacht werden?"
                              value={lessonForm.recommendations}
                              onChange={e => setLessonForm(f => ({ ...f, recommendations: e.target.value }))}
                            />
                          </div>
                          <Button onClick={() => createLesson.mutate()} disabled={!lessonForm.key_takeaway.trim()} className="w-full">
                            Speichern
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TabsContent>

                  {/* Tags */}
                  <TabsContent value="tags">
                    <Card className="p-4">
                      <h4 className="text-sm font-medium mb-3">Tags verwalten</h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => {
                          const link = decisionTags.find(dt => dt.decision_id === selectedDecision && dt.tag_id === tag.id);
                          const isLinked = !!link;
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag.mutate({ decisionId: selectedDecision!, tagId: tag.id, exists: isLinked, linkId: link?.id })}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                isLinked ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                              {isLinked && <X className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                      {tags.length === 0 && (
                        <p className="text-xs text-muted-foreground">Erstelle oben in der Filterleiste neue Tags.</p>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Similar - AI powered */}
                  <TabsContent value="similar" className="space-y-3">
                    {similarLoading && (
                      <Card className="p-6 text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">KI analysiert Ähnlichkeiten…</p>
                      </Card>
                    )}
                    {similarError && (
                      <Card className="p-4 text-center">
                        <p className="text-sm text-destructive">{similarError}</p>
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => fetchSimilarity(selectedDecision!)}>
                          Erneut versuchen
                        </Button>
                      </Card>
                    )}
                    {!similarLoading && !similarError && similarDecisions.length === 0 && aiSimilarities.length === 0 && (
                      <Card className="p-6 text-center">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-30 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Klicke auf diesen Tab um die KI-Ähnlichkeitsanalyse zu starten</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => fetchSimilarity(selectedDecision!)}>
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> Analyse starten
                        </Button>
                      </Card>
                    )}
                    {!similarLoading && similarDecisions.length === 0 && aiSimilarities.length > 0 && (
                      <Card className="p-6 text-center text-muted-foreground text-sm">
                        Keine ähnlichen Entscheidungen gefunden
                      </Card>
                    )}
                    {similarDecisions.map(({ decision: d, score, reason }) => {
                      const dLessons = lessons.filter(l => l.decision_id === d.id);
                      return (
                        <Card
                          key={d.id}
                          className="p-3 cursor-pointer hover:bg-muted/30 transition-all"
                          onClick={() => { setSelectedDecision(d.id); setAiSimilarities([]); }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium truncate">{d.title}</h4>
                                <Badge variant="outline" className="text-[10px] shrink-0 font-bold tabular-nums">
                                  {score}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{statusLabels[d.status] ?? d.status}</Badge>
                                <Badge variant="outline" className="text-[10px]">{categoryLabels[d.category] ?? d.category}</Badge>
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

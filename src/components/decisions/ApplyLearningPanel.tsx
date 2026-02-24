import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, ThumbsUp, ThumbsDown, Pin, PinOff, ChevronDown, ChevronUp,
  BookOpen, Sparkles, Loader2, Target, RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface LessonWithDecision {
  id: string;
  decision_id: string;
  key_takeaway: string;
  what_went_well: string | null;
  what_went_wrong: string | null;
  recommendations: string | null;
  created_at: string;
  decision?: {
    id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
  };
}

interface AiSuggestion {
  lesson_id: string;
  decision_id: string;
  decision_title: string;
  decision_category: string;
  key_takeaway: string;
  what_went_well: string | null;
  what_went_wrong: string | null;
  recommendations: string | null;
  score: number;
  reason: string;
  application_tip: string;
}

interface ApplyLearningPanelProps {
  title: string;
  description: string;
  category: string;
  pinnedLessons: LessonWithDecision[];
  onPinnedChange: (lessons: LessonWithDecision[]) => void;
}

const textSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^\wäöüß]/g, " ").split(/\s+/).filter(w => w.length > 2);
  const wordsA = new Set(normalize(a));
  const wordsB = normalize(b);
  if (wordsA.size === 0 || wordsB.length === 0) return 0;
  const matches = wordsB.filter(w => wordsA.has(w)).length;
  return matches / Math.max(wordsA.size, wordsB.length);
};

const ApplyLearningPanel = ({
  title, description, category, pinnedLessons, onPinnedChange,
}: ApplyLearningPanelProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTriggered, setAiTriggered] = useState(false);

  const { data: allLessons = [] } = useQuery<LessonWithDecision[]>({
    queryKey: ["apply-learning-lessons"],
    queryFn: async () => {
      const { data: lessons } = await supabase
        .from("lessons_learned")
        .select("id, decision_id, key_takeaway, what_went_well, what_went_wrong, recommendations, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!lessons?.length) return [];
      const decisionIds = [...new Set(lessons.map(l => l.decision_id))];
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title, category, priority, status")
        .in("id", decisionIds);
      const decMap = new Map((decisions ?? []).map(d => [d.id, d]));
      return lessons
        .map(l => ({ ...l, decision: decMap.get(l.decision_id) }))
        .filter(l => l.decision) as LessonWithDecision[];
    },
    staleTime: 60_000,
  });

  const rankedLessons = useMemo(() => {
    if (!title.trim() && !category) return [];
    const inputText = `${title} ${description}`.trim();
    return allLessons
      .map(l => {
        const lessonText = [l.key_takeaway, l.recommendations, l.what_went_well, l.what_went_wrong, l.decision?.title]
          .filter(Boolean).join(" ");
        const textScore = textSimilarity(inputText, lessonText);
        const catBonus = l.decision?.category === category ? 0.3 : 0;
        const daysSince = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, (1 - daysSince / 365) * 0.1);
        const score = textScore + catBonus + recencyBonus;
        return { ...l, score };
      })
      .filter(l => l.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [allLessons, title, description, category]);

  const fetchAiSuggestions = useCallback(async () => {
    if (!title.trim() || title.length < 5) return;
    setAiLoading(true);
    setAiError(null);
    setAiTriggered(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-knowledge", {
        body: { title, description, category },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSuggestions(data?.suggestions || []);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t("applyLearning.aiFailed"));
    } finally {
      setAiLoading(false);
    }
  }, [title, description, category, t]);

  useEffect(() => {
    if ((rankedLessons.length > 0 || aiSuggestions.length > 0) && title.length > 5 && pinnedLessons.length === 0) {
      setExpanded(true);
    }
  }, [rankedLessons.length, aiSuggestions.length, title]);

  const topLessons = rankedLessons.slice(0, 3);
  const isPinned = (id: string) => pinnedLessons.some(l => l.id === id);

  const togglePin = (lesson: LessonWithDecision) => {
    if (isPinned(lesson.id)) {
      onPinnedChange(pinnedLessons.filter(l => l.id !== lesson.id));
    } else {
      onPinnedChange([...pinnedLessons, lesson]);
    }
  };

  const togglePinAi = (suggestion: AiSuggestion) => {
    const asLesson: LessonWithDecision = {
      id: suggestion.lesson_id,
      decision_id: suggestion.decision_id,
      key_takeaway: suggestion.key_takeaway,
      what_went_well: suggestion.what_went_well,
      what_went_wrong: suggestion.what_went_wrong,
      recommendations: suggestion.recommendations,
      created_at: "",
      decision: {
        id: suggestion.decision_id,
        title: suggestion.decision_title,
        category: suggestion.decision_category,
        priority: "",
        status: "",
      },
    };
    if (isPinned(suggestion.lesson_id)) {
      onPinnedChange(pinnedLessons.filter(l => l.id !== suggestion.lesson_id));
    } else {
      onPinnedChange([...pinnedLessons, asLesson]);
    }
  };

  const hasContent = topLessons.length > 0 || pinnedLessons.length > 0 || aiSuggestions.length > 0 || allLessons.length > 0;
  if (!hasContent) return null;

  return (
    <div className="pt-3 border-t border-border">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium flex-1">
          {t("applyLearning.smartKnowledge")}
          {pinnedLessons.length > 0 && (
            <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/30">
              {t("applyLearning.pinned", { count: pinnedLessons.length })}
            </Badge>
          )}
        </span>
        {aiSuggestions.length > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
            <Sparkles className="w-2.5 h-2.5" />
            {t("applyLearning.aiCount", { count: aiSuggestions.length })}
          </Badge>
        )}
        {topLessons.length > 0 && !aiTriggered && (
          <Badge variant="outline" className="text-[10px] gap-1">
            {t("applyLearning.similarCount", { count: topLessons.length })}
          </Badge>
        )}
        {expanded
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
          {!aiTriggered && allLessons.length > 0 && title.length >= 5 && (
            <button
              type="button"
              onClick={fetchAiSuggestions}
              disabled={aiLoading}
              className="w-full p-2.5 rounded-lg border border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors flex items-center gap-2 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-primary">{t("applyLearning.aiDeepAnalysis")}</span>
              <span className="text-muted-foreground ml-auto">{t("applyLearning.aiDeepDesc")}</span>
            </button>
          )}

          {aiLoading && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/[0.03] flex items-center gap-2 text-xs">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-muted-foreground">{t("applyLearning.aiSearching")}</span>
            </div>
          )}

          {aiError && (
            <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-destructive flex items-center justify-between">
              <span>{aiError}</span>
              <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={fetchAiSuggestions}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          )}

          {aiSuggestions.map((s) => (
            <div
              key={s.lesson_id}
              className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                isPinned(s.lesson_id)
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/10"
                  : "bg-muted/30 border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground flex items-start gap-1.5 flex-1">
                  <Lightbulb className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{s.key_takeaway}</span>
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">
                    {s.score}%
                  </Badge>
                  <Button
                    type="button"
                    variant={isPinned(s.lesson_id) ? "default" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => togglePinAi(s)}
                  >
                    {isPinned(s.lesson_id) ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <p className="text-muted-foreground pl-4 italic">{s.reason}</p>

              <div className="flex items-start gap-1.5 pl-4 text-primary/80">
                <Target className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{s.application_tip}</span>
              </div>

              {s.what_went_well && (
                <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
                  <ThumbsUp className="w-3 h-3 text-success mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{s.what_went_well}</span>
                </p>
              )}
              {s.what_went_wrong && (
                <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
                  <ThumbsDown className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{s.what_went_wrong}</span>
                </p>
              )}

              <div className="flex items-center gap-2 pl-4">
                <span className="text-[10px] text-muted-foreground/60">
                  {t("applyLearning.from")}: {s.decision_title}
                </span>
                {s.decision_category && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {t(`category.${s.decision_category}`, { defaultValue: s.decision_category })}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {!aiTriggered && (
            <>
              {pinnedLessons.filter(p => !topLessons.some(tl => tl.id === p.id)).map(l => (
                <LessonCard key={`pinned-${l.id}`} lesson={l} pinned onTogglePin={() => togglePin(l)} />
              ))}
              {topLessons.map((l, i) => (
                <LessonCard key={l.id} lesson={l} pinned={isPinned(l.id)} rank={i + 1} onTogglePin={() => togglePin(l)} />
              ))}
            </>
          )}

          {topLessons.length === 0 && pinnedLessons.length === 0 && aiSuggestions.length === 0 && !aiLoading && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("applyLearning.noResults")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const LessonCard = ({
  lesson, pinned, rank, onTogglePin,
}: {
  lesson: LessonWithDecision;
  pinned: boolean;
  rank?: number;
  onTogglePin: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
      pinned
        ? "bg-primary/5 border-primary/30 ring-1 ring-primary/10"
        : "bg-muted/30 border-border hover:border-primary/20"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground flex items-start gap-1.5 flex-1">
          <Lightbulb className="w-3 h-3 text-warning mt-0.5 shrink-0" />
          <span className="line-clamp-2">{lesson.key_takeaway}</span>
        </p>
        <Button
          type="button"
          variant={pinned ? "default" : "ghost"}
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onTogglePin}
          title={pinned ? t("applyLearning.unpin") : t("applyLearning.pin")}
        >
          {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
        </Button>
      </div>

      {lesson.what_went_well && (
        <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
          <ThumbsUp className="w-3 h-3 text-success mt-0.5 shrink-0" />
          <span className="line-clamp-1">{lesson.what_went_well}</span>
        </p>
      )}
      {lesson.what_went_wrong && (
        <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
          <ThumbsDown className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
          <span className="line-clamp-1">{lesson.what_went_wrong}</span>
        </p>
      )}
      {lesson.recommendations && (
        <p className="text-primary/80 flex items-start gap-1.5 pl-4 italic">
          <span className="line-clamp-1">→ {lesson.recommendations}</span>
        </p>
      )}

      <div className="flex items-center gap-2 pl-4">
        <span className="text-[10px] text-muted-foreground/60">
          {t("applyLearning.from")}: {lesson.decision?.title}
        </span>
        {lesson.decision?.category && (
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            {t(`category.${lesson.decision.category}`, { defaultValue: lesson.decision.category })}
          </Badge>
        )}
        {pinned && (
          <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/30">
            <Pin className="w-2 h-2 mr-0.5" /> {t("applyLearning.reference")}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ApplyLearningPanel;

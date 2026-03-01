import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, Loader2, AlertTriangle, Clock, Shield, Users,
  FileText, ArrowRight, Tag, Flag, Search, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

/* ── Types ── */
interface AiSuggestions {
  improvedTitle?: string;
  suggestedCategory?: string;
  suggestedPriority?: string;
  suggestedTemplate?: string;
  suggestedReviewers?: string[];
  suggestedSlaDays?: number;
  riskLevel?: "low" | "medium" | "high";
  riskReason?: string;
  risks?: string[];
  affectedTeams?: string[];
  similarDecisions?: string[];
}

interface AiAssistantSidebarProps {
  title: string;
  description: string;
  category: string;
  priority: string;
  onApplyTitle: (title: string) => void;
  onApplyCategory: (category: string) => void;
  onApplyPriority: (priority: string) => void;
  onApplyTemplate: (templateName: string) => void;
  onApplySlaDays: (days: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "HR",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch",
};
const RISK_STYLES: Record<string, { color: string; label: string }> = {
  low: { color: "text-success", label: "Niedrig" },
  medium: { color: "text-warning", label: "Mittel" },
  high: { color: "text-destructive", label: "Hoch" },
};

const AiAssistantSidebar = ({
  title, description, category, priority,
  onApplyTitle, onApplyCategory, onApplyPriority, onApplyTemplate, onApplySlaDays,
}: AiAssistantSidebarProps) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<AiSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>("");

  const fetchSuggestions = useCallback(async (t: string, d: string, c: string, p: string) => {
    const queryKey = `${t}|${d}|${c}|${p}`;
    if (queryKey === lastQueryRef.current) return;
    lastQueryRef.current = queryKey;

    setLoading(true);
    setError(null);
    setAppliedItems(new Set());

    try {
      const { data, error: fnError } = await supabase.functions.invoke("decision-suggestions", {
        body: { title: t, description: d, category: c, priority: p },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSuggestions(data as AiSuggestions);
    } catch (e: any) {
      console.error("AI suggestions error:", e);
      setError(e.message || "Fehler beim Laden");
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger on title (>10 chars) or description (>50 chars)
  useEffect(() => {
    const shouldFetch = title.length >= 10;
    if (!shouldFetch) {
      setSuggestions(null);
      setError(null);
      lastQueryRef.current = "";
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(title, description, category, priority);
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, description, category, priority, fetchSuggestions]);

  const handleApply = (key: string, action: () => void) => {
    action();
    setAppliedItems(prev => new Set(prev).add(key));
  };

  const s = suggestions;
  const risk = s?.riskLevel ? RISK_STYLES[s.riskLevel] : null;
  const hasDescription = description.length >= 50;

  return (
    <div className="rounded-xl border-l-4 border-l-[hsl(217,91%,60%)] bg-[hsl(214,100%,97%)] dark:bg-[hsl(217,50%,12%)] p-4 space-y-4 h-fit sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[hsl(217,91%,60%)]" />
        <span className="text-sm font-semibold text-[hsl(217,91%,60%)]">✨ KI-Assistent</span>
      </div>

      {/* Empty state */}
      {!loading && !s && !error && (
        <p className="text-xs text-muted-foreground italic">
          Titel eingeben um Vorschläge zu erhalten
        </p>
      )}

      {/* Loading shimmer */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}

      {/* Suggestions */}
      <AnimatePresence>
        {s && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Category */}
            {s.suggestedCategory && s.suggestedCategory !== category && (
              <SuggestionCard
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Empfohlene Kategorie"
                value={`${CATEGORY_LABELS[s.suggestedCategory] || s.suggestedCategory} ✓`}
                applied={appliedItems.has("category")}
                onApply={() => handleApply("category", () => onApplyCategory(s.suggestedCategory!))}
              />
            )}

            {/* Priority */}
            {s.suggestedPriority && s.suggestedPriority !== priority && (
              <SuggestionCard
                icon={<Flag className="w-3.5 h-3.5" />}
                label="Empfohlene Priorität"
                value={PRIORITY_LABELS[s.suggestedPriority] || s.suggestedPriority}
                applied={appliedItems.has("priority")}
                onApply={() => handleApply("priority", () => onApplyPriority(s.suggestedPriority!))}
              />
            )}

            {/* SLA */}
            {s.suggestedSlaDays && (
              <SuggestionCard
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Empfohlenes SLA"
                value={`${s.suggestedSlaDays} Tage`}
                applied={appliedItems.has("sla")}
                onApply={() => handleApply("sla", () => onApplySlaDays(s.suggestedSlaDays!))}
              />
            )}

            {/* Template */}
            {s.suggestedTemplate && (
              <SuggestionCard
                icon={<Shield className="w-3.5 h-3.5" />}
                label="Template verfügbar"
                value={s.suggestedTemplate}
                applied={appliedItems.has("template")}
                onApply={() => handleApply("template", () => onApplyTemplate(s.suggestedTemplate!))}
                applyLabel="Template laden →"
              />
            )}

            {/* Improved Title */}
            {s.improvedTitle && s.improvedTitle !== title && (
              <SuggestionCard
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Verbesserter Titel"
                value={s.improvedTitle}
                applied={appliedItems.has("title")}
                onApply={() => handleApply("title", () => onApplyTitle(s.improvedTitle!))}
              />
            )}

            {/* Similar Decisions */}
            {s.similarDecisions && s.similarDecisions.length > 0 && (
              <div className="rounded-lg bg-background/60 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <Search className="w-3 h-3" /> Ähnliche Entscheidungen
                </div>
                {s.similarDecisions.map((d, i) => (
                  <p key={i} className="text-xs text-foreground/80 pl-4">• {d}</p>
                ))}
              </div>
            )}

            {/* Description-triggered: Risks */}
            {hasDescription && s.risks && s.risks.length > 0 && (
              <div className="rounded-lg bg-background/60 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <AlertTriangle className="w-3 h-3 text-warning" /> Erkannte Risiken
                </div>
                {s.risks.map((r, i) => (
                  <p key={i} className="text-xs text-foreground/80 pl-4">• {r}</p>
                ))}
              </div>
            )}

            {/* Description-triggered: Affected Teams */}
            {hasDescription && s.affectedTeams && s.affectedTeams.length > 0 && (
              <div className="rounded-lg bg-background/60 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <Users className="w-3 h-3" /> Betroffene Teams
                </div>
                {s.affectedTeams.map((t, i) => (
                  <p key={i} className="text-xs text-foreground/80 pl-4">• {t}</p>
                ))}
              </div>
            )}

            {/* Description-triggered: Reviewers */}
            {hasDescription && s.suggestedReviewers && s.suggestedReviewers.length > 0 && (
              <div className="rounded-lg bg-background/60 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <Users className="w-3 h-3" /> Empfohlene Reviewer
                </div>
                <div className="flex flex-wrap gap-1 mt-1 pl-4">
                  {s.suggestedReviewers.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {risk && (
              <div className="rounded-lg bg-background/60 p-2.5 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  <Lightbulb className="w-3 h-3" /> Risiko-Einschätzung
                </div>
                <p className={`text-xs font-semibold ${risk.color}`}>{risk.label}</p>
                {s.riskReason && (
                  <p className="text-[10px] text-muted-foreground">{s.riskReason}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Suggestion Card subcomponent ── */
const SuggestionCard = ({
  icon, label, value, applied, onApply, applyLabel = "Übernehmen",
}: {
  icon: React.ReactNode; label: string; value: string;
  applied: boolean; onApply: () => void; applyLabel?: string;
}) => (
  <div className="rounded-lg bg-background/60 p-2.5 space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
      {icon} {label}
    </div>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium truncate flex-1">{value}</p>
      <Button
        type="button"
        size="sm"
        variant={applied ? "default" : "outline"}
        className="h-6 px-2 text-[10px] gap-1 shrink-0"
        onClick={onApply}
        disabled={applied}
      >
        {applied ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        {applied ? "✓" : applyLabel}
      </Button>
    </div>
  </div>
);

export default AiAssistantSidebar;

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Loader2, AlertTriangle, Clock, Shield, Users, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Suggestions {
  improvedTitle: string;
  suggestedTemplate: string;
  suggestedReviewers: string[];
  suggestedSlaDays: number;
  riskLevel: "low" | "medium" | "high";
  riskReason: string;
}

interface AiSuggestionsPanelProps {
  title: string;
  description: string;
  category: string;
  priority: string;
  onApplyTitle: (title: string) => void;
  onApplyTemplate: (templateName: string) => void;
  onApplySlaDays: (days: number) => void;
}

const RISK_STYLES: Record<string, { color: string; label: string; labelEn: string }> = {
  low: { color: "text-success", label: "Niedrig", labelEn: "Low" },
  medium: { color: "text-warning", label: "Mittel", labelEn: "Medium" },
  high: { color: "text-destructive", label: "Hoch", labelEn: "High" },
};

const AiSuggestionsPanel = ({
  title, description, category, priority,
  onApplyTitle, onApplyTemplate, onApplySlaDays,
}: AiSuggestionsPanelProps) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>("");

  const fetchSuggestions = useCallback(async (currentTitle: string, currentDesc: string) => {
    const queryKey = `${currentTitle}|${currentDesc}|${category}|${priority}`;
    if (queryKey === lastQueryRef.current) return;
    lastQueryRef.current = queryKey;

    setLoading(true);
    setError(null);
    setAppliedItems(new Set());

    try {
      const { data, error: fnError } = await supabase.functions.invoke("decision-suggestions", {
        body: { title: currentTitle, description: currentDesc, category, priority },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSuggestions(data as Suggestions);
    } catch (e: any) {
      console.error("AI suggestions error:", e);
      setError(e.message || "Fehler beim Laden der Vorschläge");
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  }, [category, priority]);

  useEffect(() => {
    if (title.length < 10) {
      setSuggestions(null);
      setError(null);
      lastQueryRef.current = "";
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(title, description);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, description, fetchSuggestions]);

  const handleApply = (key: string, action: () => void) => {
    action();
    setAppliedItems(prev => new Set(prev).add(key));
  };

  if (title.length < 10 && !loading && !suggestions) return null;

  const risk = suggestions ? RISK_STYLES[suggestions.riskLevel] || RISK_STYLES.medium : null;

  return (
    <AnimatePresence>
      {(loading || suggestions || error) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {isEn ? "AI Suggestions" : "KI-Vorschläge"}
            </span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/60" />}
          </div>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {error}
            </p>
          )}

          {suggestions && (
            <div className="space-y-2.5">
              {/* Improved Title */}
              {suggestions.improvedTitle && suggestions.improvedTitle !== title && (
                <SuggestionRow
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label={isEn ? "Improved title" : "Verbesserter Titel"}
                  value={suggestions.improvedTitle}
                  applied={appliedItems.has("title")}
                  onApply={() => handleApply("title", () => onApplyTitle(suggestions.improvedTitle))}
                />
              )}

              {/* Suggested Template */}
              {suggestions.suggestedTemplate && (
                <SuggestionRow
                  icon={<Shield className="w-3.5 h-3.5" />}
                  label={isEn ? "Recommended template" : "Empfohlene Vorlage"}
                  value={suggestions.suggestedTemplate}
                  applied={appliedItems.has("template")}
                  onApply={() => handleApply("template", () => onApplyTemplate(suggestions.suggestedTemplate))}
                />
              )}

              {/* Suggested Reviewers */}
              {suggestions.suggestedReviewers && suggestions.suggestedReviewers.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isEn ? "Recommended reviewers" : "Empfohlene Reviewer"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {suggestions.suggestedReviewers.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{r}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Suggested SLA */}
              {suggestions.suggestedSlaDays && (
                <SuggestionRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label={isEn ? "Recommended SLA" : "Empfohlene SLA-Dauer"}
                  value={`${suggestions.suggestedSlaDays} ${isEn ? "days" : "Tage"}`}
                  applied={appliedItems.has("sla")}
                  onApply={() => handleApply("sla", () => onApplySlaDays(suggestions.suggestedSlaDays))}
                />
              )}

              {/* Risk Assessment */}
              {risk && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 ${risk.color}`} />
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {isEn ? "Risk assessment" : "Risiko-Einschätzung"}
                    </p>
                    <p className={`text-xs font-semibold ${risk.color}`}>
                      {isEn ? risk.labelEn : risk.label}
                    </p>
                    {suggestions.riskReason && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{suggestions.riskReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SuggestionRow = ({
  icon, label, value, applied, onApply,
}: {
  icon: React.ReactNode; label: string; value: string;
  applied: boolean; onApply: () => void;
}) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
    <Button
      type="button"
      size="sm"
      variant={applied ? "default" : "outline"}
      className="h-6 px-2 text-[10px] gap-1 shrink-0"
      onClick={onApply}
      disabled={applied}
    >
      {applied ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
      {applied ? (applied ? "✓" : "OK") : "Übernehmen"}
    </Button>
  </div>
);

export default AiSuggestionsPanel;

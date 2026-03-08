import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface AiSuggestion {
  category: string;
  priority: string;
  sla_days: number;
  risk_score: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Strategisch",
  operational: "Operativ",
  technical: "Technisch",
  budget: "Budget",
  hr: "Personal",
  marketing: "Marketing",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

interface Props {
  onCreateDecision: (data: {
    title: string;
    category: string;
    priority: string;
    sla_days: number;
    colleagueEmail?: string;
  }) => void;
  loading: boolean;
  slideAnim: Record<string, unknown>;
}

const SmartDecisionStep = ({ onCreateDecision, loading, slideAnim }: Props) => {
  const [freeText, setFreeText] = useState("");
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [category, setCategory] = useState("operational");
  const [priority, setPriority] = useState("medium");
  const [slaDays, setSlaDays] = useState(7);
  const [colleagueEmail, setColleagueEmail] = useState("");
  const [showFields, setShowFields] = useState(false);

  // Debounced AI analysis
  const analyzeText = useCallback(async (text: string) => {
    if (text.length < 15) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("decision-suggestions", {
        body: { title: text },
      });
      if (!error && data) {
        const riskMap: Record<string, number> = { low: 20, medium: 50, high: 80 };
        const s: AiSuggestion = {
          category: data.suggestedCategory || "operational",
          priority: data.suggestedPriority || "medium",
          sla_days: data.suggestedSlaDays || 7,
          risk_score: riskMap[data.riskLevel] || 30,
        };
        setSuggestion(s);
        setCategory(s.category);
        setPriority(s.priority);
        setSlaDays(s.sla_days);
        setShowFields(true);
      }
    } catch {
      // Fallback: show fields with defaults
      setShowFields(true);
    }
    setAiLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (freeText.trim().length >= 15) analyzeText(freeText.trim());
    }, 800);
    return () => clearTimeout(timer);
  }, [freeText, analyzeText]);

  const handleSubmit = () => {
    onCreateDecision({
      title: freeText.trim(),
      category,
      priority,
      sla_days: slaDays,
      colleagueEmail: colleagueEmail.trim() || undefined,
    });
  };

  return (
    <motion.div key="smart" {...slideAnim} className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welche Entscheidung liegt gerade auf dem Tisch?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Beschreiben Sie kurz — unsere KI füllt den Rest aus.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="z.B. Sollen wir das ERP-System auf SAP S/4HANA migrieren? Budget ca. 500k, Timeline Q3"
          className="min-h-[80px] resize-none"
          autoFocus
        />

        {aiLoading && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>KI analysiert...</span>
          </div>
        )}

        {showFields && suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-xs text-primary mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">KI-Vorschlag — passen Sie an, wenn nötig</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Kategorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Priorität</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">SLA (Tage)</label>
                <Input
                  type="number"
                  value={slaDays}
                  onChange={(e) => setSlaDays(Number(e.target.value))}
                  min={1}
                  max={90}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Risiko-Score</label>
                <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/30 text-sm tabular-nums">
                  {suggestion.risk_score}/100
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* If text is long enough but AI failed, show manual fields */}
        {freeText.trim().length >= 15 && !aiLoading && !suggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => {
                setSuggestion({ category: "operational", priority: "medium", sla_days: 7, risk_score: 30 });
                setShowFields(true);
              }}
              className="text-xs text-primary hover:underline"
            >
              Felder manuell ausfüllen →
            </button>
          </motion.div>
        )}

        {/* Optional colleague invite */}
        {showFields && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
              Wen soll Decivio erinnern? (optional)
            </label>
            <Input
              type="email"
              value={colleagueEmail}
              onChange={(e) => setColleagueEmail(e.target.value)}
              placeholder="kollege@firma.de"
              className="h-9"
            />
          </motion.div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={freeText.trim().length < 5 || loading}
          className="w-full gap-2 h-11"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Entscheidung starten <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SmartDecisionStep;

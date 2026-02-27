import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type OutcomeType = "successful" | "partial" | "failed" | null;

const ImpactTrackerPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const { t } = useTranslation();
  const [outcomeNotes, setOutcomeNotes] = useState(decision.outcome_notes || "");
  const [actualImpact, setActualImpact] = useState<number>(decision.actual_impact_score ?? 0);
  const [outcomeType, setOutcomeType] = useState<OutcomeType>(decision.outcome_type || null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const OUTCOME_OPTIONS: { value: OutcomeType; label: string; emoji: string; color: string }[] = [
    { value: "successful", label: t("impactTracker.successful"), emoji: "✅", color: "border-success/40 bg-success/10 text-success" },
    { value: "partial", label: t("impactTracker.partial"), emoji: "⚠️", color: "border-warning/40 bg-warning/10 text-warning" },
    { value: "failed", label: t("impactTracker.failed"), emoji: "❌", color: "border-destructive/40 bg-destructive/10 text-destructive" },
  ];

  const isImplemented = decision.status === "implemented";
  const predictedImpact = decision.ai_impact_score || 0;
  const hasOutcome = !!decision.outcome_notes;

  const accuracy = hasOutcome && predictedImpact > 0
    ? Math.round(100 - Math.abs(predictedImpact - (decision.actual_impact_score ?? 0)))
    : null;

  const saveOutcome = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("decisions").update({
        outcome_notes: outcomeNotes.trim(),
        actual_impact_score: actualImpact,
        outcome_type: outcomeType,
        implemented_at: decision.implemented_at || new Date().toISOString(),
      } as any).eq("id", decision.id);
      if (error) throw error;
      onUpdated();
      toast({ title: t("impactTracker.saved") });
    } catch (e: any) {
      toast({ title: t("aiAnalysis.error"), description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  if (!isImplemented) {
    return (
      <div className="text-center py-8 text-muted-foreground mt-4">
        <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t("impactTracker.notImplemented")}</p>
        <p className="text-xs mt-1">{t("impactTracker.currentStatus")} <span className="capitalize font-medium">{decision.status}</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("impactTracker.title")}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("impactTracker.aiPrediction")}</p>
          <p className="text-xl font-bold font-display tabular-nums text-primary">{predictedImpact}%</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("impactTracker.actualImpact")}</p>
          <p className="text-xl font-bold font-display tabular-nums text-foreground">{decision.actual_impact_score ?? "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t("impactTracker.accuracy")}</p>
          <p className={`text-xl font-bold font-display tabular-nums ${accuracy !== null ? (accuracy > 80 ? "text-success" : accuracy > 60 ? "text-warning" : "text-destructive") : "text-muted-foreground"}`}>
            {accuracy !== null ? `${accuracy}%` : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t("impactTracker.outcomeLabel")}</label>
          <div className="flex gap-2">
            {OUTCOME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutcomeType(opt.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  outcomeType === opt.value ? opt.color : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("impactTracker.impactScoreLabel")}</label>
          <input
            type="range" min={0} max={100} value={actualImpact}
            onChange={(e) => setActualImpact(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("impactTracker.low")}</span>
            <span className="font-bold text-foreground">{actualImpact}%</span>
            <span>{t("impactTracker.high")}</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("impactTracker.outcomeDocLabel")}</label>
          <textarea
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder={t("impactTracker.outcomePlaceholder")}
            className={`${inputClass} h-24 resize-none`}
          />
        </div>
        <Button size="sm" onClick={saveOutcome} disabled={saving} className="gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {saving ? t("impactTracker.saving") : t("impactTracker.save")}
        </Button>
      </div>
    </div>
  );
};

export default ImpactTrackerPanel;

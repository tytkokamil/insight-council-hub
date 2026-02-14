import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImpactTrackerPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const [outcomeNotes, setOutcomeNotes] = useState(decision.outcome_notes || "");
  const [actualImpact, setActualImpact] = useState<number>(decision.actual_impact_score ?? 0);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
        implemented_at: decision.implemented_at || new Date().toISOString(),
      }).eq("id", decision.id);
      if (error) throw error;
      onUpdated();
      toast({ title: "Outcome gespeichert" });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  if (!isImplemented) {
    return (
      <div className="text-center py-8 text-muted-foreground mt-4">
        <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Impact-Tracking ist verfügbar sobald die Entscheidung implementiert wurde.</p>
        <p className="text-xs mt-1">Aktueller Status: <span className="capitalize font-medium">{decision.status}</span></p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Impact Tracker — Vorhersage vs. Realität</h3>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">KI-Vorhersage</p>
          <p className="text-xl font-bold font-display text-primary">{predictedImpact}%</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">Tatsächlicher Impact</p>
          <p className="text-xl font-bold font-display text-foreground">{decision.actual_impact_score ?? "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">Genauigkeit</p>
          <p className={`text-xl font-bold font-display ${accuracy !== null ? (accuracy > 80 ? "text-success" : accuracy > 60 ? "text-warning" : "text-destructive") : "text-muted-foreground"}`}>
            {accuracy !== null ? `${accuracy}%` : "—"}
          </p>
        </div>
      </div>

      {/* Outcome Form */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tatsächlicher Impact-Score (0-100)</label>
          <input
            type="range" min={0} max={100} value={actualImpact}
            onChange={(e) => setActualImpact(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Niedrig</span>
            <span className="font-bold text-foreground">{actualImpact}%</span>
            <span>Hoch</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Outcome-Dokumentation</label>
          <textarea
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Was war das tatsächliche Ergebnis dieser Entscheidung? Was hat funktioniert, was nicht?"
            className={`${inputClass} h-24 resize-none`}
          />
        </div>
        <Button size="sm" onClick={saveOutcome} disabled={saving} className="gap-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {saving ? "Speichere..." : "Outcome speichern"}
        </Button>
      </div>
    </div>
  );
};

export default ImpactTrackerPanel;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Loader2,
  Target, TrendingUp, ThumbsUp, ThumbsDown, Lightbulb, FileText,
} from "lucide-react";
import { toast } from "sonner";

interface PIRProps {
  decision: any;
  onCompleted: () => void;
}

const STEPS = [
  { label: "Erwartung vs. Realität", icon: Target },
  { label: "Was lief gut?", icon: ThumbsUp },
  { label: "Was lief schlecht?", icon: ThumbsDown },
  { label: "Lessons & Empfehlungen", icon: Lightbulb },
  { label: "Zusammenfassung", icon: FileText },
];

const PostImplementationReview = ({ decision, onCompleted }: PIRProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [actualImpact, setActualImpact] = useState<number>(decision.actual_impact_score ?? 50);
  const [outcomeNotes, setOutcomeNotes] = useState(decision.outcome_notes || "");
  const [whatWentWell, setWhatWentWell] = useState("");
  const [whatWentWrong, setWhatWentWrong] = useState("");
  const [keyTakeaway, setKeyTakeaway] = useState("");
  const [recommendations, setRecommendations] = useState("");

  const predictedImpact = decision.ai_impact_score || 0;
  const accuracy = predictedImpact > 0
    ? Math.round(100 - Math.abs(predictedImpact - actualImpact))
    : null;

  const canProceed = () => {
    if (step === 0) return outcomeNotes.trim().length > 0;
    if (step === 3) return keyTakeaway.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update decision with actual impact
      const { error: decErr } = await supabase.from("decisions").update({
        outcome_notes: outcomeNotes.trim(),
        actual_impact_score: actualImpact,
      }).eq("id", decision.id);
      if (decErr) throw decErr;

      // 2. Save lessons learned
      const { error: lessonErr } = await supabase.from("lessons_learned").insert({
        decision_id: decision.id,
        created_by: user.id,
        what_went_well: whatWentWell.trim() || null,
        what_went_wrong: whatWentWrong.trim() || null,
        key_takeaway: keyTakeaway.trim(),
        recommendations: recommendations.trim() || null,
      });
      if (lessonErr) throw lessonErr;

      // 3. Audit log
      const { EventTypes } = await import("@/lib/eventTaxonomy");
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user.id,
        action: EventTypes.DECISION_UPDATED,
        field_name: "post_implementation_review",
        new_value: `Impact: ${actualImpact}%, Takeaway: ${keyTakeaway.trim().substring(0, 100)}`,
      });

      toast.success("Post-Implementation Review abgeschlossen!");
      onCompleted();
    } catch (e: any) {
      toast.error("Fehler: " + e.message);
    }
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <div className="space-y-6 mt-4">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Post-Implementation Review
          </h3>
          <span className="text-xs text-muted-foreground">
            Schritt {step + 1} von {STEPS.length}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
                i === step ? "text-primary" : i < step ? "text-muted-foreground cursor-pointer hover:text-foreground" : "text-muted-foreground/40"
              }`}
            >
              <s.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Step 0: Expected vs Actual */}
          {step === 0 && (
            <>
              <h4 className="text-sm font-semibold">Erwartung vs. Realität</h4>
              <p className="text-xs text-muted-foreground">
                Vergleiche die KI-Vorhersage mit dem tatsächlichen Ergebnis und dokumentiere die Abweichungen.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">KI-Vorhersage</p>
                  <p className="text-2xl font-bold font-display text-primary">{predictedImpact}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Genauigkeit</p>
                  <p className={`text-2xl font-bold font-display ${
                    accuracy !== null ? (accuracy > 80 ? "text-success" : accuracy > 60 ? "text-warning" : "text-destructive") : "text-muted-foreground"
                  }`}>
                    {accuracy !== null ? `${accuracy}%` : "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tatsächlicher Impact-Score (0–100)</label>
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
                <label className="text-xs text-muted-foreground mb-1 block">
                  Outcome-Dokumentation <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Was war das tatsächliche Ergebnis? Welche Ziele wurden erreicht, welche nicht?"
                  className={`${inputClass} h-28 resize-none`}
                />
              </div>
            </>
          )}

          {/* Step 1: What went well */}
          {step === 1 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-success" /> Was lief gut?
              </h4>
              <p className="text-xs text-muted-foreground">
                Dokumentiere die positiven Aspekte, erfolgreiche Prozesse und Stärken bei der Umsetzung.
              </p>
              <textarea
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                placeholder="z.B. Schnelle Umsetzung, klare Kommunikation, Stakeholder-Alignment war hoch..."
                className={`${inputClass} h-36 resize-none`}
              />
            </>
          )}

          {/* Step 2: What went wrong */}
          {step === 2 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-destructive" /> Was lief schlecht?
              </h4>
              <p className="text-xs text-muted-foreground">
                Identifiziere Probleme, Engpässe und Bereiche, die besser hätten laufen können.
              </p>
              <textarea
                value={whatWentWrong}
                onChange={(e) => setWhatWentWrong(e.target.value)}
                placeholder="z.B. Verzögerungen durch fehlende Ressourcen, unterschätzte Komplexität..."
                className={`${inputClass} h-36 resize-none`}
              />
            </>
          )}

          {/* Step 3: Key takeaway & recommendations */}
          {step === 3 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" /> Lessons & Empfehlungen
              </h4>
              <p className="text-xs text-muted-foreground">
                Fasse die wichtigste Erkenntnis zusammen und gib Empfehlungen für zukünftige Entscheidungen.
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Wichtigste Erkenntnis <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={keyTakeaway}
                  onChange={(e) => setKeyTakeaway(e.target.value)}
                  placeholder="Die zentrale Lektion aus dieser Entscheidung..."
                  className={`${inputClass} h-24 resize-none`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Empfehlungen (optional)</label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Was sollte beim nächsten Mal anders gemacht werden?"
                  className={`${inputClass} h-24 resize-none`}
                />
              </div>
            </>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Zusammenfassung
              </h4>
              <p className="text-xs text-muted-foreground mb-2">
                Überprüfe deine Eingaben bevor du den Review abschließt.
              </p>

              <div className="space-y-3">
                <SummaryBlock label="Impact Score" value={`${actualImpact}% (Vorhersage: ${predictedImpact}%)`} />
                <SummaryBlock label="Outcome" value={outcomeNotes} />
                {whatWentWell && <SummaryBlock label="Was lief gut" value={whatWentWell} />}
                {whatWentWrong && <SummaryBlock label="Was lief schlecht" value={whatWentWrong} />}
                <SummaryBlock label="Wichtigste Erkenntnis" value={keyTakeaway} highlight />
                {recommendations && <SummaryBlock label="Empfehlungen" value={recommendations} />}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline" size="sm"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Zurück
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="gap-1"
          >
            Weiter <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !canProceed()}
            className="gap-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {saving ? "Speichere..." : "Review abschließen"}
          </Button>
        )}
      </div>
    </div>
  );
};

const SummaryBlock = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`p-3 rounded-lg ${highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
    <p className={`text-sm whitespace-pre-line ${highlight ? "font-medium" : "text-muted-foreground"}`}>{value}</p>
  </div>
);

export default PostImplementationReview;

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
import { useTranslation } from "react-i18next";

interface PIRProps {
  decision: any;
  onCompleted: () => void;
}

const PostImplementationReview = ({ decision, onCompleted }: PIRProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const STEPS = [
    { label: t("pir.step0Title"), icon: Target },
    { label: t("pir.step1Title"), icon: ThumbsUp },
    { label: t("pir.step2Title"), icon: ThumbsDown },
    { label: t("pir.step3Title"), icon: Lightbulb },
    { label: t("pir.step4Title"), icon: FileText },
  ];

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
      const { error: decErr } = await supabase.from("decisions").update({
        outcome_notes: outcomeNotes.trim(),
        actual_impact_score: actualImpact,
      }).eq("id", decision.id);
      if (decErr) throw decErr;

      const { error: lessonErr } = await supabase.from("lessons_learned").insert({
        decision_id: decision.id,
        created_by: user.id,
        what_went_well: whatWentWell.trim() || null,
        what_went_wrong: whatWentWrong.trim() || null,
        key_takeaway: keyTakeaway.trim(),
        recommendations: recommendations.trim() || null,
      });
      if (lessonErr) throw lessonErr;

      const { EventTypes } = await import("@/lib/eventTaxonomy");
      await supabase.from("audit_logs").insert({
        decision_id: decision.id,
        user_id: user.id,
        action: EventTypes.DECISION_UPDATED,
        field_name: "post_implementation_review",
        new_value: `Impact: ${actualImpact}%, Takeaway: ${keyTakeaway.trim().substring(0, 100)}`,
      });

      toast.success(t("pir.success"));
      onCompleted();
    } catch (e: any) {
      toast.error(`${t("pir.error")}: ${e.message}`);
    }
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t("pir.title")}
          </h3>
          <span className="text-xs text-muted-foreground">
            {t("pir.stepOf", { step: step + 1, total: STEPS.length })}
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

      <Card>
        <CardContent className="p-5 space-y-4">
          {step === 0 && (
            <>
              <h4 className="text-sm font-semibold">{t("pir.step0Title")}</h4>
              <p className="text-xs text-muted-foreground">{t("pir.step0Desc")}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("pir.aiPrediction")}</p>
                  <p className="text-2xl font-bold font-display text-primary">{predictedImpact}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{t("pir.accuracy")}</p>
                  <p className={`text-2xl font-bold font-display ${
                    accuracy !== null ? (accuracy > 80 ? "text-success" : accuracy > 60 ? "text-warning" : "text-destructive") : "text-muted-foreground"
                  }`}>
                    {accuracy !== null ? `${accuracy}%` : "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("pir.actualImpact")}</label>
                <input
                  type="range" min={0} max={100} value={actualImpact}
                  onChange={(e) => setActualImpact(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("pir.low")}</span>
                  <span className="font-bold text-foreground">{actualImpact}%</span>
                  <span>{t("pir.high")}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("pir.outcomeDoc")} <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder={t("pir.outcomePlaceholder")}
                  className={`${inputClass} h-28 resize-none`}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-success" /> {t("pir.step1Title")}
              </h4>
              <p className="text-xs text-muted-foreground">{t("pir.step1Desc")}</p>
              <textarea
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                placeholder={t("pir.wellPlaceholder")}
                className={`${inputClass} h-36 resize-none`}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-destructive" /> {t("pir.step2Title")}
              </h4>
              <p className="text-xs text-muted-foreground">{t("pir.step2Desc")}</p>
              <textarea
                value={whatWentWrong}
                onChange={(e) => setWhatWentWrong(e.target.value)}
                placeholder={t("pir.wrongPlaceholder")}
                className={`${inputClass} h-36 resize-none`}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" /> {t("pir.step3Title")}
              </h4>
              <p className="text-xs text-muted-foreground">{t("pir.step3Desc")}</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("pir.keyTakeawayLabel")} <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={keyTakeaway}
                  onChange={(e) => setKeyTakeaway(e.target.value)}
                  placeholder={t("pir.keyTakeawayPlaceholder")}
                  className={`${inputClass} h-24 resize-none`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("pir.recommendationsLabel")}</label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder={t("pir.recommendationsPlaceholder")}
                  className={`${inputClass} h-24 resize-none`}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> {t("pir.step4Title")}
              </h4>
              <p className="text-xs text-muted-foreground mb-2">{t("pir.step4Desc")}</p>

              <div className="space-y-3">
                <SummaryBlock label={t("pir.impactScore")} value={`${actualImpact}% (${t("pir.prediction")}: ${predictedImpact}%)`} />
                <SummaryBlock label={t("pir.outcome")} value={outcomeNotes} />
                {whatWentWell && <SummaryBlock label={t("pir.wellSummary")} value={whatWentWell} />}
                {whatWentWrong && <SummaryBlock label={t("pir.wrongSummary")} value={whatWentWrong} />}
                <SummaryBlock label={t("pir.takeawaySummary")} value={keyTakeaway} highlight />
                {recommendations && <SummaryBlock label={t("pir.recsSummary")} value={recommendations} />}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline" size="sm"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> {t("pir.back")}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="gap-1"
          >
            {t("pir.next")} <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !canProceed()}
            className="gap-1"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {saving ? t("pir.saving") : t("pir.submit")}
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

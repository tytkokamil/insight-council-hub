import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Target, DollarSign, Shield, Users, Save, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  decision: any;
  onUpdated: () => void;
}

interface ScorecardData {
  goal_achieved: number;
  budget_adherence: number;
  risk_accuracy: number;
  stakeholder_satisfaction: number;
  notes: string;
}

const DecisionScorecard = ({ decision, onUpdated }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ScorecardData>({
    goal_achieved: 50,
    budget_adherence: 50,
    risk_accuracy: 50,
    stakeholder_satisfaction: 50,
    notes: "",
  });

  const isImplemented = decision.status === "implemented";
  const isOwner = user?.id === decision.created_by || user?.id === decision.owner_id;

  useEffect(() => {
    if (decision.outcome_notes) {
      try {
        const parsed = JSON.parse(decision.outcome_notes);
        if (parsed.scorecard) setData(parsed.scorecard);
      } catch {}
    }
  }, [decision.outcome_notes]);

  const overallScore = Math.round(
    (data.goal_achieved * 0.35 + data.budget_adherence * 0.2 + data.risk_accuracy * 0.2 + data.stakeholder_satisfaction * 0.25)
  );

  const scoreColor = overallScore >= 70 ? "text-success" : overallScore >= 40 ? "text-warning" : "text-destructive";

  const handleSave = async () => {
    setSaving(true);
    const outcomeNotes = JSON.stringify({ scorecard: data });
    const outcomeType = overallScore >= 70 ? "successful" : overallScore >= 40 ? "partial" : "failed";

    const { error } = await supabase
      .from("decisions")
      .update({ outcome_notes: outcomeNotes, outcome_type: outcomeType, actual_impact_score: overallScore })
      .eq("id", decision.id);

    if (!error) {
      toast.success(t("scorecard.saved"));
      onUpdated();
    } else {
      toast.error(t("scorecard.saveError"));
    }
    setSaving(false);
  };

  if (!isImplemented) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t("scorecard.notAvailable")}</p>
      </div>
    );
  }

  const dimensions = [
    { key: "goal_achieved", label: t("scorecard.goalAchieved"), icon: Target, weight: "35%", description: t("scorecard.goalDesc") },
    { key: "budget_adherence", label: t("scorecard.budgetAdherence"), icon: DollarSign, weight: "20%", description: t("scorecard.budgetDesc") },
    { key: "risk_accuracy", label: t("scorecard.riskAccuracy"), icon: Shield, weight: "20%", description: t("scorecard.riskDesc") },
    { key: "stakeholder_satisfaction", label: t("scorecard.stakeholderSatisfaction"), icon: Users, weight: "25%", description: t("scorecard.stakeholderDesc") },
  ] as const;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("scorecard.title")}</h3>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">{t("scorecard.overallScore")}</p>
            <p className={`text-xl font-bold ${scoreColor}`}>{overallScore}%</p>
          </div>
          <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>
            {overallScore >= 70 ? t("scorecard.successful") : overallScore >= 40 ? t("scorecard.partial") : t("scorecard.failed")}
          </Badge>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overallScore >= 70 ? "bg-success" : overallScore >= 40 ? "bg-warning" : "bg-destructive"}`}
          style={{ width: `${overallScore}%` }}
        />
      </div>

      <div className="grid gap-4">
        {dimensions.map(dim => (
          <Card key={dim.key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <dim.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold">{dim.label}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{dim.weight}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">{dim.description}</p>
              <div className="flex items-center gap-3">
                <Slider
                  value={[data[dim.key]]}
                  onValueChange={([v]) => setData(prev => ({ ...prev, [dim.key]: v }))}
                  max={100}
                  step={5}
                  disabled={!isOwner}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-12 text-right tabular-nums">{data[dim.key]}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("scorecard.notesLabel")}</label>
        <Textarea
          value={data.notes}
          onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder={t("scorecard.notesPlaceholder")}
          disabled={!isOwner}
        />
      </div>

      {isOwner && (
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {t("scorecard.save")}
        </Button>
      )}

      {decision.ai_risk_score != null && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold mb-2">{t("scorecard.aiComparison")}</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">{t("scorecard.aiRiskScore")}</p>
                <p className="text-lg font-semibold">{decision.ai_risk_score}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">{t("scorecard.actualRiskAccuracy")}</p>
                <p className="text-lg font-semibold">{data.risk_accuracy}%</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-[10px] text-muted-foreground">
                {t("scorecard.deviation")}: <span className="font-semibold">{Math.abs(decision.ai_risk_score - data.risk_accuracy)}pp</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DecisionScorecard;

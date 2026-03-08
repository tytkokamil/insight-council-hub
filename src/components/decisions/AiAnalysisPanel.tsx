import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, CheckCircle2, Loader2, Lightbulb, ThumbsUp, ThumbsDown, TrendingUp, Info, ShieldCheck, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AiFeedbackButton from "@/components/shared/AiFeedbackButton";
import AiExplainabilityBadge from "@/components/shared/AiExplainabilityBadge";
import type { AiSourceType } from "@/components/shared/AiExplainabilityBadge";
import { useTranslation } from "react-i18next";

interface WeightedFactor {
  factor: string;
  weight: number;
}

interface AiOption {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimated_roi: string;
  confidence: number;
}

const AiAnalysisPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(
    decision.ai_risk_score ? {
      risk_score: decision.ai_risk_score,
      impact_score: decision.ai_impact_score,
      risk_factors: decision.ai_risk_factors || [],
      success_factors: decision.ai_success_factors || [],
    } : null
  );
  const [options, setOptions] = useState<AiOption[]>(decision.ai_options || []);
  const [recommendation, setRecommendation] = useState<string>("");
  const [confidence, setConfidence] = useState<string | null>(null);
  const [confidenceReason, setConfidenceReason] = useState<string>("");
  const [riskExplanation, setRiskExplanation] = useState<string>("");
  const { toast } = useToast();

  const CONFIDENCE_CONFIG = {
    high: { label: t("aiAnalysis.confidenceHigh"), color: "text-success border-success/30 bg-success/10", icon: ShieldCheck },
    medium: { label: t("aiAnalysis.confidenceMedium"), color: "text-warning border-warning/30 bg-warning/10", icon: ShieldAlert },
    low: { label: t("aiAnalysis.confidenceLow"), color: "text-destructive border-destructive/30 bg-destructive/10", icon: AlertTriangle },
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-decision", {
        body: { title: decision.title, description: decision.description, category: decision.category, priority: decision.priority, context: decision.context },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setConfidence(data.confidence || null);
      setConfidenceReason(data.confidence_reason || "");
      setRiskExplanation(data.risk_explanation || "");

      const riskStrings = (data.risk_factors || []).map((f: any) => typeof f === "string" ? f : f.factor);
      const successStrings = (data.success_factors || []).map((f: any) => typeof f === "string" ? f : f.factor);

      await supabase.from("decisions").update({
        ai_risk_score: data.risk_score, ai_impact_score: data.impact_score,
        ai_risk_factors: riskStrings, ai_success_factors: successStrings,
      }).eq("id", decision.id);
      onUpdated();
      toast({ title: t("aiAnalysis.analysisComplete"), description: data.summary });
    } catch (e: any) {
      toast({ title: t("aiAnalysis.error"), description: e.message || t("aiAnalysis.analysisFailed"), variant: "destructive" });
    }
    setLoading(false);
  };

  const runAutopilot = async () => {
    setAutopilotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-decision", {
        body: { title: decision.title, description: decision.description, category: decision.category, priority: decision.priority, context: decision.context, mode: "autopilot" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setOptions(data.options || []);
      setRecommendation(data.recommendation || "");

      const riskStrings = (data.risk_factors || []).map((f: any) => typeof f === "string" ? f : f.factor);
      const successStrings = (data.success_factors || []).map((f: any) => typeof f === "string" ? f : f.factor);

      await supabase.from("decisions").update({
        ai_risk_score: data.risk_score, ai_impact_score: data.impact_score,
        ai_risk_factors: riskStrings, ai_success_factors: successStrings,
        ai_options: data.options,
      }).eq("id", decision.id);
      onUpdated();
      toast({ title: t("aiAnalysis.autopilotComplete") });
    } catch (e: any) {
      toast({ title: t("aiAnalysis.error"), description: e.message || t("aiAnalysis.autopilotFailed"), variant: "destructive" });
    }
    setAutopilotLoading(false);
  };

  const scoreColor = (score: number) =>
    score > 60 ? "text-destructive" : score > 40 ? "text-warning" : "text-success";

  const renderWeightedFactors = (factors: any[], type: "risk" | "success") => {
    return (
      <ul className="space-y-1.5">
        {factors.map((f: any, i: number) => {
          const text = typeof f === "string" ? f : f.factor;
          const weight = typeof f === "object" ? f.weight : null;
          const barWidth = weight ? (weight / 10) * 100 : 0;
          return (
            <li key={i} className="text-xs text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <span className={`mt-0.5 ${type === "risk" ? "text-destructive" : "text-success"}`}>•</span>
                <div className="flex-1">
                  <span>{text}</span>
                  {weight !== null && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${type === "risk" ? "bg-destructive/60" : "bg-success/60"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 w-6 text-right">{weight}/10</span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-sm font-medium">{t("aiAnalysis.title")}</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={runAnalysis} disabled={loading || autopilotLoading} className="gap-1">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? t("aiAnalysis.analyzing") : t("aiAnalysis.riskAnalysis")}
          </Button>
          <Button size="sm" variant="default" onClick={runAutopilot} disabled={loading || autopilotLoading} className="gap-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
            {autopilotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
            {autopilotLoading ? t("aiAnalysis.generating") : t("aiAnalysis.autopilot")}
          </Button>
        </div>
      </div>

      {analysis ? (
        <div className="space-y-4">
          {confidence && CONFIDENCE_CONFIG[confidence as keyof typeof CONFIDENCE_CONFIG] && (() => {
            const cfg = CONFIDENCE_CONFIG[confidence as keyof typeof CONFIDENCE_CONFIG];
            const ConfIcon = cfg.icon;
            return (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${cfg.color}`}>
                <ConfIcon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">{t("aiAnalysis.confidenceLabel", { level: cfg.label })}</span>
                  {confidenceReason && <p className="text-[10px] opacity-80 mt-0.5">{confidenceReason}</p>}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">{t("aiAnalysis.riskScore")}</p>
              <p className={`text-2xl font-bold font-display tabular-nums ${scoreColor(analysis.risk_score)}`}>{analysis.risk_score}%</p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${analysis.risk_score > 60 ? "bg-destructive" : analysis.risk_score > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${analysis.risk_score}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">{t("aiAnalysis.impactScore")}</p>
              <p className={`text-2xl font-bold font-display tabular-nums ${scoreColor(100 - analysis.impact_score)}`}>{analysis.impact_score}%</p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${analysis.impact_score}%` }} />
              </div>
            </div>
          </div>

          {riskExplanation && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{t("aiAnalysis.whyThisScore")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{riskExplanation}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-2"><AlertTriangle className="w-3 h-3" /> {t("aiAnalysis.riskFactors")}</p>
              {renderWeightedFactors(analysis.risk_factors || [], "risk")}
            </div>
            <div>
              <p className="text-xs font-medium text-success flex items-center gap-1 mb-2"><CheckCircle2 className="w-3 h-3" /> {t("aiAnalysis.successFactors")}</p>
              {renderWeightedFactors(analysis.success_factors || [], "success")}
            </div>
          </div>

          {options.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">{t("aiAnalysis.aiOptions")}</h4>
              </div>
              {recommendation && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">{t("aiAnalysis.recommendation")}</p>
                  <p className="text-xs text-foreground">{recommendation}</p>
                </div>
              )}
              <div className="grid gap-3">
                {options.map((opt, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold">{t("aiAnalysis.option", { n: i + 1, title: opt.title })}</h5>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {t("aiAnalysis.confidence", { pct: opt.confidence })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-success flex items-center gap-1 mb-1"><ThumbsUp className="w-3 h-3" /> {t("aiAnalysis.pro")}</p>
                        {opt.pros.map((p, j) => (
                          <p key={j} className="text-xs text-muted-foreground ml-4">• {p}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1"><ThumbsDown className="w-3 h-3" /> {t("aiAnalysis.contra")}</p>
                        {opt.cons.map((c, j) => (
                          <p key={j} className="text-xs text-muted-foreground ml-4">• {c}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <p className="text-xs text-primary font-medium">{t("aiAnalysis.roi", { value: opt.estimated_roi })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AiExplainabilityBadge
            confidence={confidence || (analysis.risk_score > 60 ? "low" : analysis.risk_score > 30 ? "medium" : "high")}
            factors={(analysis.risk_factors || []).slice(0, 3).map((f: any) => typeof f === "string" ? f : f.factor)}
            sourceType={options.length > 0 ? "llm" as AiSourceType : "data" as AiSourceType}
            explanation={riskExplanation || confidenceReason || null}
          />
          <AiFeedbackButton context={options.length > 0 ? "autopilot" : "risk-analysis"} />
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t("aiAnalysis.emptyTitle")}</p>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisPanel;

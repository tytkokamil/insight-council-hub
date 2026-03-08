import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Lightbulb, Target, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import AiFeedbackButton from "@/components/shared/AiFeedbackButton";
import AiExplainabilityBadge from "@/components/shared/AiExplainabilityBadge";
import { useTranslation } from "react-i18next";

interface AiInsightPanelProps {
  type: "pattern" | "dna" | "bottleneck";
  context: Record<string, any>;
  className?: string;
}

const MAX_DESC_LENGTH = 120;

const TruncatedText = ({ text, className = "" }: { text: string; className?: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text || text.length <= MAX_DESC_LENGTH) return <p className={className}>{text}</p>;
  return (
    <div>
      <p className={className}>
        {expanded ? text : `${text.slice(0, MAX_DESC_LENGTH)}…`}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-primary hover:underline mt-0.5 inline-flex items-center gap-0.5"
      >
        {expanded ? <><ChevronUp className="w-3 h-3" /> Weniger</> : <><ChevronDown className="w-3 h-3" /> Mehr</>}
      </button>
    </div>
  );
};

const AiInsightPanel = ({ type, context, className = "" }: AiInsightPanelProps) => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("intelligence-analyze", {
        body: { type, context },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setInsights(data?.insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("shared.analysisError"));
    } finally {
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <Card className={`border-primary/20 bg-primary/[0.02] ${className}`}>
        <CardContent className="p-5 text-center">
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">{t("shared.aiDeepAnalysis")}</p>
          <p className="text-xs text-muted-foreground mb-3">{t("shared.aiDeepAnalysisDesc")}</p>
          <Button size="sm" onClick={fetchInsights} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t("shared.aiStartAnalysis")}
          </Button>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`border-primary/20 bg-primary/[0.02] ${className}`}>
        <CardContent className="p-5 text-center">
          <Loader2 className="w-5 h-5 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">{t("shared.aiAnalyzing")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 bg-primary/[0.02] ${className}`}>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("shared.aiDeepAnalysis")}</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {type === "pattern" && insights && (
          <div className="space-y-4">
            {insights.deep_patterns?.map((p: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/60">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.title}</p>
                    <TruncatedText text={p.description} className="text-xs text-muted-foreground mt-0.5" />
                    <p className="text-xs text-primary mt-1">→ {p.actionable_tip}</p>
                  </div>
                </div>
              </div>
            ))}
            {insights.prediction && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-primary">{t("shared.ai30DayForecast")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insights.prediction}</p>
                  </div>
                </div>
              </div>
            )}
            {insights.hidden_correlation && (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="flex items-start gap-2">
                  <Target className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-warning">{t("shared.aiHiddenCorrelation")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insights.hidden_correlation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {type === "dna" && insights && (
          <div className="space-y-4">
            {insights.archetype_deep_dive && (
              <p className="text-sm text-muted-foreground">{insights.archetype_deep_dive}</p>
            )}
            {insights.strengths?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-success">{t("shared.aiStrengths")}</p>
                {insights.strengths.map((s: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-success mt-0.5">✓</span> {s}
                  </p>
                ))}
              </div>
            )}
            {insights.growth_areas?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-warning">{t("shared.aiGrowthAreas")}</p>
                {insights.growth_areas.map((g: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-muted/20 text-xs">
                    <p className="font-medium">{g.area}</p>
                    <p className="text-muted-foreground">→ {g.action}</p>
                    <p className="text-primary text-[10px]">{t("shared.aiExpectedImpact")}: {g.expected_impact}</p>
                  </div>
                ))}
              </div>
            )}
            {insights.benchmark_comparison && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-1">{t("shared.aiBenchmarkComparison")}</p>
                <p className="text-xs text-muted-foreground">{insights.benchmark_comparison}</p>
              </div>
            )}
          </div>
        )}

        {type === "bottleneck" && insights && (
          <div className="space-y-4">
            {insights.process_health_summary && (
              <p className="text-sm text-muted-foreground">{insights.process_health_summary}</p>
            )}
            {insights.root_causes?.map((rc: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg border ${rc.priority === "critical" ? "border-destructive/30 bg-destructive/5" : rc.priority === "high" ? "border-warning/30 bg-warning/5" : "border-border/60 bg-muted/5"}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${rc.priority === "critical" ? "text-destructive" : rc.priority === "high" ? "text-warning" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-sm font-medium">{rc.cause}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rc.evidence}</p>
                    <p className="text-xs text-primary mt-1">→ {rc.fix}</p>
                  </div>
                </div>
              </div>
            ))}
            {insights.quick_wins?.length > 0 && (
              <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                <p className="text-xs font-medium text-success mb-1">{t("shared.aiQuickWins")}</p>
                {insights.quick_wins.map((qw: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-success mt-0.5">⚡</span> {qw}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <AiExplainabilityBadge
          confidence={insights?.confidence}
          factors={insights?.deep_patterns?.slice(0, 2).map((p: any) => p.title) || insights?.strengths?.slice(0, 2) || insights?.root_causes?.slice(0, 2).map((rc: any) => rc.cause)}
          sourceType={type === "pattern" ? "pattern" : type === "dna" ? "benchmark" : "data"}
        />

        <AiFeedbackButton context={`intelligence-${type}`} />
      </CardContent>
    </Card>
  );
};

export default AiInsightPanel;

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Prediction {
  decision_id: string;
  decision_title: string;
  reviewer_id: string;
  reviewer_name: string;
  avg_response_hours: number;
  due_date: string;
  predicted_completion_date: string;
  predicted_delay_hours: number;
  sla_deadline_hours: number;
  risk_level: "warning" | "critical";
}

/** Small inline warning badge for decision table rows */
export const PredictiveSlaInlineBadge = ({ decisionId, predictions }: {
  decisionId: string;
  predictions: Prediction[];
}) => {
  const { t } = useTranslation();
  const match = predictions.find(p => p.decision_id === decisionId);
  if (!match) return null;

  const delayDays = Math.round(match.predicted_delay_hours / 24 * 10) / 10;
  const isCritical = match.risk_level === "critical";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-[9px] h-4 px-1 gap-0.5 cursor-help ${
              isCritical
                ? "bg-destructive/20 text-destructive border-destructive/30"
                : "bg-warning/20 text-warning border-warning/30"
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            {t("predictiveSla.badge")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-64">
          {t("predictiveSla.tooltipDelay", {
            name: match.reviewer_name,
            days: delayDays,
          })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Full panel for Decision Control / Process Hub showing all predicted violations */
export const PredictiveSlaPanel = () => {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("predictive-sla");
        if (error) throw error;
        setPredictions(data?.predictions || []);
      } catch (e) {
        console.error("Predictive SLA fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  const handleEscalate = async (decisionId: string) => {
    const { error } = await supabase
      .from("decisions")
      .update({
        escalation_level: 2,
        last_escalated_at: new Date().toISOString(),
      })
      .eq("id", decisionId);

    if (!error) {
      toast.success(t("predictiveSla.escalated"));
      setPredictions(prev => prev.filter(p => p.decision_id !== decisionId));
    } else {
      toast.error(t("predictiveSla.escalateError"));
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold">{t("predictiveSla.title")}</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold">{t("predictiveSla.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{t("predictiveSla.allClear")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold">{t("predictiveSla.title")}</h3>
        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
          {predictions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {predictions.slice(0, 10).map(p => {
          const delayDays = Math.round(p.predicted_delay_hours / 24 * 10) / 10;
          const isCritical = p.risk_level === "critical";

          return (
            <div
              key={`${p.decision_id}-${p.reviewer_id}`}
              className={`rounded-lg border p-3 ${
                isCritical
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-warning/20 bg-warning/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.decision_title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("predictiveSla.reviewerDelay", {
                      name: p.reviewer_name,
                      avgHours: p.avg_response_hours,
                    })}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${isCritical ? "text-destructive" : "text-warning"}`}>
                    {t("predictiveSla.predictedDelay", { days: delayDays })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 shrink-0 border-warning/40 text-warning hover:bg-warning/10"
                  onClick={() => handleEscalate(p.decision_id)}
                >
                  <Zap className="w-3 h-3" />
                  {t("predictiveSla.escalateNow")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Hook to fetch predictions for use in decision table */
export const usePredictiveSla = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("predictive-sla");
        if (error) throw error;
        setPredictions(data?.predictions || []);
      } catch (e) {
        console.error("Predictive SLA fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  return { predictions, loading };
};

export default PredictiveSlaPanel;

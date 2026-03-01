import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle, TrendingUp, Zap, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { differenceInDays, addDays, format } from "date-fns";
import { de, enUS } from "date-fns/locale";

/* ── Types ── */
export interface PredictiveSlaEntry {
  decision_id: string;
  decision_title: string;
  due_date: string;
  remaining_days: number;
  predicted_violation_date: string;
  avg_review_duration: number;
  recommendation: string;
}

const DEFAULT_EARLY_WARNING_DAYS = 2;
const DEFAULT_AVG_REVIEW_DURATION = 2; // days
const BUFFER_MULTIPLIER = 1.5;

/* ── Hook: compute predictions from decisions + reviews (frontend only) ── */
export const usePredictiveSla = (
  decisions: any[] = [],
  reviews: any[] = [],
  earlyWarningDays?: number,
) => {
  const storedThreshold = typeof window !== "undefined" ? parseInt(localStorage.getItem("sla-early-warning-days") || "2") : 2;
  const warningThreshold = earlyWarningDays ?? storedThreshold;

  const predictions = useMemo<PredictiveSlaEntry[]>(() => {
    const now = new Date();

    // Calculate average review duration from historical data
    const completedReviews = reviews.filter(r => r.reviewed_at && r.created_at);
    let avgReviewDuration = DEFAULT_AVG_REVIEW_DURATION;
    if (completedReviews.length >= 3) {
      const durations = completedReviews.map(r =>
        (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      avgReviewDuration = durations.reduce((s, d) => s + d, 0) / durations.length;
    }

    const threshold = Math.max(avgReviewDuration * BUFFER_MULTIPLIER, warningThreshold);

    const openDecisions = decisions.filter(d =>
      d.due_date &&
      !["implemented", "rejected", "archived", "cancelled"].includes(d.status)
    );

    const results: PredictiveSlaEntry[] = [];

    for (const d of openDecisions) {
      const dueDate = new Date(d.due_date);
      const remainingDays = differenceInDays(dueDate, now);

      // Only warn if deadline is in the future but within threshold
      if (remainingDays > 0 && remainingDays <= threshold) {
        const violationDate = addDays(now, remainingDays);

        results.push({
          decision_id: d.id,
          decision_title: d.title,
          due_date: d.due_date,
          remaining_days: remainingDays,
          predicted_violation_date: violationDate.toISOString(),
          avg_review_duration: Math.round(avgReviewDuration * 10) / 10,
          recommendation: remainingDays <= 1
            ? "Review heute zuweisen"
            : `Review in den nächsten ${Math.max(1, Math.floor(remainingDays - avgReviewDuration))} Tagen starten`,
        });
      }
    }

    return results.sort((a, b) => a.remaining_days - b.remaining_days);
  }, [decisions, reviews, warningThreshold]);

  return { predictions, avgReviewDuration: DEFAULT_AVG_REVIEW_DURATION };
};

/* ── Inline badge for decision table rows (clock icon) ── */
export const PredictiveSlaInlineBadge = ({ decisionId, predictions }: {
  decisionId: string;
  predictions: PredictiveSlaEntry[];
}) => {
  const { t } = useTranslation();
  const match = predictions.find(p => p.decision_id === decisionId);
  if (!match) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1 gap-0.5 cursor-help bg-warning/20 text-warning border-warning/30"
          >
            <Clock className="w-2.5 h-2.5" />
            SLA
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-64">
          {t("predictiveSla.inlineTooltip", {
            days: match.remaining_days,
            defaultValue: `SLA-Verletzung in ${match.remaining_days} Tagen prognostiziert`,
          })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ── Full panel for Decision Control / Process Hub ── */
export const PredictiveSlaPanel = ({ decisions = [], reviews = [] }: {
  decisions?: any[];
  reviews?: any[];
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const { predictions } = usePredictiveSla(decisions, reviews);

  if (predictions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold">{t("predictiveSla.title", "Predictive SLA Warnings")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("predictiveSla.allClear", "Keine SLA-Verletzungen prognostiziert — alle Entscheidungen im Zeitplan.")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold">{t("predictiveSla.title", "Predictive SLA Warnings")}</h3>
        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
          {predictions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {predictions.map(p => (
          <div
            key={p.decision_id}
            className="rounded-lg border border-warning/20 bg-warning/5 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.decision_title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-warning">
                    {p.remaining_days} {p.remaining_days === 1 ? "Tag" : "Tage"} verbleibend
                  </span>
                  <span>·</span>
                  <span>
                    Verletzung am {format(new Date(p.predicted_violation_date), "dd.MM.yyyy", { locale: dateFnsLocale })}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  💡 {p.recommendation}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 shrink-0 border-warning/40 text-warning hover:bg-warning/10"
                onClick={() => navigate(`/decisions/${p.decision_id}`)}
              >
                <UserPlus className="w-3 h-3" />
                Reviewer zuweisen →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Helper: get predicted violation dates for calendar ── */
export const getPredictedViolationDates = (predictions: PredictiveSlaEntry[]): Set<string> => {
  const dates = new Set<string>();
  for (const p of predictions) {
    dates.add(format(new Date(p.due_date), "yyyy-MM-dd"));
  }
  return dates;
};

export default PredictiveSlaPanel;

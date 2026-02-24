import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";

const VelocityScoreWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [], isLoading } = useDecisions();

  const { avgDays, categoryBreakdown, trend } = useMemo(() => {
    const implemented = allDecisions.filter(d => d.status === "implemented" && d.implemented_at);
    if (implemented.length === 0) return { avgDays: null, categoryBreakdown: [], trend: "flat" as const };

    const durations = implemented.map(d => ({
      days: (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24),
      category: d.category,
      created_at: d.created_at,
    }));

    const avg = Math.round(durations.reduce((s, d) => s + d.days, 0) / durations.length * 10) / 10;

    const catMap: Record<string, number[]> = {};
    durations.forEach(d => {
      if (!catMap[d.category]) catMap[d.category] = [];
      catMap[d.category].push(d.days);
    });
    const breakdown = Object.entries(catMap).map(([category, days]) => ({
      category,
      avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length * 10) / 10,
    })).sort((a, b) => a.avgDays - b.avgDays);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const sixtyDaysAgo = now - 60 * 86400000;
    const recent = durations.filter(d => new Date(d.created_at).getTime() > thirtyDaysAgo);
    const older = durations.filter(d => { const ti = new Date(d.created_at).getTime(); return ti > sixtyDaysAgo && ti <= thirtyDaysAgo; });
    let tr: "up" | "down" | "flat" = "flat";
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((s, d) => s + d.days, 0) / recent.length;
      const olderAvg = older.reduce((s, d) => s + d.days, 0) / older.length;
      tr = recentAvg < olderAvg - 0.5 ? "up" : recentAvg > olderAvg + 0.5 ? "down" : "flat";
    }

    return { avgDays: avg, categoryBreakdown: breakdown, trend: tr };
  }, [allDecisions]);

  if (isLoading) return <WidgetSkeleton rows={4} showScore />;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const trendLabel = trend === "up" ? t("widgets.fasterThanLastMonth") : trend === "down" ? t("widgets.slowerThanLastMonth") : t("widgets.stable");

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">Decision Velocity</CardTitle>
            <ScoreMethodology
              title="Decision Velocity"
              description={t("widgets.velocityDesc")}
              items={[
                { label: t("widgets.daysAvg"), formula: t("widgets.velocityAvgDays") },
                { label: "Trend", formula: t("widgets.velocityTrend") },
                { label: "Breakdown", formula: t("widgets.velocityCatBreakdown") },
              ]}
              source={t("widgets.velocitySource")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {avgDays !== null ? (
          <>
            <div className="flex items-end gap-2 mb-2">
              <span className="font-display text-3xl font-bold">{avgDays}</span>
              <span className="text-sm text-muted-foreground mb-1">{t("widgets.daysAvg")}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${trendColor} mb-4`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </div>
            {categoryBreakdown.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border">
                {categoryBreakdown.slice(0, 4).map(c => (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">{c.category}</span>
                    <span className="text-xs font-medium">{c.avgDays}d</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("widgets.noImplemented")}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VelocityScoreWidget;

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingDown, TrendingUp, Minus, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDecisions } from "@/hooks/useDecisions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";

const VelocityScoreWidget = () => {
  const { t } = useTranslation();
  const { data: allDecisions = [], isLoading } = useDecisions();
  const { user } = useAuth();
  const [rpcData, setRpcData] = useState<{ score: number; grade: string; percentile: number; avg_days: number; industry_avg_days: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_velocity_score", { _user_id: user.id } as any).then(({ data }) => {
      if (data && data.length > 0) setRpcData(data[0] as any);
    });
  }, [user]);

  const { categoryBreakdown, trend } = useMemo(() => {
    const implemented = allDecisions.filter(d => d.status === "implemented" && d.implemented_at);
    if (implemented.length === 0) return { categoryBreakdown: [], trend: "flat" as const };

    const durations = implemented.map(d => ({
      days: (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24),
      category: d.category,
      created_at: d.created_at,
    }));

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

    return { categoryBreakdown: breakdown, trend: tr };
  }, [allDecisions]);

  if (isLoading) return <WidgetSkeleton rows={4} showScore />;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const trendLabel = trend === "up" ? t("widgets.fasterThanLastMonth") : trend === "down" ? t("widgets.slowerThanLastMonth") : t("widgets.stable");

  const score = rpcData?.score ?? null;
  const grade = rpcData?.grade ?? null;
  const avgDays = rpcData?.avg_days ?? null;
  const industryAvg = rpcData?.industry_avg_days ?? 8.7;
  const percentile = rpcData?.percentile ?? null;
  const scoreColor = score !== null ? (score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive") : "text-muted-foreground";
  const isFaster = avgDays !== null && avgDays < industryAvg;

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
        {score !== null && avgDays !== null ? (
          <>
            {/* Score + Grade */}
            <div className="flex items-end gap-3 mb-1">
              <span className={`font-display text-[48px] font-bold tabular-nums leading-none ${scoreColor}`}>{score}</span>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
            <p className={`text-base font-semibold mb-3 ${scoreColor}`}>{grade}</p>

            {/* Comparison Bars */}
            <div className="space-y-2 mb-3">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Ihr Unternehmen</span>
                  <span className="font-medium text-foreground">{avgDays} Tage</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Number(avgDays) / 20) * 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Branche (Mittelstand)</span>
                  <span className="font-medium">{industryAvg} Tage</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full border-2 border-dashed border-muted-foreground/30 rounded-full" style={{ width: `${Math.min(100, (Number(industryAvg) / 20) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Faster/Slower indicator */}
            <div className={`text-xs flex items-center gap-1 mb-3 ${isFaster ? "text-success" : "text-destructive"}`}>
              {isFaster ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isFaster
                ? `${(Number(industryAvg) - Number(avgDays)).toFixed(1)} Tage schneller als Branche`
                : `${(Number(avgDays) - Number(industryAvg)).toFixed(1)} Tage langsamer als Branche`
              }</span>
            </div>

            {/* Percentile Badge */}
            {percentile !== null && (
              <Badge variant="outline" className={`text-[10px] ${percentile > 60 ? "text-success border-success/30" : percentile > 40 ? "text-warning border-warning/30" : "text-destructive border-destructive/30"}`}>
                <Trophy className="w-3 h-3 mr-1" />
                Top {percentile}% aller Unternehmen
              </Badge>
            )}

            {/* Trend */}
            <div className={`flex items-center gap-1 text-xs ${trendColor} mt-3`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border mt-3">
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

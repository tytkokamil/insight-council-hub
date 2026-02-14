import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const VelocityScoreWidget = () => {
  const [avgDays, setAvgDays] = useState<number | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ category: string; avgDays: number }[]>([]);
  const [trend, setTrend] = useState<"up" | "down" | "flat">("flat");

  useEffect(() => {
    const fetchVelocity = async () => {
      const { data } = await supabase
        .from("decisions")
        .select("status, category, created_at, implemented_at")
        .eq("status", "implemented");

      if (!data || data.length === 0) return;

      const durations = data
        .filter(d => d.implemented_at)
        .map(d => {
          const created = new Date(d.created_at).getTime();
          const implemented = new Date(d.implemented_at).getTime();
          return { days: (implemented - created) / (1000 * 60 * 60 * 24), category: d.category, created_at: d.created_at };
        });

      if (durations.length === 0) return;

      const avg = Math.round(durations.reduce((s, d) => s + d.days, 0) / durations.length * 10) / 10;
      setAvgDays(avg);

      // Category breakdown
      const catMap: Record<string, number[]> = {};
      durations.forEach(d => {
        if (!catMap[d.category]) catMap[d.category] = [];
        catMap[d.category].push(d.days);
      });
      const breakdown = Object.entries(catMap).map(([category, days]) => ({
        category,
        avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length * 10) / 10,
      })).sort((a, b) => a.avgDays - b.avgDays);
      setCategoryBreakdown(breakdown);

      // Trend: compare last 30 days vs previous 30 days
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
      const recent = durations.filter(d => new Date(d.created_at).getTime() > thirtyDaysAgo);
      const older = durations.filter(d => {
        const t = new Date(d.created_at).getTime();
        return t > sixtyDaysAgo && t <= thirtyDaysAgo;
      });
      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((s, d) => s + d.days, 0) / recent.length;
        const olderAvg = older.reduce((s, d) => s + d.days, 0) / older.length;
        setTrend(recentAvg < olderAvg - 0.5 ? "up" : recentAvg > olderAvg + 0.5 ? "down" : "flat");
      }
    };
    fetchVelocity();
  }, []);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const trendLabel = trend === "up" ? "Schneller als letzten Monat" : trend === "down" ? "Langsamer als letzten Monat" : "Stabil";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Decision Velocity</h3>
      </div>

      {avgDays !== null ? (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className="font-display text-3xl font-bold">{avgDays}</span>
            <span className="text-sm text-muted-foreground mb-1">Tage Ø</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${trendColor} mb-3`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendLabel}</span>
          </div>
          {categoryBreakdown.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border">
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
        <p className="text-xs text-muted-foreground">Noch keine implementierten Entscheidungen.</p>
      )}
    </motion.div>
  );
};

export default VelocityScoreWidget;

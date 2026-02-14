import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Zap, Target, HeartPulse, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MomentumScoreWidget = () => {
  const [score, setScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState({ velocity: 0, quality: 0, throughput: 0, health: 0 });

  useEffect(() => {
    const calculate = async () => {
      const { data: decisions } = await supabase
        .from("decisions")
        .select("status, created_at, implemented_at, ai_impact_score, actual_impact_score, due_date");

      if (!decisions || decisions.length === 0) return;

      const now = Date.now();
      const total = decisions.length;
      const implemented = decisions.filter(d => d.status === "implemented");

      // Velocity (0-25)
      const vels = implemented.filter(d => d.implemented_at).map(d =>
        (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const avgVel = vels.length > 0 ? vels.reduce((s, v) => s + v, 0) / vels.length : 30;
      const velocity = Math.max(0, Math.min(25, Math.round(25 * (1 - avgVel / 60))));

      // Quality (0-25)
      const withOutcome = implemented.filter(d => d.actual_impact_score != null && d.ai_impact_score);
      const accs = withOutcome.map(d => 100 - Math.abs(d.ai_impact_score - d.actual_impact_score));
      const avgAcc = accs.length > 0 ? accs.reduce((s, a) => s + a, 0) / accs.length : 50;
      const quality = Math.round(avgAcc / 4);

      // Throughput (0-25)
      const throughput = Math.round((implemented.length / total) * 25);

      // Health (0-25)
      const overdue = decisions.filter(d => d.due_date && new Date(d.due_date).getTime() < now && !["implemented", "rejected"].includes(d.status));
      const health = Math.round((1 - overdue.length / total) * 25);

      const total_score = velocity + quality + throughput + health;
      setScore(total_score);
      setBreakdown({ velocity, quality, throughput, health });
    };
    calculate();
  }, []);

  const getColor = (s: number) => s > 70 ? "text-success" : s > 40 ? "text-warning" : "text-destructive";
  const getBgColor = (s: number) => s > 70 ? "bg-success" : s > 40 ? "bg-warning" : "bg-destructive";

  const components = [
    { label: "Velocity", value: breakdown.velocity, max: 25, icon: Zap },
    { label: "Qualität", value: breakdown.quality, max: 25, icon: Target },
    { label: "Durchsatz", value: breakdown.throughput, max: 25, icon: TrendingUp },
    { label: "Gesundheit", value: breakdown.health, max: 25, icon: HeartPulse },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Momentum Score</h3>
      </div>

      {score !== null ? (
        <>
          <div className="flex items-end gap-2 mb-1">
            <span className={`font-display text-4xl font-bold ${getColor(score)}`}>{score}</span>
            <span className="text-sm text-muted-foreground mb-1">/100</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-all ${getBgColor(score)}`} style={{ width: `${score}%` }} />
          </div>
          <div className="space-y-2">
            {components.map(c => (
              <div key={c.label} className="flex items-center gap-2">
                <c.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-16">{c.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.value / c.max) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-8 text-right">{c.value}/{c.max}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Berechne...</p>
      )}
    </motion.div>
  );
};

export default MomentumScoreWidget;

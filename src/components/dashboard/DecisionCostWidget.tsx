import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DecisionCostWidget = () => {
  const [totalCost, setTotalCost] = useState(0);
  const [delayedCount, setDelayedCount] = useState(0);
  const [topCosts, setTopCosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchCosts = async () => {
      const { data } = await supabase
        .from("decisions")
        .select("title, priority, created_at, due_date, status")
        .in("status", ["draft", "review"]);

      if (!data) return;

      const now = Date.now();
      const defaultRate = 75; // €/hour default
      let total = 0;
      const costs: any[] = [];

      data.forEach(d => {
        const daysOpen = (now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
        // 2 people, 2h/day overhead
        const cost = Math.round(daysOpen * 2 * 2 * defaultRate);
        total += cost;
        costs.push({ title: d.title, days: Math.round(daysOpen), cost, priority: d.priority });
      });

      setTotalCost(total);
      setDelayedCount(data.length);
      setTopCosts(costs.sort((a, b) => b.cost - a.cost).slice(0, 3));
    };
    fetchCosts();
  }, []);

  const formatCost = (cost: number) => {
    if (cost >= 1000) return `${(cost / 1000).toFixed(1)}k€`;
    return `${cost}€`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-destructive" />
        </div>
        <h3 className="text-sm font-semibold">Verzögerungskosten</h3>
      </div>

      <div className="flex items-end gap-2 mb-1">
        <span className="font-display text-3xl font-bold text-destructive">{formatCost(totalCost)}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {delayedCount} offene Entscheidungen verursachen Kosten
      </p>

      {topCosts.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          {topCosts.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className={`w-3 h-3 shrink-0 ${c.priority === "critical" ? "text-destructive" : c.priority === "high" ? "text-warning" : "text-muted-foreground"}`} />
                <span className="text-xs truncate">{c.title}</span>
              </div>
              <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DecisionCostWidget;

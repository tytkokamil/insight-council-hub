import { motion } from "framer-motion";
import { DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDecisions } from "@/hooks/useDecisions";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import WidgetSkeleton from "./WidgetSkeleton";

const DecisionCostWidget = () => {
  const { data: allDecisions = [], isLoading } = useDecisions();

  if (isLoading) return <WidgetSkeleton rows={3} showScore />;

  const openDecisions = allDecisions.filter(d => d.status === "draft" || d.status === "review");
  const now = Date.now();
  const defaultRate = 75;
  let totalCost = 0;
  const costs: any[] = [];

  openDecisions.forEach(d => {
    const daysOpen = (now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const cost = Math.round(daysOpen * 2 * 2 * defaultRate);
    totalCost += cost;
    costs.push({ title: d.title, days: Math.round(daysOpen), cost, priority: d.priority });
  });

  const topCosts = costs.sort((a, b) => b.cost - a.cost).slice(0, 3);

  const formatCost = (cost: number) => {
    if (cost >= 1000) return `${(cost / 1000).toFixed(1)}k€`;
    return `${cost}€`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm">Verzögerungskosten</CardTitle>
            <ScoreMethodology
              title="Verzögerungskosten"
              description="Geschätzte Opportunitätskosten durch offene Entscheidungen (Draft/Review) basierend auf Personalkosten."
              items={[
                { label: "Formel", formula: "Tage offen × 2 Personen × 2h/Tag × Stundensatz (Standard: 75€)" },
                { label: "Tage offen", formula: "Heute − Erstellungsdatum der Entscheidung" },
                { label: "Ranking", formula: "Top 3 nach höchsten Kosten sortiert" },
              ]}
              source="Basiert auf Team-Stundensätzen und geschätztem Overhead"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-1">
          <span className="font-display text-3xl font-bold text-destructive">{formatCost(totalCost)}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {openDecisions.length} offene Entscheidungen verursachen Kosten
        </p>

        {topCosts.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            {topCosts.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${c.priority === "critical" ? "text-destructive" : c.priority === "high" ? "text-warning" : "text-muted-foreground"}`} />
                  <span className="text-xs truncate">{c.title}</span>
                </div>
                <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DecisionCostWidget;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Loader2, AlertTriangle, CheckCircle2, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

const Briefing = () => {
  const [briefing, setBriefing] = useState<any>(null);
  const [costSummary, setCostSummary] = useState<any>(null);
  const [momentum, setMomentum] = useState<number | null>(null);
  const [momentumBreakdown, setMomentumBreakdown] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchBriefing = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ceo-briefing");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setBriefing(data.briefing);
      setCostSummary(data.cost_summary);
      setMomentum(data.momentum_score);
      setMomentumBreakdown(data.momentum_breakdown);
      setStats(data.stats);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message, variant: "destructive" });
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBriefing(); }, []);

  const formatCost = (cost: number) => cost >= 1000 ? `${(cost / 1000).toFixed(1)}k€` : `${cost}€`;
  const momentumColor = (s: number) => s > 70 ? "text-success" : s > 40 ? "text-warning" : "text-destructive";

  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">Generiere dein Morning Briefing...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-5 h-5 text-warning" />
              <h1 className="font-display text-xl font-bold">Morning Brief</h1>
            </div>
            <p className="text-muted-foreground text-sm">{today}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchBriefing(true)} disabled={refreshing} className="gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Momentum</p>
            <p className={`text-2xl font-bold font-display ${momentum !== null ? momentumColor(momentum) : ""}`}>{momentum ?? "—"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Verzögerungskosten</p>
            <p className="text-2xl font-bold font-display text-destructive">{costSummary ? formatCost(costSummary.total_delay_cost) : "—"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Überfällig</p>
            <p className="text-2xl font-bold font-display text-warning">{stats?.overdue ?? "—"}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Ø Velocity</p>
            <p className="text-2xl font-bold font-display text-primary">{stats?.avg_velocity ?? "—"}d</p>
          </motion.div>
        </div>

        {briefing ? (
          <div className="space-y-4">
            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
              <h2 className="font-display text-xl font-bold mb-1">{briefing.headline}</h2>
            </motion.div>

            {/* Urgent Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5 border-destructive/30">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Dringende Aktionen
              </h3>
              <div className="space-y-2">
                {briefing.urgent_actions?.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5">
                    <span className="text-destructive font-bold text-sm mt-0.5">{i + 1}.</span>
                    <p className="text-sm">{a}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {/* Wins */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Positive Entwicklungen
                </h3>
                <div className="space-y-2">
                  {briefing.wins?.map((w: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="text-success mt-0.5">✓</span> {w}
                    </p>
                  ))}
                </div>
              </motion.div>

              {/* Risks */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Risiken im Blick
                </h3>
                <div className="space-y-2">
                  {briefing.risks?.map((r: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <span className="text-warning mt-0.5">⚠</span> {r}
                    </p>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recommendation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="glass-card p-5 bg-primary/5 border-primary/20">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" /> Empfehlung für heute
              </h3>
              <p className="text-sm">{briefing.recommendation}</p>
            </motion.div>

            {/* Cost Breakdown */}
            {costSummary?.top_costs?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3">💰 Teuerste Verzögerungen</h3>
                <div className="space-y-2">
                  {costSummary.top_costs.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.days} Tage offen • {c.priority}</p>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <Sun className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Noch keine Daten für das Briefing vorhanden.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Briefing;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sun, Loader2, AlertTriangle, CheckCircle2, Zap, RefreshCw, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";

const priorityMap: Record<string, string> = {
  critical: "priorityCritical",
  high: "priorityHigh",
  medium: "priorityMedium",
  low: "priorityLow",
};

const BULLET_ICONS: Record<string, typeof AlertTriangle> = {
  problem: AlertTriangle,
  positive: CheckCircle2,
  recommendation: Zap,
};
const BULLET_COLORS: Record<string, string> = {
  problem: "text-destructive",
  positive: "text-success",
  recommendation: "text-primary",
};

const Briefing = ({ embedded }: { embedded?: boolean }) => {
  const { t, i18n } = useTranslation();
  const [briefing, setBriefing] = useState<any>(null);
  const [costSummary, setCostSummary] = useState<any>(null);
  const [momentum, setMomentum] = useState<number | null>(null);
  const [momentumBreakdown, setMomentumBreakdown] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchBriefing = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Try daily_briefs table first
      const today = new Date().toISOString().slice(0, 10);
      const { data: dailyBrief } = await supabase
        .from("daily_briefs" as any)
        .select("*")
        .eq("brief_date", today)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (dailyBrief && !isRefresh) {
        const db = dailyBrief as any;
        setBriefing(db.content);
        setCostSummary(db.cost_summary);
        setMomentum(db.momentum_score);
        setMomentumBreakdown(db.momentum_breakdown);
        setStats(db.stats);
        setLastUpdated(new Date(db.generated_at));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback/refresh: call ceo-briefing
      const { data, error } = await supabase.functions.invoke("ceo-briefing");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setBriefing(data.briefing);
      setCostSummary(data.cost_summary);
      setMomentum(data.momentum_score);
      setMomentumBreakdown(data.momentum_breakdown);
      setStats(data.stats);
      setLastUpdated(new Date());
    } catch (e: any) {
      toast({ title: t("briefing.error"), description: e.message, variant: "destructive" });
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBriefing(); }, []);

  const locale = i18n.language === "de" ? "de-DE" : "en-US";

  const formatCost = (cost: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cost);

  const translatePriority = (priority: string) => {
    const key = priorityMap[priority?.toLowerCase()];
    return key ? t(`briefing.${key}`) : priority;
  };

  const momentumColor = (s: number) => s > 70 ? "text-success" : s > 40 ? "text-warning" : "text-destructive";

  const today = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const formatLastUpdated = () => {
    if (!lastUpdated) return null;
    return lastUpdated.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const exportBriefingPdf = async () => {
    if (!briefing) return;
    const { default: jsPDF } = await import("jspdf");
    const { addPdfHeader, addPdfFooter } = await import("@/lib/pdfBranding");
    const doc = new jsPDF();
    let y = addPdfHeader(doc, t("briefing.subtitle", "Tägliche Entscheidungslage"), undefined, t("briefing.title"));

    doc.setFontSize(12);
    const kpis = [
      `${t("briefing.momentum")}: ${momentum ?? "—"}`,
      `${t("briefing.delayCost")}: ${costSummary ? formatCost(costSummary.total_delay_cost) : "—"}`,
      `${t("briefing.overdue")}: ${stats?.overdue ?? "—"}`,
      `${t("briefing.avgVelocity")}: ${stats?.avg_velocity ?? "—"}d`,
    ];
    kpis.forEach(k => { doc.text(k, 14, y); y += 6; });
    y += 4;

    doc.setFontSize(14);
    const headlineLines = doc.splitTextToSize(briefing.headline || "", 180);
    doc.text(headlineLines, 14, y);
    y += headlineLines.length * 6 + 6;

    doc.setFontSize(10);

    // Structured bullets
    if (briefing.bullets?.length) {
      doc.setFontSize(12);
      doc.text("Key Points", 14, y); y += 7;
      doc.setFontSize(10);
      briefing.bullets.forEach((b: any, i: number) => {
        const icon = b.type === "problem" ? "⚠️" : b.type === "positive" ? "✅" : "→";
        const lines = doc.splitTextToSize(`${icon} ${b.text}`, 175);
        doc.text(lines, 18, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    // Urgent actions (fallback)
    if (!briefing.bullets && briefing.urgent_actions?.length) {
      doc.setFontSize(12);
      doc.text(t("briefing.urgentActions"), 14, y); y += 7;
      doc.setFontSize(10);
      briefing.urgent_actions.forEach((a: string, i: number) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${a}`, 175);
        doc.text(lines, 18, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    if (briefing.recommendation) {
      doc.setFontSize(12);
      doc.text(t("briefing.recommendation"), 14, y); y += 7;
      doc.setFontSize(10);
      const recLines = doc.splitTextToSize(briefing.recommendation, 175);
      doc.text(recLines, 18, y);
      y += recLines.length * 5 + 6;
    }

    if (costSummary?.top_costs?.length) {
      doc.setFontSize(12);
      doc.text(t("briefing.topDelayCosts"), 14, y); y += 7;
      doc.setFontSize(10);
      costSummary.top_costs.forEach((c: any) => {
        doc.text(`${c.title} — ${formatCost(c.cost_per_day || c.cost)}/Tag (${translatePriority(c.priority)})`, 18, y);
        y += 6;
      });
    }

    addPdfFooter(doc);
    doc.save(`Decivio-Briefing-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: t("briefing.exportPdfSuccess"), description: t("briefing.exportPdfDesc") });
  };

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  if (loading) {
    return (
      <Wrap>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground">{t("briefing.loading")}</p>
          </div>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-5 h-5 text-warning" />
              <h1 className="font-display text-xl font-bold">{t("briefing.title")}</h1>
            </div>
            <p className="text-muted-foreground text-sm">{today}</p>
            {lastUpdated && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Generiert um {formatLastUpdated()} Uhr
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {briefing && (
              <Button variant="outline" size="sm" onClick={exportBriefingPdf} className="gap-1">
                <FileDown className="w-3.5 h-3.5" />
                {t("briefing.exportPdf")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchBriefing(true)} disabled={refreshing} className="gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {t("briefing.refresh")}
            </Button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("briefing.momentum")}</p>
              <p className={`text-2xl font-bold font-display ${momentum !== null ? momentumColor(momentum) : ""}`}>{momentum ?? "—"}</p>
            </CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("briefing.delayCost")}</p>
              <p className="text-2xl font-bold font-display text-destructive">{costSummary ? formatCost(costSummary.total_delay_cost) : "—"}</p>
            </CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("briefing.overdue")}</p>
              <p className="text-2xl font-bold font-display text-warning">{stats?.overdue ?? "—"}</p>
            </CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{t("briefing.avgVelocity")}</p>
              <p className="text-2xl font-bold font-display text-primary">{stats?.avg_velocity ?? "—"}d</p>
            </CardContent></Card>
          </motion.div>
        </div>

        {briefing ? (
          <div className="space-y-4">
            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card><CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-1">{briefing.headline}</h2>
              </CardContent></Card>
            </motion.div>

            {/* Structured Bullets */}
            {briefing.bullets?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card><CardContent className="p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" /> Key Points
                  </h3>
                  <div className="space-y-2">
                    {briefing.bullets.map((b: any, i: number) => {
                      const Icon = BULLET_ICONS[b.type] || Zap;
                      const color = BULLET_COLORS[b.type] || "text-muted-foreground";
                      return (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/20">
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                          <p className="text-sm">{b.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent></Card>
              </motion.div>
            )}

            {/* Fallback: Urgent Actions (old format) */}
            {!briefing.bullets && briefing.urgent_actions?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="border-destructive/30"><CardContent className="p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-destructive" /> {t("briefing.urgentActions")}
                  </h3>
                  <div className="space-y-2">
                    {briefing.urgent_actions.map((a: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5">
                        <span className="text-destructive font-bold text-sm mt-0.5">{i + 1}.</span>
                        <p className="text-sm">{a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent></Card>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Wins */}
              {briefing.wins?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex">
                  <Card className="flex-1"><CardContent className="p-5">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-success" /> {t("briefing.positives")}
                    </h3>
                    <div className="space-y-2">
                      {briefing.wins.map((w: string, i: number) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-success mt-0.5">✓</span> {w}
                        </p>
                      ))}
                    </div>
                  </CardContent></Card>
                </motion.div>
              )}

              {/* Risks */}
              {briefing.risks?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex">
                  <Card className="flex-1"><CardContent className="p-5">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-warning" /> {t("briefing.risksInView")}
                    </h3>
                    <div className="space-y-2">
                      {briefing.risks.map((r: string, i: number) => (
                        <p key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <span className="text-warning mt-0.5">⚠</span> {r}
                        </p>
                      ))}
                    </div>
                  </CardContent></Card>
                </motion.div>
              )}
            </div>

            {/* Recommendation */}
            {briefing.recommendation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                <Card className="bg-primary/5 border-primary/20"><CardContent className="p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" /> {t("briefing.recommendation")}
                  </h3>
                  <p className="text-sm">{briefing.recommendation}</p>
                </CardContent></Card>
              </motion.div>
            )}

            {/* Cost Breakdown */}
            {costSummary?.top_costs?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
                <Card><CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">💰 {t("briefing.topDelayCosts")}</h3>
                  <div className="space-y-2">
                    {costSummary.top_costs.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.cost_per_day ? `${formatCost(c.cost_per_day)}/Tag` : c.days ? `${c.days} ${t("briefing.daysOpen")}` : ""} · {translatePriority(c.priority)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-destructive shrink-0 ml-2">
                          {c.cost ? formatCost(c.cost) : c.cost_per_day ? `${formatCost(c.cost_per_day * 7)}/Wo` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent></Card>
              </motion.div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Sun className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("briefing.noData")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Wrap>
  );
};

export default Briefing;

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface Props {
  decisions: any[];
  risks?: any[];
}

const PortfolioRiskOverview = ({ decisions, risks = [] }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    const active = decisions.filter(d =>
      !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status)
    );

    const withRisk = active.filter(d => d.ai_risk_score != null && d.ai_risk_score > 0);
    const avgRisk = withRisk.length > 0
      ? Math.round(withRisk.reduce((sum, d) => sum + (d.ai_risk_score || 0), 0) / withRisk.length)
      : 0;

    const highRisk = active.filter(d => (d.ai_risk_score || 0) >= 60);
    const criticalRisk = active.filter(d => (d.ai_risk_score || 0) >= 80);

    const distribution = {
      low: active.filter(d => (d.ai_risk_score || 0) < 30).length,
      medium: active.filter(d => (d.ai_risk_score || 0) >= 30 && (d.ai_risk_score || 0) < 60).length,
      high: active.filter(d => (d.ai_risk_score || 0) >= 60 && (d.ai_risk_score || 0) < 80).length,
      critical: active.filter(d => (d.ai_risk_score || 0) >= 80).length,
    };
    const total = distribution.low + distribution.medium + distribution.high + distribution.critical;

    const openRisks = risks.filter(r => r.status === "open");
    const criticalOpenRisks = openRisks.filter(r => (r.risk_score || r.likelihood * r.impact) >= 15);

    const catRisk: Record<string, number[]> = {};
    active.forEach(d => {
      if (!catRisk[d.category]) catRisk[d.category] = [];
      catRisk[d.category].push(d.ai_risk_score || 0);
    });
    const riskiestCategory = Object.entries(catRisk)
      .map(([cat, scores]) => ({ cat, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
      .sort((a, b) => b.avg - a.avg)[0];

    const topRiskDecisions = [...active]
      .sort((a, b) => (b.ai_risk_score || 0) - (a.ai_risk_score || 0))
      .slice(0, 3);

    return {
      activeCount: active.length, avgRisk, highRisk: highRisk.length, criticalRisk: criticalRisk.length,
      distribution, total, openRisks: openRisks.length, criticalOpenRisks: criticalOpenRisks.length,
      riskiestCategory, topRiskDecisions,
    };
  }, [decisions, risks]);

  const riskLevel = analysis.avgRisk >= 60 ? "critical" : analysis.avgRisk >= 40 ? "elevated" : analysis.avgRisk >= 20 ? "moderate" : "low";
  const riskConfig = {
    critical: { label: t("portfolioRisk.criticalLabel"), color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
    elevated: { label: t("portfolioRisk.elevatedLabel"), color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
    moderate: { label: t("portfolioRisk.moderateLabel"), color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
    low: { label: t("portfolioRisk.lowLabel"), color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  }[riskLevel];

  const catLabels: Record<string, string> = {
    strategic: t("portfolioRisk.catStrategic"), budget: t("portfolioRisk.catBudget"), hr: t("portfolioRisk.catHr"),
    technical: t("portfolioRisk.catTechnical"), operational: t("portfolioRisk.catOperational"), marketing: t("portfolioRisk.catMarketing"),
  };

  if (analysis.activeCount === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            {t("portfolioRisk.title")}
          </h2>
        </div>
        <Card>
          <CardContent className="p-5 text-center">
            <Shield className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("common.noData", { defaultValue: "Noch keine Daten vorhanden." })}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" />
          {t("portfolioRisk.title")}
        </h2>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => navigate("/risk-register")}>
          {t("portfolioRisk.riskRegister")} <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card className={`border ${riskConfig.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${riskConfig.bg} flex items-center justify-center`}>
                <Shield className={`w-4 h-4 ${riskConfig.color}`} />
              </div>
              <span className="text-[10px] text-muted-foreground">{t("portfolioRisk.portfolioRisk")}</span>
            </div>
            <p className={`text-2xl font-bold font-display tabular-nums ${riskConfig.color}`}>{analysis.avgRisk}%</p>
            <Badge className={`text-[9px] mt-1 ${riskConfig.bg} ${riskConfig.color} border-0`}>{riskConfig.label}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-[10px] text-muted-foreground">{t("portfolioRisk.highRisk")}</span>
            </div>
            <p className="text-2xl font-bold font-display tabular-nums">{analysis.highRisk}</p>
            <p className="text-[10px] text-muted-foreground">{t("portfolioRisk.ofActive", { count: analysis.activeCount })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-warning" />
              <span className="text-[10px] text-muted-foreground">{t("portfolioRisk.openRisks")}</span>
            </div>
            <p className="text-2xl font-bold font-display tabular-nums">{analysis.openRisks}</p>
            {analysis.criticalOpenRisks > 0 && (
              <p className="text-[10px] text-destructive">{t("portfolioRisk.criticalCount", { count: analysis.criticalOpenRisks })}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">{t("portfolioRisk.riskHotspot")}</span>
            </div>
            {analysis.riskiestCategory ? (
              <>
                <p className="text-sm font-semibold">{catLabels[analysis.riskiestCategory.cat] || analysis.riskiestCategory.cat}</p>
                <p className="text-[10px] text-muted-foreground">{t("portfolioRisk.avgRisk", { avg: analysis.riskiestCategory.avg })}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {analysis.total > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-medium mb-3">{t("portfolioRisk.riskDistribution")}</p>
            <div className="flex rounded-full overflow-hidden h-3 bg-muted">
              {[
                { key: "low", count: analysis.distribution.low, color: "bg-success", label: t("portfolioRisk.distLow") },
                { key: "medium", count: analysis.distribution.medium, color: "bg-primary", label: t("portfolioRisk.distMedium") },
                { key: "high", count: analysis.distribution.high, color: "bg-warning", label: t("portfolioRisk.distHigh") },
                { key: "critical", count: analysis.distribution.critical, color: "bg-destructive", label: t("portfolioRisk.distCritical") },
              ].filter(b => b.count > 0).map(b => (
                <Tooltip key={b.key}>
                  <TooltipTrigger asChild>
                    <div className={`${b.color} transition-all`} style={{ width: `${(b.count / analysis.total) * 100}%` }} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{b.label}: {t("portfolioRisk.decisionsCount", { count: b.count })}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> {t("portfolioRisk.distLow").split(" ")[0]}: {analysis.distribution.low}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> {t("portfolioRisk.distMedium").split(" ")[0]}: {analysis.distribution.medium}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> {t("portfolioRisk.distHigh").split(" ")[0]}: {analysis.distribution.high}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> {t("portfolioRisk.distCritical").split(" ")[0]}: {analysis.distribution.critical}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.topRiskDecisions.length > 0 && analysis.topRiskDecisions[0].ai_risk_score > 0 && (
        <div className="space-y-1.5">
          {analysis.topRiskDecisions.map((d, i) => (
            <button
              key={d.id}
              onClick={() => navigate(`/decisions/${d.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors text-left"
            >
              <span className={`text-xs font-bold w-5 text-center ${(d.ai_risk_score || 0) >= 60 ? "text-destructive" : "text-muted-foreground"}`}>
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{d.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{catLabels[d.category] || d.category} · {d.priority}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${(d.ai_risk_score || 0) >= 60 ? "text-destructive" : (d.ai_risk_score || 0) >= 40 ? "text-warning" : "text-success"}`}>
                  {d.ai_risk_score}%
                </p>
                <p className="text-[10px] text-muted-foreground">{t("portfolioRisk.risk")}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default PortfolioRiskOverview;

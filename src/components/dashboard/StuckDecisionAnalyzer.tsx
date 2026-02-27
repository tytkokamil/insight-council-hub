import { useMemo } from "react";
import { formatCost } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { AlertTriangle, Clock, Users, MessageSquare, Link2, ArrowRight, Zap, Pause, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface StuckReason {
  type: "no_activity" | "missing_reviewer" | "blocked_dependency" | "sla_violation" | "stale_draft";
  label: string;
  icon: any;
  severity: "critical" | "high" | "medium";
}

interface StuckDecision {
  id: string;
  title: string;
  status: string;
  priority: string;
  daysStuck: number;
  reasons: StuckReason[];
  recommendation: string;
  delayCost: number;
  blockerDetail: string;
}

const REASON_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  no_activity: { icon: Pause, color: "text-warning", bgColor: "bg-warning/10" },
  missing_reviewer: { icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
  blocked_dependency: { icon: Link2, color: "text-destructive", bgColor: "bg-destructive/10" },
  sla_violation: { icon: Clock, color: "text-destructive", bgColor: "bg-destructive/10" },
  stale_draft: { icon: MessageSquare, color: "text-muted-foreground", bgColor: "bg-muted" },
};

interface Props {
  decisions: any[];
  reviews?: any[];
  dependencies?: any[];
  teams?: any[];
}

const StuckDecisionAnalyzer = ({ decisions, reviews = [], dependencies = [], teams = [] }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const now = new Date();

  const teamRateMap = useMemo(() => {
    const map: Record<string, number> = {};
    teams.forEach((ti: any) => { if (ti.hourly_rate) map[ti.id] = ti.hourly_rate; });
    return map;
  }, [teams]);

  const stuckDecisions = useMemo<StuckDecision[]>(() => {
    const active = decisions.filter(d =>
      !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status)
    );

    const results: StuckDecision[] = [];

    for (const d of active) {
      const reasons: StuckReason[] = [];
      const daysSinceUpdate = differenceInDays(now, new Date(d.updated_at));
      const daysSinceCreation = differenceInDays(now, new Date(d.created_at));
      let blockerDetail = "";

      if (daysSinceUpdate >= 7) {
        reasons.push({
          type: "no_activity",
          label: t("widgets.daysNoActivity", { days: daysSinceUpdate }),
          icon: Pause,
          severity: daysSinceUpdate >= 14 ? "critical" : "high",
        });
      }

      if (d.status === "review") {
        const decReviews = reviews.filter(r => r.decision_id === d.id);
        const pendingCount = decReviews.filter(r => !r.reviewed_at).length;
        if (decReviews.length === 0) {
          reasons.push({ type: "missing_reviewer", label: t("widgets.noReviewer"), icon: Users, severity: "high" });
          blockerDetail = `${t("widgets.blockedByLabel")}: ${t("widgets.noReviewer")}`;
        } else if (pendingCount > 0 && daysSinceUpdate >= 5) {
          reasons.push({ type: "missing_reviewer", label: t("widgets.reviewsPending", { count: pendingCount }), icon: Users, severity: "medium" });
          blockerDetail = `${t("widgets.blockedByLabel")}: ${t("widgets.reviewsPending", { count: pendingCount })}`;
        }
      }

      const blockedBy = dependencies.filter(
        dep => dep.target_decision_id === d.id && dep.dependency_type === "blocks"
      );
      if (blockedBy.length > 0) {
        const blockingDecision = decisions.find(bd => bd.id === blockedBy[0].source_decision_id);
        if (blockingDecision && !["implemented", "rejected"].includes(blockingDecision.status)) {
          reasons.push({
            type: "blocked_dependency",
            label: t("widgets.blockedBy", { title: blockingDecision.title?.substring(0, 30) }),
            icon: Link2,
            severity: "high",
          });
          blockerDetail = `${t("widgets.blockedByLabel")}: "${blockingDecision.title?.substring(0, 40)}"`;
        }
      }

      if (d.due_date && new Date(d.due_date) < now) {
        const daysOverdue = differenceInDays(now, new Date(d.due_date));
        reasons.push({
          type: "sla_violation",
          label: t("widgets.daysOverdue", { days: daysOverdue }),
          icon: Clock,
          severity: daysOverdue >= 7 ? "critical" : "high",
        });
      }

      if (d.status === "draft" && daysSinceCreation >= 10) {
        reasons.push({
          type: "stale_draft",
          label: t("widgets.draftSince", { days: daysSinceCreation }),
          icon: MessageSquare,
          severity: daysSinceCreation >= 21 ? "high" : "medium",
        });
      }

      if (reasons.length > 0) {
        const topReason = reasons.sort((a, b) => {
          const sev = { critical: 3, high: 2, medium: 1 };
          return sev[b.severity] - sev[a.severity];
        })[0];

        let recommendation = "";
        switch (topReason.type) {
          case "no_activity": recommendation = t("widgets.recStatusUpdate"); break;
          case "missing_reviewer": recommendation = t("widgets.recAssignReviewer"); break;
          case "blocked_dependency": recommendation = t("widgets.recPrioritizeBlocker"); break;
          case "sla_violation": recommendation = t("widgets.recEscalate"); break;
          case "stale_draft": recommendation = t("widgets.recFinishDraft"); break;
        }

        const rate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : 75;
        const multiplier = d.priority === "critical" ? 4 : d.priority === "high" ? 2 : 1;
        const delayCost = Math.round(Math.max(daysSinceUpdate, 1) * 2 * 2 * rate * multiplier);

        results.push({
          id: d.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          daysStuck: Math.max(daysSinceUpdate, daysSinceCreation >= 10 ? daysSinceCreation : 0),
          reasons,
          recommendation,
          delayCost,
          blockerDetail: blockerDetail || t("widgets.daysNoProgress", { days: daysSinceUpdate }),
        });
      }
    }

    return results.sort((a, b) => {
      const maxSev = (r: StuckReason[]) => Math.max(...r.map(x => x.severity === "critical" ? 3 : x.severity === "high" ? 2 : 1));
      return maxSev(b.reasons) - maxSev(a.reasons) || b.delayCost - a.delayCost;
    }).slice(0, 5);
  }, [decisions, reviews, dependencies, teamRateMap, t]);

  if (stuckDecisions.length === 0) return null;

  const totalCost = stuckDecisions.reduce((s, d) => s + d.delayCost, 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-warning" />
          {t("widgets.stuckAnalyzer")}
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-normal text-destructive border-destructive/20">
            <DollarSign className="w-3 h-3 mr-0.5" />
            {formatCost(totalCost)} {t("widgets.delayCosts")}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal">
            {stuckDecisions.length} {t("widgets.blocked")}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        {stuckDecisions.map(d => (
          <Card key={d.id} className="border-warning/20 hover:border-warning/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button
                      onClick={() => navigate(`/decisions/${d.id}`)}
                      className="text-sm font-medium hover:text-primary transition-colors truncate max-w-[300px] text-left"
                    >
                      {d.title}
                    </button>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{d.status}</Badge>
                    <span className="text-[10px] font-bold text-destructive ml-auto shrink-0">{formatCost(d.delayCost)}</span>
                  </div>

                  <p className="text-[11px] text-destructive/80 font-medium mb-1.5">{d.blockerDetail}</p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {d.reasons.map((r, i) => {
                      const cfg = REASON_CONFIG[r.type];
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.bgColor} ${cfg.color}`}>
                              <cfg.icon className="w-3 h-3" />
                              {r.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{r.severity === "critical" ? t("widgets.severityCritical") : r.severity === "high" ? t("widgets.severityHigh") : t("widgets.severityMedium")}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                    <span className="text-[10px]">💡</span>
                    <span className="text-[11px] text-muted-foreground flex-1">
                      <span className="font-medium text-foreground">{t("widgets.recommended")}: </span>
                      {d.recommendation}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] shrink-0"
                      onClick={() => navigate(`/decisions/${d.id}`)}
                    >
                      {t("widgets.openAction")} <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StuckDecisionAnalyzer;

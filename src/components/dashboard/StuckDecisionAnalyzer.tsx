import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { AlertTriangle, Clock, Users, MessageSquare, Link2, ArrowRight, Zap, Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
}

const StuckDecisionAnalyzer = ({ decisions, reviews = [], dependencies = [] }: Props) => {
  const navigate = useNavigate();
  const now = new Date();

  const stuckDecisions = useMemo<StuckDecision[]>(() => {
    const active = decisions.filter(d =>
      !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status)
    );

    const results: StuckDecision[] = [];

    for (const d of active) {
      const reasons: StuckReason[] = [];
      const daysSinceUpdate = differenceInDays(now, new Date(d.updated_at));
      const daysSinceCreation = differenceInDays(now, new Date(d.created_at));

      // No activity for 7+ days
      if (daysSinceUpdate >= 7) {
        reasons.push({
          type: "no_activity",
          label: `${daysSinceUpdate} Tage ohne Aktivität`,
          icon: Pause,
          severity: daysSinceUpdate >= 14 ? "critical" : "high",
        });
      }

      // In review but no reviewers assigned or no reviews done
      if (d.status === "review") {
        const decReviews = reviews.filter(r => r.decision_id === d.id);
        if (decReviews.length === 0) {
          reasons.push({
            type: "missing_reviewer",
            label: "Kein Reviewer zugewiesen",
            icon: Users,
            severity: "high",
          });
        } else {
          const pendingAll = decReviews.every(r => !r.reviewed_at);
          if (pendingAll && daysSinceUpdate >= 5) {
            reasons.push({
              type: "missing_reviewer",
              label: "Alle Reviews ausstehend",
              icon: Users,
              severity: "medium",
            });
          }
        }
      }

      // Blocked by dependency
      const blockedBy = dependencies.filter(
        dep => dep.target_decision_id === d.id && dep.dependency_type === "blocks"
      );
      if (blockedBy.length > 0) {
        const blockingDecision = decisions.find(bd => bd.id === blockedBy[0].source_decision_id);
        if (blockingDecision && !["implemented", "rejected"].includes(blockingDecision.status)) {
          reasons.push({
            type: "blocked_dependency",
            label: `Blockiert durch "${blockingDecision.title?.substring(0, 30)}..."`,
            icon: Link2,
            severity: "high",
          });
        }
      }

      // SLA violation (overdue)
      if (d.due_date && new Date(d.due_date) < now) {
        const daysOverdue = differenceInDays(now, new Date(d.due_date));
        reasons.push({
          type: "sla_violation",
          label: `${daysOverdue} Tage überfällig`,
          icon: Clock,
          severity: daysOverdue >= 7 ? "critical" : "high",
        });
      }

      // Stale draft (draft for 10+ days)
      if (d.status === "draft" && daysSinceCreation >= 10) {
        reasons.push({
          type: "stale_draft",
          label: `Draft seit ${daysSinceCreation} Tagen`,
          icon: MessageSquare,
          severity: daysSinceCreation >= 21 ? "high" : "medium",
        });
      }

      if (reasons.length > 0) {
        // Generate recommendation
        const topReason = reasons.sort((a, b) => {
          const sev = { critical: 3, high: 2, medium: 1 };
          return sev[b.severity] - sev[a.severity];
        })[0];

        let recommendation = "";
        switch (topReason.type) {
          case "no_activity":
            recommendation = "Statusupdate anfordern oder Eskalation einleiten";
            break;
          case "missing_reviewer":
            recommendation = "Reviewer zuweisen oder Review-Flow starten";
            break;
          case "blocked_dependency":
            recommendation = "Blockierende Entscheidung priorisieren";
            break;
          case "sla_violation":
            recommendation = "Sofortige Eskalation – SLA verletzt";
            break;
          case "stale_draft":
            recommendation = "Draft abschließen oder archivieren";
            break;
        }

        results.push({
          id: d.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          daysStuck: Math.max(daysSinceUpdate, daysSinceCreation >= 10 ? daysSinceCreation : 0),
          reasons,
          recommendation,
        });
      }
    }

    return results.sort((a, b) => {
      const maxSev = (r: StuckReason[]) => Math.max(...r.map(x => x.severity === "critical" ? 3 : x.severity === "high" ? 2 : 1));
      return maxSev(b.reasons) - maxSev(a.reasons) || b.daysStuck - a.daysStuck;
    }).slice(0, 5);
  }, [decisions, reviews, dependencies]);

  if (stuckDecisions.length === 0) return null;

  const severityColor = (s: string) =>
    s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : "text-muted-foreground";

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-warning" />
          Stuck Decision Analyzer
        </h2>
        <Badge variant="outline" className="text-[10px] font-normal">
          {stuckDecisions.length} blockiert
        </Badge>
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
                  </div>

                  {/* Reasons */}
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
                            <p className="text-xs">Schwere: {r.severity === "critical" ? "Kritisch" : r.severity === "high" ? "Hoch" : "Mittel"}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Recommendation */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">💡</span>
                    <span className="text-[11px] text-muted-foreground">{d.recommendation}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] ml-auto shrink-0"
                      onClick={() => navigate(`/decisions/${d.id}`)}
                    >
                      Öffnen <ArrowRight className="w-3 h-3 ml-0.5" />
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

import { useMemo, useState, useCallback } from "react";
import { formatCost } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import {
  AlertTriangle, Clock, Users, MessageSquare, Link2, ArrowRight,
  Zap, Pause, DollarSign, Bell, TrendingUp, FileText, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invokeWithTimeout } from "@/lib/edgeFunctionHelper";

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
  stuckPhase: string;
  owner_id: string;
  assignee_id?: string;
  pendingReviewerIds: string[];
}

const REASON_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  no_activity: { icon: Pause, color: "text-warning", bgColor: "bg-warning/10" },
  missing_reviewer: { icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
  blocked_dependency: { icon: Link2, color: "text-destructive", bgColor: "bg-destructive/10" },
  sla_violation: { icon: Clock, color: "text-destructive", bgColor: "bg-destructive/10" },
  stale_draft: { icon: MessageSquare, color: "text-muted-foreground", bgColor: "bg-muted" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  proposed: "Vorgeschlagen",
  review: "Review-Phase",
  approved: "Genehmigt",
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const now = new Date();

  const [aiDiagnoses, setAiDiagnoses] = useState<Record<string, string>>({});
  const [loadingDiagnosis, setLoadingDiagnosis] = useState<Record<string, boolean>>({});
  const [blockNoteDialog, setBlockNoteDialog] = useState<StuckDecision | null>(null);
  const [blockNote, setBlockNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamRateMap = useMemo(() => {
    const map: Record<string, number> = {};
    teams.forEach((ti: any) => { if (ti.hourly_rate) map[ti.id] = ti.hourly_rate; });
    return map;
  }, [teams]);

  const stuckDecisions = useMemo<StuckDecision[]>(() => {
    const STUCK_THRESHOLD = 5; // days
    const active = decisions.filter(d =>
      !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status)
    );

    const results: StuckDecision[] = [];

    for (const d of active) {
      const reasons: StuckReason[] = [];
      const lastActivity = d.last_activity_at || d.updated_at;
      const daysSinceActivity = differenceInDays(now, new Date(lastActivity));
      const daysSinceCreation = differenceInDays(now, new Date(d.created_at));
      let blockerDetail = "";
      let pendingReviewerIds: string[] = [];

      // Only consider stuck if threshold met
      if (daysSinceActivity < STUCK_THRESHOLD && daysSinceCreation < 10) continue;

      if (daysSinceActivity >= STUCK_THRESHOLD) {
        reasons.push({
          type: "no_activity",
          label: `${daysSinceActivity} Tage ohne Aktivität`,
          icon: Pause,
          severity: daysSinceActivity >= 14 ? "critical" : daysSinceActivity >= 7 ? "high" : "medium",
        });
      }

      if (d.status === "review") {
        const decReviews = reviews.filter(r => r.decision_id === d.id);
        const pending = decReviews.filter(r => !r.reviewed_at);
        pendingReviewerIds = pending.map(r => r.reviewer_id);

        if (decReviews.length === 0) {
          reasons.push({ type: "missing_reviewer", label: "Kein Reviewer zugewiesen", icon: Users, severity: "high" });
          blockerDetail = "Kein Reviewer zugewiesen";
        } else if (pending.length > 0 && daysSinceActivity >= STUCK_THRESHOLD) {
          reasons.push({
            type: "missing_reviewer",
            label: `${pending.length} Review${pending.length > 1 ? "s" : ""} ausstehend`,
            icon: Users,
            severity: "medium",
          });
          blockerDetail = `${pending.length} Reviewer hat/haben nicht reagiert`;
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
            label: `Blockiert von: ${blockingDecision.title?.substring(0, 30)}`,
            icon: Link2,
            severity: "high",
          });
          blockerDetail = `Blockiert von: "${blockingDecision.title?.substring(0, 40)}"`;
        }
      }

      if (d.due_date && new Date(d.due_date) < now) {
        const daysOverdue = differenceInDays(now, new Date(d.due_date));
        reasons.push({
          type: "sla_violation",
          label: `${daysOverdue} Tage überfällig`,
          icon: Clock,
          severity: daysOverdue >= 7 ? "critical" : "high",
        });
      }

      if (d.status === "draft" && daysSinceCreation >= 10) {
        reasons.push({
          type: "stale_draft",
          label: `Entwurf seit ${daysSinceCreation} Tagen`,
          icon: MessageSquare,
          severity: daysSinceCreation >= 21 ? "high" : "medium",
        });
      }

      if (reasons.length === 0) continue;

      const topReason = [...reasons].sort((a, b) => {
        const sev = { critical: 3, high: 2, medium: 1 };
        return sev[b.severity] - sev[a.severity];
      })[0];

      let recommendation = "";
      switch (topReason.type) {
        case "no_activity": recommendation = "Status-Update anfordern oder Entscheidung eskalieren."; break;
        case "missing_reviewer": recommendation = "Reviewer erinnern oder neuen Reviewer zuweisen."; break;
        case "blocked_dependency": recommendation = "Blockierende Entscheidung priorisieren."; break;
        case "sla_violation": recommendation = "Sofort eskalieren — SLA verletzt."; break;
        case "stale_draft": recommendation = "Entwurf fertigstellen oder archivieren."; break;
      }

      const rate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : 75;
      const multiplier = d.priority === "critical" ? 4 : d.priority === "high" ? 2 : 1;
      const delayCost = Math.round(Math.max(daysSinceActivity, 1) * 2 * rate * multiplier);

      results.push({
        id: d.id,
        title: d.title,
        status: d.status,
        priority: d.priority,
        daysStuck: daysSinceActivity,
        reasons,
        recommendation,
        delayCost,
        blockerDetail: blockerDetail || `${daysSinceActivity} Tage ohne Fortschritt`,
        stuckPhase: STATUS_LABELS[d.status] || d.status,
        owner_id: d.owner_id,
        assignee_id: d.assignee_id,
        pendingReviewerIds,
      });
    }

    return results.sort((a, b) => {
      const maxSev = (r: StuckReason[]) => Math.max(...r.map(x => x.severity === "critical" ? 3 : x.severity === "high" ? 2 : 1));
      return maxSev(b.reasons) - maxSev(a.reasons) || b.delayCost - a.delayCost;
    }).slice(0, 5);
  }, [decisions, reviews, dependencies, teamRateMap]);

  // ── AI Diagnosis ──
  const fetchDiagnosis = useCallback(async (d: StuckDecision) => {
    if (aiDiagnoses[d.id] || loadingDiagnosis[d.id]) return;
    setLoadingDiagnosis(prev => ({ ...prev, [d.id]: true }));

    try {
      const { data, error } = await invokeWithTimeout("analyze-decision", {
        type: "stuck-diagnosis",
        decision: {
          title: d.title,
          status: d.status,
          priority: d.priority,
          daysStuck: d.daysStuck,
          blockerDetail: d.blockerDetail,
          reasons: d.reasons.map(r => r.label),
          delayCost: d.delayCost,
        },
      }, 15_000);

      if (error) throw error;
      const diagnosis = (data as any)?.diagnosis || "Analyse konnte nicht erstellt werden.";
      setAiDiagnoses(prev => ({ ...prev, [d.id]: diagnosis }));
    } catch {
      setAiDiagnoses(prev => ({ ...prev, [d.id]: "KI-Analyse temporär nicht verfügbar." }));
    } finally {
      setLoadingDiagnosis(prev => ({ ...prev, [d.id]: false }));
    }
  }, [aiDiagnoses, loadingDiagnosis]);

  // ── Actions ──
  const handleRemindReviewer = async (d: StuckDecision) => {
    if (!user) return;
    const targets = d.pendingReviewerIds.length > 0
      ? d.pendingReviewerIds
      : [d.assignee_id || d.owner_id].filter(Boolean);

    if (targets.length === 0 || (targets.length === 1 && targets[0] === user.id)) {
      toast.info("Du bist selbst zuständig — öffne die Entscheidung direkt");
      navigate(`/decisions/${d.id}`);
      return;
    }

    try {
      for (const uid of targets) {
        if (uid === user.id) continue;
        await supabase.from("notifications").insert({
          user_id: uid,
          decision_id: d.id,
          type: "reminder",
          title: "Erinnerung: Review ausstehend",
          message: `"${d.title}" steckt seit ${d.daysStuck} Tagen in der Phase "${d.stuckPhase}". Bitte prüfe deinen ausstehenden Review.`,
        });
      }
      toast.success(`${targets.filter(u => u !== user.id).length} Erinnerung(en) gesendet`);
    } catch {
      toast.error("Fehler beim Senden");
    }
  };

  const handleEscalate = async (d: StuckDecision) => {
    if (!user) return;
    try {
      await supabase.from("decisions").update({
        escalation_level: 1,
        last_escalated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      }).eq("id", d.id);

      const notifyUserId = d.owner_id !== user.id ? d.owner_id : d.assignee_id;
      if (notifyUserId) {
        await supabase.from("notifications").insert({
          user_id: notifyUserId,
          decision_id: d.id,
          type: "escalation",
          title: "Entscheidung eskaliert",
          message: `"${d.title}" wurde manuell eskaliert — feststeckend seit ${d.daysStuck} Tagen in "${d.stuckPhase}".`,
        });
      }

      toast.success("Entscheidung eskaliert");
      qc.invalidateQueries({ queryKey: ["decisions"] });
    } catch {
      toast.error("Fehler beim Eskalieren");
    }
  };

  const handleBlockNote = async () => {
    if (!blockNoteDialog || !user || !blockNote.trim()) return;
    setIsSubmitting(true);
    try {
      await supabase.from("comments").insert({
        decision_id: blockNoteDialog.id,
        user_id: user.id,
        content: `⚠️ **Blockade notiert**: ${blockNote}`,
        type: "comment",
      });
      await supabase.from("decisions").update({
        last_activity_at: new Date().toISOString(),
      }).eq("id", blockNoteDialog.id);

      toast.success("Blockade dokumentiert");
      qc.invalidateQueries({ queryKey: ["decisions"] });
      setBlockNoteDialog(null);
      setBlockNote("");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stuckDecisions.length === 0) return null;

  const totalCost = stuckDecisions.reduce((s, d) => s + d.delayCost, 0);

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            ⚠️ Feststeckende Entscheidungen: {stuckDecisions.length}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-normal text-destructive border-destructive/20">
              <DollarSign className="w-3 h-3 mr-0.5" />
              {formatCost(totalCost)} Verzögerungskosten
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {stuckDecisions.map(d => (
            <Card key={d.id} className="border-l-4 border-l-warning/60 hover:border-l-warning transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <button
                        onClick={() => navigate(`/decisions/${d.id}`)}
                        className="text-sm font-medium hover:text-primary transition-colors truncate max-w-[300px] text-left"
                      >
                        {d.title}
                      </button>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Feststeckend in: {d.stuckPhase}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Seit: <span className="font-semibold text-warning">{d.daysStuck} Tagen</span>
                      </span>
                    </div>

                    {/* Blocker detail */}
                    <p className="text-[11px] text-destructive/80 font-medium mb-1.5">{d.blockerDetail}</p>

                    {/* Reason pills */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {d.reasons.map((r, i) => {
                        const cfg = REASON_CONFIG[r.type];
                        return (
                          <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${cfg.bgColor} ${cfg.color}`}>
                            <cfg.icon className="w-3 h-3" />
                            {r.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* AI Diagnosis */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => fetchDiagnosis(d)}
                          className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 mb-2"
                        >
                          {loadingDiagnosis[d.id] ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> KI analysiert...</>
                          ) : aiDiagnoses[d.id] ? (
                            <><Zap className="w-3 h-3" /> KI-Diagnose</>
                          ) : (
                            <><Zap className="w-3 h-3" /> Warum feststeckend? (KI)</>
                          )}
                        </button>
                      </TooltipTrigger>
                      {aiDiagnoses[d.id] && (
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">{aiDiagnoses[d.id]}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    {aiDiagnoses[d.id] && (
                      <div className="p-2 rounded-md bg-primary/[0.04] border border-primary/10 mb-2">
                        <p className="text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground">🤖 KI-Diagnose: </span>
                          {aiDiagnoses[d.id]}
                        </p>
                      </div>
                    )}

                    {/* Recommendation + Actions */}
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 flex-wrap">
                      <span className="text-[10px]">💡</span>
                      <span className="text-[11px] text-muted-foreground flex-1">
                        <span className="font-medium text-foreground">Empfehlung: </span>
                        {d.recommendation}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => handleRemindReviewer(d)}
                          title="Reviewer/Zuständige erinnern"
                        >
                          <Bell className="w-3 h-3" /> Erinnern
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleEscalate(d)}
                          title="Entscheidung eskalieren"
                        >
                          <TrendingUp className="w-3 h-3" /> Eskalieren
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => { setBlockNoteDialog(d); setBlockNote(""); }}
                          title="Blockade-Grund dokumentieren"
                        >
                          <FileText className="w-3 h-3" /> Notieren
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ BLOCK NOTE DIALOG ═══ */}
      <Dialog open={!!blockNoteDialog} onOpenChange={(open) => !open && setBlockNoteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              Blockade dokumentieren
            </DialogTitle>
            <DialogDescription>
              Notiere warum „{blockNoteDialog?.title}" feststeckt. Dies wird als Kommentar gespeichert.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={blockNote}
            onChange={e => setBlockNote(e.target.value)}
            placeholder="Z.B. 'Warte auf Freigabe von Legal-Abteilung' oder 'Budget-Entscheidung steht noch aus'"
            rows={3}
            className="resize-none"
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockNoteDialog(null)}>Abbrechen</Button>
            <Button onClick={handleBlockNote} disabled={isSubmitting || !blockNote.trim()} className="gap-1.5">
              {isSubmitting ? "Wird gespeichert..." : "Blockade notieren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StuckDecisionAnalyzer;

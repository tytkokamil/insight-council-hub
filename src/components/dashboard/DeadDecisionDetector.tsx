import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, ArrowRight, Archive, Bell, MessageSquare, X, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { formatCost } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  decisions: any[];
}

interface DeadDecision {
  id: string;
  title: string;
  daysInactive: number;
  costPerDay: number;
  weeklyCost: number;
  status: string;
  owner_id: string;
  assignee_id?: string;
}

const DeadDecisionDetector = ({ decisions }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const now = new Date();

  const [reviveDialog, setReviveDialog] = useState<DeadDecision | null>(null);
  const [reviveComment, setReviveComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deadDecisions = useMemo<DeadDecision[]>(() => {
    const activeStatuses = ["draft", "proposed", "review", "approved"];
    return decisions
      .filter(d => activeStatuses.includes(d.status) && !d.deleted_at && !d.archived_at)
      .map(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = differenceInDays(now, new Date(lastActivity));
        if (daysInactive < 14) return null;
        return {
          id: d.id,
          title: d.title,
          daysInactive,
          costPerDay: d.cost_per_day || 0,
          weeklyCost: (d.cost_per_day || 0) * 7,
          status: d.status,
          owner_id: d.owner_id,
          assignee_id: d.assignee_id,
        };
      })
      .filter(Boolean) as DeadDecision[];
  }, [decisions]);

  const sorted = [...deadDecisions].sort((a, b) => b.daysInactive - a.daysInactive);
  const displayed = sorted.slice(0, 3);
  const remaining = sorted.length - 3;
  const totalWeeklyCost = deadDecisions.reduce((s, z) => s + z.weeklyCost, 0);

  if (deadDecisions.length === 0) return null;

  const handleRevive = async () => {
    if (!reviveDialog || !user) return;
    setIsSubmitting(true);
    try {
      // 1. Add comment
      if (reviveComment.trim()) {
        await supabase.from("comments").insert({
          decision_id: reviveDialog.id,
          user_id: user.id,
          content: `🔄 **Wiederbelebt**: ${reviveComment}`,
          type: "comment",
        });
      }

      // 2. Set status to proposed (reopen)
      await supabase.from("decisions").update({
        status: "proposed",
        last_activity_at: new Date().toISOString(),
      }).eq("id", reviveDialog.id);

      // 3. Notify assignee/owner
      const notifyUserId = reviveDialog.assignee_id || reviveDialog.owner_id;
      if (notifyUserId && notifyUserId !== user.id) {
        await supabase.from("notifications").insert({
          user_id: notifyUserId,
          decision_id: reviveDialog.id,
          type: "reminder",
          title: "Entscheidung wiederbelebt",
          message: `"${reviveDialog.title}" wurde reaktiviert. ${reviveComment ? `Kommentar: ${reviveComment.substring(0, 100)}` : "Bitte prüfen."}`,
        });
      }

      toast.success("Entscheidung wiederbelebt und Beteiligte benachrichtigt");
      qc.invalidateQueries({ queryKey: ["decisions"] });
      setReviveDialog(null);
      setReviveComment("");
    } catch (e) {
      toast.error("Fehler beim Wiederbeleben");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (d: DeadDecision) => {
    try {
      await supabase.from("decisions").update({
        status: "archived",
        archived_at: new Date().toISOString(),
      }).eq("id", d.id);
      toast.success(`"${d.title}" archiviert`);
      qc.invalidateQueries({ queryKey: ["decisions"] });
    } catch {
      toast.error("Fehler beim Archivieren");
    }
  };

  const handleRemind = async (d: DeadDecision) => {
    if (!user) return;
    const notifyUserId = d.assignee_id || d.owner_id;
    if (!notifyUserId || notifyUserId === user.id) {
      toast.info("Du bist selbst zuständig — öffne die Entscheidung direkt");
      navigate(`/decisions/${d.id}`);
      return;
    }
    try {
      await supabase.from("notifications").insert({
        user_id: notifyUserId,
        decision_id: d.id,
        type: "reminder",
        title: "Erinnerung: Entscheidung wartet",
        message: `"${d.title}" hat seit ${d.daysInactive} Tagen keine Aktivität. Bitte aktualisiere den Status.`,
      });
      // Update last_activity to avoid immediate re-trigger
      await supabase.from("decisions").update({
        last_activity_at: new Date().toISOString(),
      }).eq("id", d.id);
      toast.success("Erinnerung gesendet");
    } catch {
      toast.error("Fehler beim Senden der Erinnerung");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-l-4 border-l-destructive bg-destructive/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-destructive" />
                <h3 className="text-sm font-semibold">
                  💀 Tote Entscheidungen: {deadDecisions.length}
                </h3>
              </div>
              {totalWeeklyCost > 0 && (
                <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                  {formatCost(totalWeeklyCost)}/Woche Verzögerungskosten
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Keine Aktivität seit mindestens 14 Tagen — kein Kommentar, kein Status-Update, kein Review.
            </p>

            <div className="space-y-2">
              {displayed.map(d => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg border border-destructive/10 bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/decisions/${d.id}`)}
                        className="text-sm font-medium hover:text-primary transition-colors truncate block text-left max-w-full"
                      >
                        {d.title}
                      </button>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>Letzte Aktivität vor <span className="font-semibold text-destructive">{d.daysInactive}</span> Tagen</span>
                        {d.costPerDay > 0 && (
                          <span className="text-destructive font-medium">CoD: {formatCost(d.costPerDay)}/Tag</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setReviveDialog(d); setReviveComment(""); }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Wiederbeleben
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleArchive(d)}
                      >
                        <Archive className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleRemind(d)}
                        title="Verantwortliche Person erinnern"
                      >
                        <Bell className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {remaining > 0 && (
              <button
                onClick={() => navigate("/decisions?filter=zombie")}
                className="text-xs text-primary hover:underline mt-3 block"
              >
                +{remaining} weitere tote Entscheidungen anzeigen
              </button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ REVIVE DIALOG ═══ */}
      <Dialog open={!!reviveDialog} onOpenChange={(open) => !open && setReviveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Entscheidung wiederbeleben
            </DialogTitle>
            <DialogDescription>
              „{reviveDialog?.title}" — seit {reviveDialog?.daysInactive} Tagen inaktiv.
              Gib ein kurzes Status-Update, um die Entscheidung zu reaktivieren.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={reviveComment}
            onChange={e => setReviveComment(e.target.value)}
            placeholder="Was ist der aktuelle Stand? Z.B. 'Warte auf Feedback von Marketing, eskaliere an Teamlead.'"
            rows={3}
            className="resize-none"
            autoFocus
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviveDialog(null)}>Abbrechen</Button>
            <Button onClick={handleRevive} disabled={isSubmitting} className="gap-1.5">
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "Wird reaktiviert..." : "Wiederbeleben & Benachrichtigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeadDecisionDetector;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useDecisions";
import { Share2, X, Users, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  decisionId: string;
  decisionTeamId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDecisionDialog = ({ decisionId, decisionTeamId, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { data: teams = [] } = useTeams();
  const [sharedTeamIds, setSharedTeamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchShares = async () => {
    const { data } = await supabase
      .from("decision_shares")
      .select("team_id")
      .eq("decision_id", decisionId);
    setSharedTeamIds(new Set((data || []).map(s => s.team_id)));
  };

  useEffect(() => {
    if (open) fetchShares();
  }, [open, decisionId]);

  // Exclude the decision's own team
  const availableTeams = teams.filter(t => t.id !== decisionTeamId);

  const toggleShare = async (teamId: string) => {
    if (!user) return;
    setLoading(true);
    if (sharedTeamIds.has(teamId)) {
      await supabase
        .from("decision_shares")
        .delete()
        .eq("decision_id", decisionId)
        .eq("team_id", teamId);
      sharedTeamIds.delete(teamId);
      setSharedTeamIds(new Set(sharedTeamIds));
      toast.success("Freigabe entfernt");
    } else {
      const { error } = await supabase.from("decision_shares").insert({
        decision_id: decisionId,
        team_id: teamId,
        shared_by: user.id,
      });
      if (error) {
        toast.error("Fehler beim Teilen");
      } else {
        sharedTeamIds.add(teamId);
        setSharedTeamIds(new Set(sharedTeamIds));
        toast.success("Entscheidung geteilt");
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Mit Teams teilen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {availableTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine weiteren Teams verfügbar.
            </p>
          ) : (
            availableTeams.map(team => {
              const isShared = sharedTeamIds.has(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleShare(team.id)}
                  disabled={loading}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isShared
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{team.name}</p>
                    {team.description && (
                      <p className="text-xs text-muted-foreground truncate">{team.description}</p>
                    )}
                  </div>
                  {isShared ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {sharedTeamIds.size > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Geteilt mit {sharedTeamIds.size} Team{sharedTeamIds.size > 1 ? "s" : ""}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDecisionDialog;

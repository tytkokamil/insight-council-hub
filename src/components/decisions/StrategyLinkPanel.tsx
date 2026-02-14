import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Target, Link2, Unlink, Loader2, Plus } from "lucide-react";

interface StrategyLinkPanelProps {
  decisionId: string;
}

interface Goal {
  id: string;
  title: string;
  goal_type: string;
  quarter: string | null;
  year: number | null;
  status: string;
}

interface LinkedGoal extends Goal {
  link_id: string;
  impact_weight: number;
}

const StrategyLinkPanel = ({ decisionId }: StrategyLinkPanelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [linkedGoals, setLinkedGoals] = useState<LinkedGoal[]>([]);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [impactWeight, setImpactWeight] = useState(50);

  const fetchData = async () => {
    const [goalsRes, linksRes] = await Promise.all([
      supabase.from("strategic_goals").select("id, title, goal_type, quarter, year, status"),
      supabase.from("decision_goal_links").select("*").eq("decision_id", decisionId),
    ]);

    const allGoals = goalsRes.data || [];
    const links = linksRes.data || [];
    const linkedIds = new Set(links.map(l => l.goal_id));

    const linked: LinkedGoal[] = links.map(l => {
      const goal = allGoals.find(g => g.id === l.goal_id);
      return {
        id: l.goal_id,
        link_id: l.id,
        title: goal?.title || "Unbekannt",
        goal_type: goal?.goal_type || "okr",
        quarter: goal?.quarter || null,
        year: goal?.year || null,
        status: goal?.status || "active",
        impact_weight: l.impact_weight || 50,
      };
    });

    setLinkedGoals(linked);
    setAvailableGoals(allGoals.filter(g => !linkedIds.has(g.id)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [decisionId]);

  const linkGoal = async () => {
    if (!selectedGoalId || !user) return;
    setLinking(true);
    const { error } = await supabase.from("decision_goal_links").insert({
      decision_id: decisionId,
      goal_id: selectedGoalId,
      impact_weight: impactWeight,
      linked_by: user.id,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ziel verknüpft" });
      setShowPicker(false);
      setSelectedGoalId("");
      setImpactWeight(50);
      fetchData();
    }
    setLinking(false);
  };

  const unlinkGoal = async (linkId: string) => {
    await supabase.from("decision_goal_links").delete().eq("id", linkId);
    toast({ title: "Verknüpfung entfernt" });
    fetchData();
  };

  const goalTypeLabel: Record<string, string> = {
    okr: "OKR", revenue: "Revenue", kpi: "KPI", quarterly: "Quartalsziel",
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-sm mt-4">Lade strategische Verknüpfungen...</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Strategische Verknüpfungen</h3>
        </div>
        {availableGoals.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowPicker(!showPicker)} className="gap-1 text-xs h-7">
            <Plus className="w-3 h-3" /> Verknüpfen
          </Button>
        )}
      </div>

      {/* Link picker */}
      {showPicker && (
        <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Strategisches Ziel</label>
            <select
              value={selectedGoalId}
              onChange={e => setSelectedGoalId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Ziel auswählen...</option>
              {availableGoals.map(g => (
                <option key={g.id} value={g.id}>
                  [{goalTypeLabel[g.goal_type] || g.goal_type}] {g.title} {g.quarter ? `(${g.quarter} ${g.year})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Impact-Gewichtung: {impactWeight}%</label>
            <input
              type="range" min={0} max={100} value={impactWeight}
              onChange={e => setImpactWeight(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Gering</span><span>Hoch</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowPicker(false)} className="text-xs h-7">Abbrechen</Button>
            <Button size="sm" onClick={linkGoal} disabled={!selectedGoalId || linking} className="gap-1 text-xs h-7">
              {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
              Verknüpfen
            </Button>
          </div>
        </div>
      )}

      {/* Linked goals list */}
      {linkedGoals.length > 0 ? (
        <div className="space-y-2">
          {linkedGoals.map(goal => (
            <div key={goal.link_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
              <Target className={`w-4 h-4 shrink-0 ${
                goal.goal_type === "revenue" ? "text-success" :
                goal.goal_type === "kpi" ? "text-warning" : "text-primary"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{goal.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium">{goalTypeLabel[goal.goal_type]}</span>
                  {goal.quarter && <span>{goal.quarter} {goal.year}</span>}
                  <span>Impact: {goal.impact_weight}%</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive h-7 w-7 p-0"
                onClick={() => unlinkGoal(goal.link_id)}
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Keine strategischen Ziele verknüpft.</p>
          <p className="text-[10px] mt-1">Erstelle Ziele unter „Strategie" und verknüpfe sie hier.</p>
        </div>
      )}
    </div>
  );
};

export default StrategyLinkPanel;

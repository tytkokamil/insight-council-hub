import { useState } from "react";
import { Database, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const DemoDataPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleLoadDemo = async () => {
    if (!user) return;
    setLoadingDemo(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data");
      if (error) throw error;
      toast.success(t("shared.demoSuccess"));
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(t("shared.demoError"), { description: e.message });
    }
    setLoadingDemo(false);
  };

  const handleReset = async () => {
    if (!user) return;
    setLoadingReset(true);
    try {
      // Delete user data in dependency order
      const uid = user.id;
      
      // Delete dependencies, reviews, comments, votes etc. linked to user's decisions
      const { data: userDecisions } = await supabase.from("decisions").select("id").eq("created_by", uid);
      const decIds = (userDecisions || []).map(d => d.id);
      
      if (decIds.length > 0) {
        await supabase.from("decision_dependencies").delete().or(`source_decision_id.in.(${decIds.join(",")}),target_decision_id.in.(${decIds.join(",")})`);
        await supabase.from("decision_reviews").delete().in("decision_id", decIds);
        await supabase.from("comments").delete().in("decision_id", decIds);
        await supabase.from("decision_votes").delete().in("decision_id", decIds);
        await supabase.from("decision_shares").delete().in("decision_id", decIds);
        await supabase.from("audit_logs").delete().in("decision_id", decIds);
        await supabase.from("decision_tags").delete().in("decision_id", decIds);
        await supabase.from("decision_versions").delete().in("decision_id", decIds);
        await supabase.from("stakeholder_positions").delete().in("decision_id", decIds);
        await supabase.from("decision_goal_links").delete().in("decision_id", decIds);
        await supabase.from("lessons_learned").delete().in("decision_id", decIds);
        await supabase.from("decision_scenarios").delete().in("decision_id", decIds);
        await supabase.from("risk_decision_links").delete().in("decision_id", decIds);
        await supabase.from("decision_watchlist").delete().in("decision_id", decIds);
      }

      // Delete tasks
      const { data: userTasks } = await supabase.from("tasks").select("id").eq("created_by", uid);
      const taskIds = (userTasks || []).map(t => t.id);
      if (taskIds.length > 0) {
        await supabase.from("risk_task_links").delete().in("task_id", taskIds);
        await supabase.from("decision_dependencies").delete().or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
      }
      await supabase.from("tasks").delete().eq("created_by", uid);
      
      // Delete decisions
      await supabase.from("decisions").delete().eq("created_by", uid);
      
      // Delete risks
      await supabase.from("risks").delete().eq("created_by", uid);
      
      // Delete teams (cascade via team_members)
      const { data: userTeams } = await supabase.from("teams").select("id").eq("created_by", uid);
      const teamIds = (userTeams || []).map(t => t.id);
      if (teamIds.length > 0) {
        await supabase.from("team_messages").delete().in("team_id", teamIds);
        await supabase.from("team_chat_reads").delete().in("team_id", teamIds);
        await supabase.from("team_invitations").delete().in("team_id", teamIds);
        await supabase.from("team_members").delete().in("team_id", teamIds);
        await supabase.from("automation_rules").delete().in("team_id", teamIds);
        await supabase.from("teams").delete().in("id", teamIds);
      }

      // Reset profile counter
      await supabase.from("profiles").update({ decision_count: 0 }).eq("user_id", uid);

      // Clear local progressive state
      localStorage.removeItem("intelligence-unlocked");
      localStorage.removeItem("onboarding-checklist-dismissed");

      toast.success(t("shared.resetSuccess"));
      qc.invalidateQueries();
      setConfirmReset(false);
    } catch (e: any) {
      toast.error(t("shared.resetError"), { description: e.message });
    }
    setLoadingReset(false);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-2">{t("shared.demoDataTitle")}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t("shared.demoDataDesc")}</p>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="gap-1.5"
        >
          {loadingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          {loadingDemo ? t("shared.demoLoading") : t("shared.loadDemoData")}
        </Button>

        {!confirmReset ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmReset(true)}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("shared.resetAllData")}
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-md border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{t("shared.resetConfirm")}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={loadingReset}
              className="gap-1.5 shrink-0"
            >
              {loadingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {loadingReset ? t("shared.resetLoading") : t("shared.resetAllData")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)} className="shrink-0">
              ✕
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DemoDataPanel;
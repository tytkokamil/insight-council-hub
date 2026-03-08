import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ScoreMethodology from "@/components/shared/ScoreMethodology";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WidgetSkeleton from "./WidgetSkeleton";
import { useTranslation } from "react-i18next";

const EscalationWidget = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*, decisions(title, priority)")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (notifs) setNotifications(notifs);

      let overdueQuery = supabase
        .from("decisions")
        .select("id, title, priority, due_date, escalation_level")
        .in("status", ["draft", "review", "approved"])
        .is("deleted_at", null)
        .not("due_date", "is", null)
        .lt("due_date", new Date().toISOString().split("T")[0]);

      if (selectedTeamId) {
        overdueQuery = overdueQuery.eq("team_id", selectedTeamId);
      } else {
        // Personal mode: show all decisions the user owns/created/is assigned to (across all teams)
        overdueQuery = overdueQuery
          .or(`created_by.eq.${user.id},assignee_id.eq.${user.id},owner_id.eq.${user.id}`);
      }

      const { data: overdueDecisions } = await overdueQuery
        .order("due_date", { ascending: true })
        .limit(5);
      if (overdueDecisions) setOverdue(overdueDecisions);
      setLoading(false);
    };
    fetchData();
  }, [user, selectedTeamId]);

  const dismissNotification = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const escalationColor = (level: number) => {
    if (level >= 3) return "border-destructive/30 bg-destructive/5";
    if (level >= 2) return "border-warning/30 bg-warning/5";
    return "border-primary/30 bg-primary/5";
  };

  if (loading) return <WidgetSkeleton rows={4} showScore={false} />;
  if (notifications.length === 0 && overdue.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-success" />
            </div>
            <CardTitle className="text-sm">{t("escalationWidget.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {t("escalationWidget.none", { defaultValue: "Keine Eskalationen oder überfälligen Entscheidungen." })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm">{t("escalationWidget.title")}</CardTitle>
              <ScoreMethodology
                title={t("escalationWidget.title")}
                description={t("escalationWidget.methodologyDesc")}
                items={[
                  { label: t("escalationWidget.overdue"), formula: t("escalationWidget.overdueFormula") },
                  { label: t("escalationWidget.levelLabel"), formula: t("escalationWidget.levelFormula") },
                  { label: t("escalationWidget.autoLabel"), formula: t("escalationWidget.autoFormula") },
                ]}
              />
            </div>
          </div>
          {notifications.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {notifications.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 && (
          <div className="space-y-2 mb-4">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => dismissNotification(n.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {overdue.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {t("escalationWidget.overdueDecisions")}
            </p>
            {overdue.map(d => (
              <div key={d.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${escalationColor(d.escalation_level)}`}>
                <span className="font-medium truncate">{d.title}</span>
                <span className="text-muted-foreground shrink-0 ml-2">{d.due_date}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EscalationWidget;

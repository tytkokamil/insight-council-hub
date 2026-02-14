import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const EscalationWidget = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch unread notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*, decisions(title, priority)")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (notifs) setNotifications(notifs);

      // Fetch overdue decisions
      const { data: overdueDecisions } = await supabase
        .from("decisions")
        .select("id, title, priority, due_date, escalation_level")
        .in("status", ["draft", "review", "approved"])
        .not("due_date", "is", null)
        .lt("due_date", new Date().toISOString().split("T")[0])
        .order("due_date", { ascending: true })
        .limit(5);
      if (overdueDecisions) setOverdue(overdueDecisions);
    };
    fetchData();
  }, [user]);

  const dismissNotification = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const escalationColor = (level: number) => {
    if (level >= 3) return "border-destructive/50 bg-destructive/5";
    if (level >= 2) return "border-warning/50 bg-warning/5";
    return "border-primary/50 bg-primary/5";
  };

  if (notifications.length === 0 && overdue.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Bell className="w-4 h-4 text-destructive" />
        </div>
        <h3 className="text-sm font-semibold">Eskalationen & Deadlines</h3>
        {notifications.length > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
            {notifications.length}
          </span>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="space-y-2 mb-3">
          {notifications.map(n => (
            <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => dismissNotification(n.id)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <Clock className="w-3 h-3" /> Überfällige Entscheidungen
          </p>
          {overdue.map(d => (
            <div key={d.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${escalationColor(d.escalation_level)}`}>
              <span className="font-medium truncate">{d.title}</span>
              <span className="text-muted-foreground shrink-0 ml-2">{d.due_date}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EscalationWidget;

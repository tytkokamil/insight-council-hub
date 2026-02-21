import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight } from "lucide-react";
import { eventLabels } from "@/lib/eventTaxonomy";

const AuditTrailPanel = ({ decisionId }: { decisionId: string }) => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*, profiles!audit_logs_user_id_fkey(full_name)")
        .eq("decision_id", decisionId)
        .order("created_at", { ascending: false });
      if (data) setLogs(data);
    };
    fetch();
  }, [decisionId]);

  return (
    <div className="space-y-2 mt-4 max-h-72 overflow-y-auto">
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Noch keine Änderungen protokolliert.</p>
      ) : logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{log.profiles?.full_name || "System"}</span>
              <span className="text-xs text-primary">{eventLabels[log.action] || log.action}</span>
              {log.field_name && (
                <span className="text-xs text-muted-foreground">({log.field_name})</span>
              )}
            </div>
            {(log.old_value || log.new_value) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                {log.old_value && <span className="line-through">{log.old_value}</span>}
                {log.old_value && log.new_value && <ArrowRight className="w-3 h-3" />}
                {log.new_value && <span className="text-foreground">{log.new_value}</span>}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleDateString("de-DE", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTrailPanel;

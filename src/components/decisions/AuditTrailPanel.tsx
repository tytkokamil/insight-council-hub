import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight, MessageSquare } from "lucide-react";
import { eventLabels } from "@/lib/eventTaxonomy";
import { useTranslation } from "react-i18next";

const AuditTrailPanel = ({ decisionId }: { decisionId: string }) => {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [logsRes, commentsRes] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("*, profiles!audit_logs_user_id_fkey(full_name)")
          .eq("decision_id", decisionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("comments")
          .select("*, profiles!comments_user_id_fkey(full_name)")
          .eq("decision_id", decisionId)
          .order("created_at", { ascending: false }),
      ]);
      if (logsRes.data) setLogs(logsRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
    };
    fetchAll();
  }, [decisionId]);

  const locale = i18n.language === "de" ? "de-DE" : "en-US";

  // Merge logs and comments into a single timeline
  const timeline = useMemo(() => {
    const items: Array<{ id: string; type: "log" | "comment"; created_at: string; data: any }> = [];
    logs.forEach(log => items.push({ id: log.id, type: "log", created_at: log.created_at, data: log }));
    comments.forEach(c => items.push({ id: c.id, type: "comment", created_at: c.created_at, data: c }));
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [logs, comments]);

  return (
    <div className="space-y-2 mt-4 max-h-72 overflow-y-auto">
      {timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("auditTrail.noChanges")}</p>
      ) : timeline.map((item) => {
        if (item.type === "comment") {
          const c = item.data;
          return (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{c.profiles?.full_name || t("auditTrail.system")}</span>
                  <span className="text-xs text-primary">{t("auditTrail.commented")}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString(locale, {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
          );
        }

        const log = item.data;
        return (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{log.profiles?.full_name || t("auditTrail.system")}</span>
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
                {new Date(log.created_at).toLocaleDateString(locale, {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditTrailPanel;

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone, Loader2, X, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

interface Session {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_active_at: string;
  is_current: boolean;
  created_at: string;
}

const parseUserAgent = (ua: string | null): string => {
  if (!ua) return "Unbekanntes Gerät";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Browser";
};

const ActiveSessionsPanel = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("active_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("revoked", false)
      .order("last_active_at", { ascending: false });
    setSessions(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Register / update current session
  useEffect(() => {
    if (!user) return;
    const ua = navigator.userAgent;
    const upsertSession = async () => {
      // Mark this as current session using a simple fingerprint
      const sessionKey = `session_${user.id}`;
      let sessionId = localStorage.getItem(sessionKey);

      if (sessionId) {
        await supabase
          .from("active_sessions")
          .update({ last_active_at: new Date().toISOString(), user_agent: ua })
          .eq("id", sessionId);
      } else {
        const { data } = await supabase
          .from("active_sessions")
          .insert({
            user_id: user.id,
            user_agent: ua,
            device_info: parseUserAgent(ua),
            is_current: true,
          })
          .select("id")
          .single();
        if (data) localStorage.setItem(sessionKey, data.id);
      }
    };
    upsertSession();
  }, [user]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    await supabase.from("active_sessions").update({ revoked: true }).eq("id", sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({ title: t("settings.sessionRevoked") });
    setRevoking(null);
  };

  const locale = i18n.language === "de" ? de : enUS;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MonitorSmartphone className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">{t("settings.activeSessions")}</h3>
        <Badge variant="outline" className="text-[10px]">{sessions.length}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.activeSessionsDesc")}</p>

      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">{t("settings.noSessions")}</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                session.is_current ? "border-primary/30 bg-primary/5" : "border-border/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {session.device_info || parseUserAgent(session.user_agent)}
                    </p>
                    {session.is_current ? (
                      <Badge className="text-[9px] bg-success/10 text-success border-success/20">
                        {t("settings.currentSession", "Diese Sitzung")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        {t("settings.otherSession", "Andere Sitzung")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.lastActive")}: {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true, locale })}
                  </p>
                </div>
              </div>
              {!session.is_current && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive shrink-0 gap-1 text-xs"
                  disabled={revoking === session.id}
                  onClick={() => revokeSession(session.id)}
                >
                  {revoking === session.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  {t("settings.revoke", "Widerrufen")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveSessionsPanel;

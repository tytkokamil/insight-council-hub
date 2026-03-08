import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertTriangle, Info, ExternalLink, Video, Send } from "lucide-react";
import { toast } from "sonner";

const TeamsIntegrationPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [notifyNew, setNotifyNew] = useState(true);
  const [notifySla, setNotifySla] = useState(true);
  const [notifyEscalation, setNotifyEscalation] = useState(true);
  const [notifyReview, setNotifyReview] = useState(true);
  const [dailyBriefEnabled, setDailyBriefEnabled] = useState(false);
  const [dailyBriefTime, setDailyBriefTime] = useState("07:30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!user) return;
    loadConfig();
  }, [user]);

  const loadConfig = async () => {
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user!.id)
      .single();

    if (profile?.org_id) {
      const { data: config } = await supabase
        .from("teams_integration_config")
        .select("*")
        .eq("org_id", profile.org_id)
        .single();

      if (config) {
        setConfigId(config.id);
        setWebhookUrl(config.webhook_url || "");
        setChannelName(config.channel_name || "");
        setEnabled(config.enabled);
        setNotifyNew(config.notify_new_decision);
        setNotifySla(config.notify_sla_violation);
        setNotifyEscalation(config.notify_escalation);
        setNotifyReview(config.notify_review_request);
        setDailyBriefEnabled((config as any).daily_brief_enabled ?? false);
        setDailyBriefTime((config as any).daily_brief_time ?? "07:30");
      }
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!user) return;
    if (!webhookUrl.trim()) {
      toast.error(t("settings.teamsWebhookRequired"));
      return;
    }
    setSaving(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.org_id) {
      const payload = {
        webhook_url: webhookUrl.trim(),
        channel_name: channelName.trim() || null,
        enabled,
        notify_new_decision: notifyNew,
        notify_sla_violation: notifySla,
        notify_escalation: notifyEscalation,
        notify_review_request: notifyReview,
        daily_brief_enabled: dailyBriefEnabled,
        daily_brief_time: dailyBriefTime,
        updated_at: new Date().toISOString(),
      };

      if (configId) {
        await supabase.from("teams_integration_config").update(payload).eq("id", configId);
      } else {
        const { data } = await supabase
          .from("teams_integration_config")
          .insert({ ...payload, org_id: profile.org_id })
          .select("id")
          .single();
        if (data) setConfigId(data.id);
      }
      toast.success(t("settings.teamsSaved"));
    }
    setSaving(false);
  };

  const testWebhook = async () => {
    if (!webhookUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          attachments: [{
            contentType: "application/vnd.microsoft.card.adaptive",
            contentUrl: null,
            content: {
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              type: "AdaptiveCard",
              version: "1.4",
              body: [
                { type: "TextBlock", text: "✅ Decivio Testbenachrichtigung", weight: "Bolder", size: "Medium" },
                { type: "TextBlock", text: "Die Microsoft Teams Integration funktioniert! Approve/Reject-Buttons und Daily Briefs sind aktiv.", wrap: true },
              ],
            },
          }],
        }),
      });
      setTestResult(res.ok ? "success" : "error");
      if (res.ok) {
        toast.success(t("settings.teamsTestSuccess"));
      } else {
        toast.error(t("settings.teamsTestFailed"));
      }
    } catch {
      setTestResult("error");
      toast.error(t("settings.teamsTestFailed"));
    }
    setTesting(false);
  };

  if (loading) return null;

  const TeamsIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.625 6.375H14.25v4.5h5.25a1.125 1.125 0 001.125-1.125V7.5a1.125 1.125 0 00-1.125-1.125z" fill="currentColor" opacity="0.6"/>
      <path d="M14.25 6.375H3.375A1.125 1.125 0 002.25 7.5v9a1.125 1.125 0 001.125 1.125H14.25V6.375z" fill="currentColor"/>
      <circle cx="18" cy="4.5" r="2.25" fill="currentColor" opacity="0.6"/>
      <circle cx="9" cy="4.5" r="3" fill="currentColor"/>
      <path d="M19.5 12v4.5a2.25 2.25 0 01-2.25 2.25H14.25v-6.75H19.5z" fill="currentColor" opacity="0.4"/>
    </svg>
  );

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <TeamsIcon />
        <h2 className="text-sm font-medium">{t("settings.teamsTitle")}</h2>
        <Badge variant="outline" className="text-[10px]">v2</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("settings.teamsDesc")}</p>

      <div className="space-y-4">
        {/* Webhook URL */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("settings.teamsWebhookUrl")}
          </label>
          <Input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://outlook.office.com/webhook/..."
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            {t("settings.teamsWebhookHint")}
          </p>
        </div>

        {/* Channel Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("settings.teamsChannel")}
          </label>
          <Input
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={t("settings.teamsChannelPlaceholder")}
          />
        </div>

        {/* Test Button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={testWebhook}
            disabled={testing || !webhookUrl.trim()}
            className="gap-1.5"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {t("settings.teamsTestButton")}
          </Button>
          {testResult === "success" && (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {t("settings.teamsTestOk")}
            </span>
          )}
          {testResult === "error" && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {t("settings.teamsTestFail")}
            </span>
          )}
        </div>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{t("settings.teamsEnabled")}</p>
            <p className="text-[10px] text-muted-foreground">{t("settings.teamsEnabledDesc")}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Notification types */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            {t("settings.teamsNotifyTitle")}
          </label>
          <div className="space-y-2">
            {[
              { key: "new", label: t("settings.teamsNotifyNew"), checked: notifyNew, set: setNotifyNew },
              { key: "review", label: t("settings.teamsNotifyReview"), checked: notifyReview, set: setNotifyReview, badge: "2-Wege" },
              { key: "sla", label: t("settings.teamsNotifySla"), checked: notifySla, set: setNotifySla },
              { key: "escalation", label: t("settings.teamsNotifyEscalation"), checked: notifyEscalation, set: setNotifyEscalation },
            ].map(({ key, label, checked, set, badge }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-xs flex items-center gap-1.5">
                  {label}
                  {badge && <Badge variant="secondary" className="text-[9px] px-1 py-0">{badge}</Badge>}
                </span>
                <Switch checked={checked} onCheckedChange={set} />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Brief in Teams */}
        <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Daily Brief in Teams</span>
              <Badge variant="outline" className="text-[9px]">Neu</Badge>
            </div>
            <Switch checked={dailyBriefEnabled} onCheckedChange={setDailyBriefEnabled} />
          </div>
          {dailyBriefEnabled && (
            <div className="mt-2">
              <label className="text-[10px] text-muted-foreground mb-1 block">Sendezeit</label>
              <Input
                type="time"
                value={dailyBriefTime}
                onChange={(e) => setDailyBriefTime(e.target.value)}
                className="w-32 text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tägliche Zusammenfassung mit Top-3-Entscheidungen und Cost-of-Delay als Adaptive Card.
              </p>
            </div>
          )}
        </div>

        {/* V2 Features info */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">2-Wege-Integration aktiv</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Approve/Reject direkt aus Teams Adaptive Cards</li>
                <li>Kommentare bei Ablehnung direkt eingeben</li>
                <li>Daily Brief als Teams-Nachricht</li>
                <li>Teams Meeting Link im Decision Room</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save */}
        <Button onClick={saveConfig} disabled={saving || !webhookUrl.trim()} className="w-full gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("settings.teamsSave")}
        </Button>
      </div>
    </section>
  );
};

export default TeamsIntegrationPanel;

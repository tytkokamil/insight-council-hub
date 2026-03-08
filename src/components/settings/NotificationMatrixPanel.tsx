import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Shield, Minus } from "lucide-react";
import { toast } from "sonner";

// ── Event definitions ──────────────────────────────────
const EVENTS = [
  { key: "reviewer_assigned", critical: true },
  { key: "approval", critical: true },
  { key: "rejection", critical: true },
  { key: "sla_violation", critical: true },
  { key: "sla_early_warning", critical: true },
  { key: "escalation", critical: true },
  { key: "deadline_3d", critical: false },
  { key: "deadline_1d", critical: true },
  { key: "reviewer_overdue", critical: true },
  { key: "mention", critical: false },
  { key: "war_room", critical: true },
  { key: "ai_daily_brief", critical: false },
  { key: "weekly_report", critical: false },
  { key: "new_members", critical: false },
] as const;

type EventKey = (typeof EVENTS)[number]["key"];
type Frequency = "instant" | "daily" | "weekly" | "never";

interface ChannelConfig {
  in_app: boolean;
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  frequency: Frequency;
}

type NotificationMatrix = Record<EventKey, ChannelConfig>;

// ── Presets ─────────────────────────────────────────────
const makePreset = (mode: "all" | "critical" | "minimal"): NotificationMatrix => {
  const matrix = {} as NotificationMatrix;
  EVENTS.forEach(evt => {
    if (mode === "all") {
      matrix[evt.key] = { in_app: true, email: true, push: true, whatsapp: false, frequency: "instant" };
    } else if (mode === "critical") {
      matrix[evt.key] = evt.critical
        ? { in_app: true, email: true, push: false, whatsapp: false, frequency: "instant" }
        : { in_app: true, email: false, push: false, whatsapp: false, frequency: "daily" };
    } else {
      // minimal
      matrix[evt.key] = evt.critical
        ? { in_app: true, email: false, push: false, whatsapp: false, frequency: "instant" }
        : { in_app: false, email: false, push: false, whatsapp: false, frequency: "never" };
    }
  });
  return matrix;
};

const DEFAULT_MATRIX = makePreset("critical");

const CHANNELS = ["in_app", "email", "push", "whatsapp"] as const;
const FREQUENCIES: { value: Frequency; labelKey: string }[] = [
  { value: "instant", labelKey: "notifMatrix.instant" },
  { value: "daily", labelKey: "notifMatrix.daily" },
  { value: "weekly", labelKey: "notifMatrix.weekly" },
  { value: "never", labelKey: "notifMatrix.never" },
];

const NotificationMatrixPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [matrix, setMatrix] = useState<NotificationMatrix>(DEFAULT_MATRIX);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("notification_matrix")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.notification_matrix && typeof data.notification_matrix === "object" && Object.keys(data.notification_matrix as object).length > 0) {
          // Merge with defaults so new events get default values
          setMatrix({ ...DEFAULT_MATRIX, ...(data.notification_matrix as unknown as NotificationMatrix) });
        }
      });
  }, [user]);

  const persist = useCallback(async (updated: NotificationMatrix) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, notification_matrix: updated as any }, { onConflict: "user_id" });
    setSaving(false);
  }, [user]);

  const toggleChannel = (event: EventKey, channel: typeof CHANNELS[number]) => {
    const updated = { ...matrix, [event]: { ...matrix[event], [channel]: !matrix[event][channel] } };
    setMatrix(updated);
    persist(updated);
  };

  const setFrequency = (event: EventKey, freq: Frequency) => {
    const updated = { ...matrix, [event]: { ...matrix[event], frequency: freq } };
    setMatrix(updated);
    persist(updated);
  };

  const applyPreset = (mode: "all" | "critical" | "minimal") => {
    const preset = makePreset(mode);
    setMatrix(preset);
    persist(preset);
    toast.success(t(`notifMatrix.preset_${mode}_applied`));
  };

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium mr-1">{t("notifMatrix.presets")}:</span>
        <Button size="sm" onClick={() => applyPreset("all")} className="gap-1 h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
          <Bell className="w-3 h-3" /> {t("notifMatrix.presetAll")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset("critical")} className="gap-1 h-7 text-xs">
          <Shield className="w-3 h-3" /> {t("notifMatrix.presetCritical")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => applyPreset("minimal")} className="gap-1 h-7 text-xs">
          <BellOff className="w-3 h-3" /> {t("notifMatrix.presetMinimal")}
        </Button>
        {saving && <Badge variant="outline" className="text-[9px] ml-auto animate-pulse">{t("notifMatrix.saving")}</Badge>}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2.5 font-medium text-muted-foreground min-w-[160px]">{t("notifMatrix.event")}</th>
              <th className="text-center p-2.5 font-medium text-muted-foreground w-16">In-App</th>
              <th className="text-center p-2.5 font-medium text-muted-foreground w-16">E-Mail</th>
              <th className="text-center p-2.5 font-medium text-muted-foreground w-16">Push</th>
              <th className="text-center p-2.5 font-medium text-muted-foreground w-20">WhatsApp</th>
              <th className="text-center p-2.5 font-medium text-muted-foreground min-w-[120px]">{t("notifMatrix.when")}</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((evt, i) => (
              <tr key={evt.key} className={`border-t border-border/60 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{t(`notifMatrix.evt_${evt.key}`)}</span>
                    {evt.critical && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1 border-destructive/30 text-destructive">
                        {t("notifMatrix.critical")}
                      </Badge>
                    )}
                  </div>
                </td>
                {CHANNELS.map(ch => (
                  <td key={ch} className="text-center p-2.5">
                    <Switch
                      checked={matrix[evt.key]?.[ch] ?? false}
                      onCheckedChange={() => toggleChannel(evt.key, ch)}
                      className="mx-auto scale-75"
                    />
                  </td>
                ))}
                <td className="text-center p-2.5">
                  <Select
                    value={matrix[evt.key]?.frequency ?? "instant"}
                    onValueChange={(v) => setFrequency(evt.key, v as Frequency)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[100px] mx-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value} className="text-xs">
                          {t(f.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">{t("notifMatrix.pushNote")}</p>

      {/* Re-engagement Email Opt-out */}
      <ReengagementOptOutToggle userId={user?.id} />
    </div>
  );
};

// ── Re-engagement toggle (extracted sub-component) ─────
const ReengagementOptOutToggle = ({ userId }: { userId?: string }) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("email_reengagement_opt_out")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setEnabled(!data.email_reengagement_opt_out);
        setLoaded(true);
      });
  }, [userId]);

  const toggle = async (checked: boolean) => {
    setEnabled(checked);
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ email_reengagement_opt_out: !checked })
      .eq("user_id", userId);
    toast.success(checked ? t("notifMatrix.reengagementEnabled") : t("notifMatrix.reengagementDisabled"));
  };

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 mt-2">
      <div>
        <p className="text-sm font-medium">{t("notifMatrix.reengagementLabel")}</p>
        <p className="text-[11px] text-muted-foreground">{t("notifMatrix.reengagementDesc")}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} />
    </div>
  );
};

export default NotificationMatrixPanel;

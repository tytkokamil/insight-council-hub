import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const reviewFlowLabels: Record<string, string> = {
  fast_track: "Fast Track", standard: "Standard", strategic: "Strategic",
};

interface Props {
  teamId: string;
}

const TeamDefaultsConfig = ({ teamId }: Props) => {
  const { t } = useTranslation();
  const [defaults, setDefaults] = useState({
    default_category: "operational",
    default_priority: "medium",
    default_review_flow: "standard",
    default_sla_days: 7,
  });
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("team_defaults")
        .select("*")
        .eq("team_id", teamId)
        .single();
      if (data) {
        setDefaults({
          default_category: data.default_category,
          default_priority: data.default_priority,
          default_review_flow: data.default_review_flow,
          default_sla_days: data.default_sla_days,
        });
        setExists(true);
      }
    };
    if (teamId) fetch();
  }, [teamId]);

  const handleSave = async () => {
    setSaving(true);
    if (exists) {
      await supabase.from("team_defaults").update(defaults).eq("team_id", teamId);
    } else {
      await supabase.from("team_defaults").insert({ team_id: teamId, ...defaults });
      setExists(true);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const categoryKeys = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
  const priorityKeys = ["low", "medium", "high", "critical"];

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("team.defaultsDesc")}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("team.defaultCategory")}</label>
          <select value={defaults.default_category} onChange={e => setDefaults(d => ({ ...d, default_category: e.target.value }))} className={inputClass}>
            {categoryKeys.map(k => (
              <option key={k} value={k}>{t(`category.${k}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("team.defaultPriority")}</label>
          <select value={defaults.default_priority} onChange={e => setDefaults(d => ({ ...d, default_priority: e.target.value }))} className={inputClass}>
            {priorityKeys.map(p => (
              <option key={p} value={p}>{t(`priority.${p}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("team.defaultReviewFlow")}</label>
          <select value={defaults.default_review_flow} onChange={e => setDefaults(d => ({ ...d, default_review_flow: e.target.value }))} className={inputClass}>
            {Object.entries(reviewFlowLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("team.defaultSla")}</label>
          <input type="number" min={1} max={90} value={defaults.default_sla_days} onChange={e => setDefaults(d => ({ ...d, default_sla_days: parseInt(e.target.value) || 7 }))} className={inputClass} />
        </div>
      </div>

      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
        {saved && <CheckCircle2 className="w-3 h-3" />}
        {saving ? t("team.saving") : saved ? t("team.saved") : t("team.save")}
      </Button>
    </div>
  );
};

export default TeamDefaultsConfig;

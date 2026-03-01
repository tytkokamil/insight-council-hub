import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, Save, Plus } from "lucide-react";
import { useTranslatedLabels } from "@/lib/labels";

interface SlaConfig {
  id: string;
  category: string;
  priority: string;
  escalation_hours_warn: number;
  escalation_hours_urgent: number;
  escalation_hours_overdue: number;
  reassign_days: number;
}

const priorityOrder = ["critical", "high", "medium", "low"];

const SlaConfigPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const tl = useTranslatedLabels(t);
  const [configs, setConfigs] = useState<SlaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("strategic");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("sla_configs")
        .select("*")
        .order("category")
        .order("priority");
      if (data) setConfigs(data as SlaConfig[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateField = (id: string, field: keyof SlaConfig, value: number) => {
    setConfigs(prev =>
      prev.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;

    for (const config of configs) {
      const { error } = await supabase
        .from("sla_configs")
        .update({
          escalation_hours_warn: config.escalation_hours_warn,
          escalation_hours_urgent: config.escalation_hours_urgent,
          escalation_hours_overdue: config.escalation_hours_overdue,
          reassign_days: config.reassign_days,
        })
        .eq("id", config.id);
      if (error) hasError = true;
    }

    setSaving(false);
    if (hasError) {
      toast({ title: t("slaConfig.error"), description: t("slaConfig.errorDesc"), variant: "destructive" });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: t("slaConfig.saved"), description: t("slaConfig.savedDesc") });
    }
  };

  const categoryConfigs = configs
    .filter(c => c.category === activeCategory)
    .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  const inputClass = "w-full h-9 px-2 rounded-lg bg-background border border-input text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all";

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">{t("slaConfig.loading")}</div>;
  }

  if (configs.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium text-muted-foreground">{t("slaConfig.emptyTitle", "Noch keine SLA-Regeln konfiguriert")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("slaConfig.emptyDesc")}</p>
        <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs">
          <Plus className="w-3 h-3" /> {t("slaConfig.createFirst", "Erste SLA-Regel erstellen")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(tl.categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Config table */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="grid grid-cols-5 gap-0 bg-muted/50 text-xs font-medium text-muted-foreground">
          <div className="p-2.5">{t("slaConfig.priority")}</div>
          <div className="p-2.5 text-center">{t("slaConfig.warnHours")}</div>
          <div className="p-2.5 text-center">{t("slaConfig.urgentHours")}</div>
          <div className="p-2.5 text-center">{t("slaConfig.overdueHours")}</div>
          <div className="p-2.5 text-center">{t("slaConfig.reassignDays")}</div>
        </div>
        {categoryConfigs.map(config => (
          <div key={config.id} className="grid grid-cols-5 gap-0 border-t border-border/60 items-center">
            <div className="p-2.5">
              <span className="text-sm font-medium">{tl.priorityLabels[config.priority] || config.priority}</span>
            </div>
            <div className="p-1.5">
              <input
                type="number"
                min={0}
                value={config.escalation_hours_warn}
                onChange={e => updateField(config.id, "escalation_hours_warn", parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div className="p-1.5">
              <input
                type="number"
                min={0}
                value={config.escalation_hours_urgent}
                onChange={e => updateField(config.id, "escalation_hours_urgent", parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div className="p-1.5">
              <input
                type="number"
                min={0}
                value={config.escalation_hours_overdue}
                onChange={e => updateField(config.id, "escalation_hours_overdue", parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
            <div className="p-1.5">
              <input
                type="number"
                min={1}
                value={config.reassign_days}
                onChange={e => updateField(config.id, "reassign_days", parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("slaConfig.helpText") }} />

      <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
        {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? t("slaConfig.saving") : saved ? t("slaConfig.savedBtn") : t("slaConfig.saveBtn")}
      </Button>
    </div>
  );
};

export default SlaConfigPanel;

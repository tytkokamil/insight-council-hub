import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, Save } from "lucide-react";

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch",
  budget: "Budget",
  hr: "Personal",
  technical: "Technisch",
  operational: "Operativ",
  marketing: "Marketing",
};

const priorityLabels: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
};

const priorityOrder = ["critical", "high", "medium", "low"];

interface SlaConfig {
  id: string;
  category: string;
  priority: string;
  escalation_hours_warn: number;
  escalation_hours_urgent: number;
  escalation_hours_overdue: number;
  reassign_days: number;
}

const SlaConfigPanel = () => {
  const { toast } = useToast();
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
      toast({ title: "Fehler", description: "Einige SLA-Konfigurationen konnten nicht gespeichert werden.", variant: "destructive" });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "Gespeichert", description: "SLA-Konfigurationen aktualisiert." });
    }
  };

  const categoryConfigs = configs
    .filter(c => c.category === activeCategory)
    .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  const inputClass = "w-full h-9 px-2 rounded-lg bg-background border border-input text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all";

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">SLA-Konfigurationen laden...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(categoryLabels).map(([key, label]) => (
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
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-5 gap-0 bg-muted/50 text-xs font-medium text-muted-foreground">
          <div className="p-2.5">Priorität</div>
          <div className="p-2.5 text-center">⚠️ Warnung (h)</div>
          <div className="p-2.5 text-center">🔴 Dringend (h)</div>
          <div className="p-2.5 text-center">🚨 Überfällig (h)</div>
          <div className="p-2.5 text-center">🔄 Reassign (Tage)</div>
        </div>
        {categoryConfigs.map(config => (
          <div key={config.id} className="grid grid-cols-5 gap-0 border-t border-border items-center">
            <div className="p-2.5">
              <span className="text-sm font-medium">{priorityLabels[config.priority]}</span>
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

      <p className="text-xs text-muted-foreground">
        <strong>Warnung:</strong> Stunden vor Deadline für erste Warnung. <strong>Dringend:</strong> Stufe 2. <strong>Überfällig:</strong> Stufe 3 (0 = bei Deadline). <strong>Reassign:</strong> Tage Inaktivität bis zur automatischen Neuzuweisung.
      </p>

      <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
        {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Speichern..." : saved ? "Gespeichert" : "SLA speichern"}
      </Button>
    </div>
  );
};

export default SlaConfigPanel;

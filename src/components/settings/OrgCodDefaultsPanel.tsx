import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";

const COD_KEYS = ["cod_hourly_rate", "cod_persons", "cod_overhead_factor"] as const;

const OrgCodDefaultsPanel = () => {
  const { t } = useTranslation();
  const [values, setValues] = useState({ cod_hourly_rate: 85, cod_persons: 3, cod_overhead_factor: 1.5 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("economic_config")
        .select("config_key, config_value")
        .in("config_key", [...COD_KEYS]);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(d => { map[d.config_key] = Number(d.config_value); });
        setValues({
          cod_hourly_rate: map.cod_hourly_rate ?? 85,
          cod_persons: map.cod_persons ?? 3,
          cod_overhead_factor: map.cod_overhead_factor ?? 1.5,
        });
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const key of COD_KEYS) {
      await supabase
        .from("economic_config")
        .update({ config_value: values[key] })
        .eq("config_key", key);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exampleDays = 10;
  const exampleCost = exampleDays * values.cod_hourly_rate * 8 * values.cod_persons * values.cod_overhead_factor;

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("cod.hourlyRate", "Ø Stundensatz (€/h)")}
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={values.cod_hourly_rate}
            onChange={e => setValues(v => ({ ...v, cod_hourly_rate: parseInt(e.target.value) || 85 }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("cod.persons", "Beteiligte Personen")}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={values.cod_persons}
            onChange={e => setValues(v => ({ ...v, cod_persons: parseInt(e.target.value) || 3 }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("cod.overhead", "Overhead-Faktor")}
          </label>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={values.cod_overhead_factor}
            onChange={e => setValues(v => ({ ...v, cod_overhead_factor: parseFloat(e.target.value) || 1.5 }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="p-3 rounded-lg border border-accent-blue/20 bg-accent-blue/[0.06]">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent-blue" />
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-accent-blue">
              {t("cod.example", "Beispiel")}:
            </p>
            <p>
              {values.cod_hourly_rate}€ × 8h × {values.cod_persons} × {values.cod_overhead_factor}x = <span className="font-semibold text-foreground">{formatCurrency(values.cod_hourly_rate * 8 * values.cod_persons * values.cod_overhead_factor)}</span> {t("cod.perDay", "pro Tag")}
            </p>
            <p className="text-muted-foreground/70">
              {t("cod.orgDefaultDesc", "Diese Werte gelten als Fallback für alle Teams ohne eigene Konfiguration.")}
            </p>
          </div>
        </div>
      </div>

      <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
        {saved && <CheckCircle2 className="w-3 h-3" />}
        {saving ? t("team.saving") : saved ? t("team.saved") : t("team.save")}
      </Button>
    </div>
  );
};

export default OrgCodDefaultsPanel;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  teamId: string;
}

const CodConfigPanel = ({ teamId }: Props) => {
  const { t } = useTranslation();
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [persons, setPersons] = useState<number>(3);
  const [overhead, setOverhead] = useState<number>(1.5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("teams")
        .select("hourly_rate, cod_persons, cod_overhead_factor")
        .eq("id", teamId)
        .single();
      if (data) {
        setHourlyRate(data.hourly_rate ?? 75);
        setPersons(data.cod_persons ?? 3);
        setOverhead(Number(data.cod_overhead_factor) ?? 1.5);
      }
    };
    if (teamId) fetch();
  }, [teamId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("teams")
      .update({ hourly_rate: hourlyRate, cod_persons: persons, cod_overhead_factor: overhead })
      .eq("id", teamId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Preview calculation
  const exampleDays = 10;
  const exampleCost = exampleDays * hourlyRate * 8 * persons * overhead;

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
            value={hourlyRate}
            onChange={e => setHourlyRate(parseInt(e.target.value) || 75)}
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
            value={persons}
            onChange={e => setPersons(parseInt(e.target.value) || 3)}
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
            value={overhead}
            onChange={e => setOverhead(parseFloat(e.target.value) || 1.5)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">
              {t("cod.formula", "Formel")}: {t("cod.formulaDetail", "Verzögerungstage × Stundensatz × 8h × Personen × Overhead")}
            </p>
            <p>
              {t("cod.example", "Beispiel")}: {exampleDays} {t("cod.days", "Tage")} × {hourlyRate}€ × 8h × {persons} × {overhead}x = <span className="font-semibold text-foreground">{formatCurrency(exampleCost)}</span>
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

export default CodConfigPanel;

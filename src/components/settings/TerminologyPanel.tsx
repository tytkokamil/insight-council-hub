import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTerminology, DEFAULT_TERMS, TermKey } from "@/hooks/useTerminology";
import { Languages, RotateCcw, Save, CheckCircle2, Loader2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SUGGESTIONS: Record<TermKey, string[]> = {
  decision: ["Freigabeantrag", "Änderungsantrag", "Votum", "Decision Record"],
  reviewer: ["Qualified Person", "Prüfer", "Genehmiger"],
  approved: ["Freigegeben", "Akzeptiert"],
  rejected: ["Zurückgewiesen", "Nicht freigegeben"],
  open: ["In Bearbeitung", "Ausstehend"],
  team: ["Abteilung", "Projekt"],
};

const TerminologyPanel = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { customTerms, refresh } = useTerminology();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadOrg = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
      setOrgId(data?.org_id || null);
    };
    loadOrg();
  }, [user]);

  // Init form values from context
  useEffect(() => {
    const init: Record<string, string> = {};
    DEFAULT_TERMS.forEach(d => {
      init[d.key] = customTerms[d.key] || "";
    });
    setValues(init);
  }, [customTerms]);

  const handleSave = async () => {
    if (!orgId || !user) return;
    setSaving(true);
    try {
      // Delete all existing, then insert non-empty ones
      await supabase.from("terminology").delete().eq("org_id", orgId);

      const inserts = Object.entries(values)
        .filter(([, v]) => v.trim())
        .map(([key, val]) => ({
          org_id: orgId,
          default_term: key,
          custom_term: val.trim(),
        }));

      if (inserts.length > 0) {
        const { error } = await supabase.from("terminology").insert(inserts);
        if (error) throw error;
      }

      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!orgId) return;
    setSaving(true);
    await supabase.from("terminology").delete().eq("org_id", orgId);
    setValues(Object.fromEntries(DEFAULT_TERMS.map(d => [d.key, ""])));
    await refresh();
    setSaving(false);
    toast.success(t("terminology.resetDone"));
  };

  const isEn = i18n.language?.startsWith("en");
  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <section>
      <h2 className="text-sm font-medium mb-1 flex items-center gap-2">
        <Languages className="w-4 h-4" />
        {t("terminology.title")}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">{t("terminology.description")}</p>

      <div className="space-y-4">
        {DEFAULT_TERMS.map(def => {
          const defaultLabel = isEn ? def.en : def.de;
          const currentValue = values[def.key] || "";
          const previewValue = currentValue || defaultLabel;

          return (
            <div key={def.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {t(`terminology.labels.${def.key}`)} <span className="text-muted-foreground/50">({defaultLabel})</span>
                </label>
                {currentValue && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                    <Eye className="w-3 h-3" />
                    {previewValue}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={currentValue}
                onChange={e => setValues(prev => ({ ...prev, [def.key]: e.target.value }))}
                placeholder={defaultLabel}
                className={inputClass}
              />
              <div className="flex flex-wrap gap-1">
                {SUGGESTIONS[def.key]?.map(s => (
                  <button
                    key={s}
                    onClick={() => setValues(prev => ({ ...prev, [def.key]: s }))}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-5">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saved ? t("settings.saved") : t("settings.save")}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset} disabled={saving} className="gap-1.5">
          <RotateCcw className="w-3 h-3" />
          {t("terminology.reset")}
        </Button>
      </div>
    </section>
  );
};

export default TerminologyPanel;

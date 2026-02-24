import { useState } from "react";
import { Database, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const DemoDataPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleLoadDemo = async () => {
    if (!user) return;
    setLoadingDemo(true);
    try {
      const res = await supabase.functions.invoke("seed-demo-data");
      console.log("[DemoData] seed response:", JSON.stringify(res));
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(t("shared.demoSuccess"));
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(t("shared.demoError"), { description: e.message });
    }
    setLoadingDemo(false);
  };

  const handleReset = async () => {
    if (!user) return;
    setLoadingReset(true);
    try {
      const res = await supabase.functions.invoke("reset-user-data");
      console.log("[DemoData] reset response:", JSON.stringify(res));
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      // Clear local progressive state
      localStorage.removeItem("intelligence-unlocked");
      localStorage.removeItem("onboarding-checklist-dismissed");

      toast.success(t("shared.resetSuccess"));
      qc.invalidateQueries();
      setConfirmReset(false);
    } catch (e: any) {
      toast.error(t("shared.resetError"), { description: e.message });
    }
    setLoadingReset(false);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-2">{t("shared.demoDataTitle")}</h2>
      <p className="text-xs text-muted-foreground mb-4">{t("shared.demoDataDesc")}</p>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="gap-1.5"
        >
          {loadingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          {loadingDemo ? t("shared.demoLoading") : t("shared.loadDemoData")}
        </Button>

        {!confirmReset ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmReset(true)}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("shared.resetAllData")}
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-md border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{t("shared.resetConfirm")}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReset}
              disabled={loadingReset}
              className="gap-1.5 shrink-0"
            >
              {loadingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {loadingReset ? t("shared.resetLoading") : t("shared.resetAllData")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)} className="shrink-0">
              ✕
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DemoDataPanel;

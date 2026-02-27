import { motion } from "framer-motion";
import { BarChart3, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface DecisionEmptyStateProps {
  onNewDecision: () => void;
}

const DecisionEmptyState = ({ onNewDecision }: DecisionEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-semibold tracking-tight mb-3">{t("decisions.noDecisions")}</h3>
        <p className="text-sm text-muted-foreground mb-8">{t("decisions.noDecisionsDesc")}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="lg" onClick={async () => {
            toast.info(t("decisions.demoCreating"));
            const { data, error } = await supabase.functions.invoke("seed-demo-data");
            if (error || data?.error) { toast.error(data?.error || t("settings.error")); return; }
            toast.success(t("decisions.demoCreated")); window.location.reload();
          }} className="gap-2"><Zap className="w-4 h-4" /> {t("decisions.loadDemo")}</Button>
          <Button size="lg" onClick={onNewDecision} className="gap-2"><Plus className="w-4 h-4" /> {t("decisions.createFirst")}</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default DecisionEmptyState;

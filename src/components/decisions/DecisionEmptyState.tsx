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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary/15 to-accent-violet/15 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold mb-2">{t("decisions.noDecisions")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("decisions.noDecisionsDesc")}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={async () => {
            toast.info(t("decisions.demoCreating"));
            const { data, error } = await supabase.functions.invoke("seed-demo-data");
            if (error || data?.error) { toast.error(data?.error || t("settings.error")); return; }
            toast.success(t("decisions.demoCreated")); window.location.reload();
          }} className="gap-2"><Zap className="w-4 h-4" /> {t("decisions.loadDemo")}</Button>
          <Button onClick={onNewDecision} className="gap-2"><Plus className="w-4 h-4" /> {t("decisions.createFirst")}</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DecisionEmptyState;

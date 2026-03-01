import { FileText, Zap, Brain, GitBranch, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";

interface DecisionEmptyStateProps {
  onNewDecision: () => void;
}

const DecisionEmptyState = ({ onNewDecision }: DecisionEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <EmptyAnalysisState
      icon={FileText}
      title={t("decisions.emptyTitle", { defaultValue: "Ihre erste Entscheidung wartet" })}
      description={t("decisions.emptyDesc", { defaultValue: "Teams die Entscheidungen dokumentieren lösen sie 40% schneller. Legen Sie jetzt los." })}
      ctaLabel={t("decisions.createFirst", { defaultValue: "Erste Entscheidung erstellen →" })}
      onCtaClick={onNewDecision}
      features={[
        { icon: Brain, label: t("decisions.featureAi", { defaultValue: "KI-Analyse" }), desc: t("decisions.featureAiDesc", { defaultValue: "Automatische Risiko- und Impact-Bewertung" }) },
        { icon: GitBranch, label: t("decisions.featureDeps", { defaultValue: "Abhängigkeiten" }), desc: t("decisions.featureDepsDesc", { defaultValue: "Entscheidungen verknüpfen und Auswirkungen verfolgen" }) },
        { icon: Target, label: t("decisions.featureTracking", { defaultValue: "Outcome-Tracking" }), desc: t("decisions.featureTrackingDesc", { defaultValue: "Ergebnisse messen und Lessons Learned ableiten" }) },
      ]}
      quickActions={[
        {
          label: t("decisions.loadDemo", { defaultValue: "Demo-Daten laden" }),
          icon: Zap,
          onClick: async () => {
            toast.info(t("decisions.demoCreating"));
            const { data, error } = await supabase.functions.invoke("seed-demo-data");
            if (error || data?.error) { toast.error(data?.error || t("settings.error")); return; }
            toast.success(t("decisions.demoCreated")); window.location.reload();
          },
        },
      ]}
    />
  );
};

export default DecisionEmptyState;

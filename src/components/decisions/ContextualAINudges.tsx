import { useMemo } from "react";
import { AlertTriangle, Users, TrendingUp, Lightbulb, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Props {
  category: string;
  priority: string;
  title: string;
  description: string;
  hasStakeholders: boolean;
  riskScore?: number;
  similarDecisions?: any[];
}

interface Nudge {
  id: string;
  icon: typeof AlertTriangle;
  message: string;
  type: "warning" | "tip" | "insight";
}

const typeStyles = {
  warning: "border-destructive/20 bg-destructive/5 text-destructive",
  tip: "border-primary/20 bg-primary/5 text-primary",
  insight: "border-accent-teal/20 bg-accent-teal/5 text-accent-teal",
};

const ContextualAINudges = ({
  category, priority, title, description, hasStakeholders, riskScore, similarDecisions = [],
}: Props) => {
  const { t } = useTranslation();

  const nudges = useMemo(() => {
    const result: Nudge[] = [];

    if ((priority === "critical" || priority === "high") && !hasStakeholders) {
      result.push({
        id: "missing-stakeholders",
        icon: Users,
        message: priority === "critical" ? t("nudges.missingStakeholdersCritical") : t("nudges.missingStakeholdersHigh"),
        type: "warning",
      });
    }

    if (category === "strategic" && (!description || description.length < 20)) {
      result.push({ id: "missing-context", icon: Lightbulb, message: t("nudges.missingContext"), type: "tip" });
    }

    if (riskScore && riskScore > 60) {
      result.push({ id: "high-risk", icon: Shield, message: t("nudges.highRisk", { score: riskScore }), type: "warning" });
    }

    const failedSimilar = similarDecisions.filter(d => d.status === "rejected");
    if (failedSimilar.length > 0) {
      result.push({ id: "similar-failed", icon: AlertTriangle, message: t("nudges.similarFailed", { count: failedSimilar.length }), type: "warning" });
    }

    const successSimilar = similarDecisions.filter(d => d.status === "implemented");
    if (successSimilar.length >= 2 && failedSimilar.length === 0) {
      result.push({ id: "similar-success", icon: TrendingUp, message: t("nudges.similarSuccess", { count: successSimilar.length }), type: "insight" });
    }

    if (category === "budget" && priority !== "low") {
      result.push({ id: "budget-timeline", icon: Lightbulb, message: t("nudges.budgetTimeline"), type: "tip" });
    }

    return result.slice(0, 3);
  }, [category, priority, title, description, hasStakeholders, riskScore, similarDecisions, t]);

  if (nudges.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {nudges.map((nudge, i) => (
          <motion.div
            key={nudge.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${typeStyles[nudge.type]}`}
          >
            <nudge.icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{nudge.message}</p>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default ContextualAINudges;

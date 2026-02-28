import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, Eye, LayoutTemplate, CheckCircle2,
  ArrowRight, X, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface ChecklistStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  checkFn: () => boolean;
}

interface OnboardingChecklistProps {
  hasTeam: boolean;
  hasDecision: boolean;
  hasReview: boolean;
  hasTemplate: boolean;
}

const OnboardingChecklist = ({ hasTeam, hasDecision, hasReview, hasTemplate }: OnboardingChecklistProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("onboarding-checklist-dismissed") === "true"
  );
  const [expanded, setExpanded] = useState(() => {
    // Auto-collapse if user already has some progress
    return !(hasTeam && hasDecision);
  });

  const steps: ChecklistStep[] = useMemo(() => [
    {
      id: "team",
      icon: Users,
      title: t("widgets.createTeam"),
      description: t("widgets.createTeamDesc"),
      actionLabel: t("widgets.createTeam"),
      actionPath: "/teams",
      checkFn: () => hasTeam,
    },
    {
      id: "decision",
      icon: FileText,
      title: t("widgets.firstDecision"),
      description: t("widgets.firstDecisionDesc"),
      actionLabel: t("widgets.firstDecision"),
      actionPath: "/decisions",
      checkFn: () => hasDecision,
    },
    {
      id: "review",
      icon: Eye,
      title: t("widgets.startReviewProcess"),
      description: t("widgets.startReviewProcessDesc"),
      actionLabel: t("widgets.startReview"),
      actionPath: "/decisions",
      checkFn: () => hasReview,
    },
    {
      id: "template",
      icon: LayoutTemplate,
      title: t("widgets.exploreTemplates"),
      description: t("widgets.exploreTemplatesDesc"),
      actionLabel: t("widgets.viewTemplates"),
      actionPath: "/templates",
      checkFn: () => hasTemplate,
    },
  ], [hasTeam, hasDecision, hasReview, hasTemplate, t]);

  const completedCount = steps.filter(s => s.checkFn()).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  useEffect(() => {
    if (allComplete && !dismissed) {
      // Show celebration toast
      import("sonner").then(({ toast }) => {
        toast.success(t("widgets.allDoneCelebration"), {
          icon: "🎉",
          duration: 4000,
        });
      });
      const timer = setTimeout(() => setDismissed(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, dismissed, t]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("onboarding-checklist-dismissed", "true");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-primary/20 bg-primary/[0.02] rounded-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{t("widgets.firstSteps")}</h3>
            <p className="text-xs text-muted-foreground">
              {allComplete ? t("widgets.allDone") : t("widgets.completedOf", { completed: completedCount, total: steps.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24">
            <Progress value={progress} className="h-1.5" />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t("widgets.hideChecklist")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-1.5">
              {steps.map((step, i) => {
                const done = step.checkFn();
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      done
                        ? "bg-success/[0.04] border border-success/10"
                        : "bg-muted/30 border border-transparent hover:border-border"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      done ? "bg-success/10" : "bg-muted"
                    }`}>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    {!done && (
                      <Button
                        variant={step.id === "decision" ? "default" : "ghost"}
                        size="sm"
                        className={step.id === "decision"
                          ? "shrink-0 text-xs gap-1"
                          : "shrink-0 text-xs text-primary hover:text-primary gap-1"
                        }
                        onClick={() => navigate(step.actionPath)}
                      >
                        {step.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default OnboardingChecklist;

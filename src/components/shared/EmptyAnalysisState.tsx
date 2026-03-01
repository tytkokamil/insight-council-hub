import { motion } from "framer-motion";
import { LucideIcon, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface FeatureHint {
  icon: LucideIcon;
  label: string;
  desc: string;
}

interface QuickAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface EmptyAnalysisStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaRoute?: string;
  onCtaClick?: () => void;
  hint?: string;
  motivation?: string;
  features?: FeatureHint[];
  quickActions?: QuickAction[];
  accentClass?: string;
  /** Show a progress bar (e.g. "3 of 10 decisions") */
  progress?: { current: number; target: number; label: string };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const EmptyAnalysisState = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaRoute = "/decisions",
  onCtaClick,
  hint,
  motivation,
  features,
  quickActions,
  accentClass,
  progress,
}: EmptyAnalysisStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resolvedCtaLabel = ctaLabel || t("emptyState.defaultCta");

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex items-center justify-center min-h-[50vh] py-12"
    >
      <div className="text-center max-w-[400px] mx-auto px-4">
        {/* Icon */}
        <motion.div variants={item} className="mb-4 flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h3 variants={item} className="font-display text-base font-bold mb-1.5">
          {title}
        </motion.h3>

        {/* Description */}
        <motion.p variants={item} className="text-[13px] text-muted-foreground leading-relaxed mb-5">
          {description}
        </motion.p>

        {/* Motivation stat */}
        {motivation && (
          <motion.div
            variants={item}
            className="inline-flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-muted/40 border border-border/30 mb-5 text-left max-w-full"
          >
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[12px] text-muted-foreground leading-relaxed">{motivation}</p>
          </motion.div>
        )}

        {/* Progress bar */}
        {progress && (
          <motion.div variants={item} className="mb-5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>{progress.label}</span>
              <span className="font-medium tabular-nums">{progress.current}/{progress.target}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* CTA Buttons */}
        {(ctaLabel || onCtaClick) && (
          <motion.div variants={item} className="flex flex-col items-center gap-2.5">
            <Button
              size="default"
              onClick={onCtaClick || (() => navigate(ctaRoute!))}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {resolvedCtaLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            {quickActions && quickActions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{t("common.or", { defaultValue: "oder" })}</span>
                {quickActions.map((a, i) => (
                  <Button key={i} variant="ghost" size="sm" onClick={a.onClick} className="gap-1.5 text-muted-foreground">
                    {a.icon && <a.icon className="w-3.5 h-3.5" />}
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Hint */}
        {hint && (
          <motion.p variants={item} className="text-[11px] text-muted-foreground/60 mt-4 flex items-center justify-center gap-1">
            <ArrowRight className="w-3 h-3" />
            {hint}
          </motion.p>
        )}

        {/* Feature cards */}
        {features && features.length > 0 && (
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="text-left p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center mb-2">
                  <f.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-[12px] font-semibold leading-tight">{f.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyAnalysisState;

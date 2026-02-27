import { motion } from "framer-motion";
import { LucideIcon, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  /** Optional accent color override — defaults to primary */
  accentClass?: string;
}

const dotPattern = (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" aria-hidden>
    <pattern id="empty-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
    <rect width="100%" height="100%" fill="url(#empty-dots)" />
  </svg>
);

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
}: EmptyAnalysisStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resolvedCtaLabel = ctaLabel || t("emptyState.defaultCta");
  const accent = accentClass || "primary";

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="relative overflow-hidden">
        {dotPattern}
        <CardContent className="p-12 text-center relative">
          {/* Decorative glow behind icon */}
          <div className="relative mx-auto mb-5 w-16 h-16">
            <div className={`absolute inset-0 rounded-2xl bg-${accent}/10 blur-xl scale-150 opacity-40`} />
            <motion.div
              variants={item}
              className={`relative w-16 h-16 rounded-2xl bg-${accent}/10 border border-${accent}/20 flex items-center justify-center`}
            >
              <Icon className={`w-8 h-8 text-${accent} opacity-70`} />
            </motion.div>
          </div>

          <motion.h3 variants={item} className="font-display text-xl font-semibold mb-2">
            {title}
          </motion.h3>
          <motion.p variants={item} className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            {description}
          </motion.p>

          {motivation && (
            <motion.div
              variants={item}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-${accent}/[0.04] border border-${accent}/10 mb-6 max-w-md mx-auto`}
            >
              <TrendingUp className={`w-4 h-4 text-${accent} shrink-0`} />
              <p className="text-xs text-foreground/80 text-left leading-relaxed">{motivation}</p>
            </motion.div>
          )}

          <motion.div variants={item} className={motivation ? "" : "mt-2"}>
            <Button size="lg" onClick={onCtaClick || (() => navigate(ctaRoute!))} className="gap-2">
              <Plus className="w-4 h-4" />
              {resolvedCtaLabel}
            </Button>
          </motion.div>

          {hint && (
            <motion.p variants={item} className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {hint}
            </motion.p>
          )}

          {features && features.length > 0 && (
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-xl mx-auto">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="h-full"
                >
                  <Card className="text-left h-full">
                    <div className="p-4 flex flex-col h-full">
                      <div className={`w-9 h-9 rounded-xl bg-${accent}/10 flex items-center justify-center mb-3 shrink-0`}>
                        <f.icon className={`w-4 h-4 text-${accent}`} />
                      </div>
                      <p className="text-sm font-semibold leading-tight">{f.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {quickActions && quickActions.length > 0 && (
            <motion.div variants={item} className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {quickActions.map((a, i) => (
                <Button key={i} variant="outline" size="sm" onClick={a.onClick} className="gap-1.5 text-xs">
                  {a.icon && <a.icon className="w-3.5 h-3.5" />}
                  {a.label}
                </Button>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyAnalysisState;

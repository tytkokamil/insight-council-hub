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
}

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
}: EmptyAnalysisStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resolvedCtaLabel = ctaLabel || t("emptyState.defaultCta");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
            <Icon className="w-8 h-8 text-primary opacity-60" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">{description}</p>

          {motivation && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/[0.04] border border-primary/10 mb-6 max-w-md mx-auto">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-foreground/80 text-left leading-relaxed">{motivation}</p>
            </motion.div>
          )}

          <div className={motivation ? "" : "mt-2"}>
            <Button onClick={onCtaClick || (() => navigate(ctaRoute!))} className="gap-2">
              <Plus className="w-4 h-4" />
              {resolvedCtaLabel}
            </Button>
          </div>

          {hint && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {hint}
            </p>
          )}

          {features && features.length > 0 && (
            <div className={`grid grid-cols-${Math.min(features.length, 3)} gap-3 mt-8 max-w-lg mx-auto`}>
              {features.map((f, i) => (
                <Card key={i} className="text-left">
                  <div className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {quickActions && quickActions.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {quickActions.map((a, i) => (
                <Button key={i} variant="outline" size="sm" onClick={a.onClick} className="gap-1.5 text-xs">
                  {a.icon && <a.icon className="w-3.5 h-3.5" />}
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyAnalysisState;
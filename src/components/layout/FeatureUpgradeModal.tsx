import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Crown, Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FEATURE_CONFIG } from "@/hooks/useFeatureAccess";

const PLAN_DISPLAY: Record<string, string> = {
  starter: "Starter",
  pro: "Professional",
  enterprise: "Enterprise",
};

const PLAN_PRICE: Record<string, string> = {
  starter: "€59",
  pro: "€149",
  enterprise: "ab €499",
};

interface FeatureUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey: string;
  featureLabel: string;
  minPlan: string;
}

const FeatureUpgradeModal = ({ open, onOpenChange, featureKey, featureLabel, minPlan }: FeatureUpgradeModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const config = FEATURE_CONFIG[featureKey];
  const title = config?.label || featureLabel;
  const description = config?.description || `${featureLabel} ist in deinem aktuellen Plan nicht enthalten.`;
  const bullets = config?.bullets;

  const planName = PLAN_DISPLAY[minPlan] || "Professional";
  const planPrice = PLAN_PRICE[minPlan] || "€149";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                {t("upgrade.requiredPlan", { plan: planName, defaultValue: `Ab ${planName}` })}
              </span>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Bullet points if available */}
        {bullets && (
          <ul className="space-y-2 py-2">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/#pricing");
            }}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t("upgrade.ctaWithPlan", {
              plan: planName,
              price: planPrice,
              defaultValue: `Auf ${planName} upgraden — ${planPrice}/Monat`,
            })}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              navigate("/#pricing");
            }}
            className="w-full text-xs text-primary hover:text-primary/80"
          >
            {t("upgrade.trial", { defaultValue: "Oder 14 Tage kostenlos testen" })}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>

          {featureKey === "compliance" && (
            <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
              Oder: Zusätzliches Framework für €19/Monat hinzubuchen
            </p>
          )}

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground text-xs"
          >
            {t("upgrade.later", { defaultValue: "Später" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureUpgradeModal;

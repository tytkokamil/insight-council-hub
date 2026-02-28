import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/** Feature descriptions for the upgrade modal */
const FEATURE_INFO: Record<string, { titleKey: string; descKey: string }> = {
  executive:    { titleKey: "upgrade.executiveTitle",    descKey: "upgrade.executiveDesc" },
  analytics:    { titleKey: "upgrade.analyticsTitle",    descKey: "upgrade.analyticsDesc" },
  bottlenecks:  { titleKey: "upgrade.bottlenecksTitle",  descKey: "upgrade.bottlenecksDesc" },
  audit:        { titleKey: "upgrade.auditTitle",        descKey: "upgrade.auditDesc" },
  engine:       { titleKey: "upgrade.engineTitle",       descKey: "upgrade.engineDesc" },
  calendar:     { titleKey: "upgrade.calendarTitle",     descKey: "upgrade.calendarDesc" },
  risks:        { titleKey: "upgrade.risksTitle",        descKey: "upgrade.risksDesc" },
  teams:        { titleKey: "upgrade.teamsTitle",        descKey: "upgrade.teamsDesc" },
  dashboard:    { titleKey: "upgrade.dashboardTitle",    descKey: "upgrade.dashboardDesc" },
  decisions:    { titleKey: "upgrade.decisionsTitle",    descKey: "upgrade.decisionsDesc" },
  tasks:        { titleKey: "upgrade.tasksTitle",        descKey: "upgrade.tasksDesc" },
};

const PLAN_DISPLAY: Record<string, string> = {
  starter: "Starter",
  pro: "Professional",
  business: "Business",
  enterprise: "Enterprise",
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

  const info = FEATURE_INFO[featureKey];
  const title = info ? t(info.titleKey, { defaultValue: featureLabel }) : featureLabel;
  const description = info
    ? t(info.descKey, { defaultValue: t("upgrade.genericDesc", { feature: featureLabel }) })
    : t("upgrade.genericDesc", { feature: featureLabel, defaultValue: `${featureLabel} ist in deinem aktuellen Plan nicht enthalten.` });

  const planName = PLAN_DISPLAY[minPlan] || "Professional";

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

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/#pricing");
            }}
            className="w-full gap-2"
          >
            {t("upgrade.cta", { defaultValue: "Jetzt upgraden" })}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            {t("upgrade.later", { defaultValue: "Später" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureUpgradeModal;

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getPlans } from "./pricing/PricingData";
import PricingCard from "./pricing/PricingCard";
import PricingTrust from "./pricing/PricingTrust";
import PricingValue from "./pricing/PricingValue";
import PricingFAQ from "./pricing/PricingFAQ";
import PricingCTA from "./pricing/PricingCTA";
import PricingROICalculator from "./pricing/PricingROICalculator";
import PricingAddons from "./pricing/PricingAddons";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingSection = () => {
  const { t } = useTranslation();
  const [annual, setAnnual] = useState(false);
  const plans = getPlans(t);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-violet/[0.04] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-teal/[0.02] rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.2em] uppercase"
          >
            {t("landing.pricing.label")}
          </motion.p>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-5 leading-[1.15]">
            {t("landing.pricing.title")}{" "}
            <span className="gradient-text">{t("landing.pricing.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {t("landing.pricing.subtitle")}
            <br className="hidden sm:block" />
            {t("landing.pricing.subtitleLine2")}
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <span
            className={`text-sm font-medium transition-colors duration-300 ${
              !annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t("landing.pricing.monthly")}
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-all duration-400 ${
              annual
                ? "bg-primary shadow-[0_0_12px_-2px_hsl(var(--primary)/0.4)]"
                : "bg-muted hover:bg-muted-foreground/20"
            }`}
            aria-label={t("landing.pricing.switchBilling")}
          >
            <motion.div
              className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ x: annual ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors duration-300 ${
              annual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t("landing.pricing.annually")}
          </span>
          {annual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="ml-1 px-3 py-1 rounded-full text-[10px] font-bold bg-accent-teal/10 text-accent-teal border border-accent-teal/20 shadow-[0_0_12px_-4px_hsl(var(--accent-teal)/0.3)]"
            >
              {t("landing.pricing.annualBadge")}
            </motion.span>
          )}
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} annual={annual} index={i} />
          ))}
        </div>

        {/* Divider */}
        <div className="my-20 flex items-center gap-4 max-w-2xl mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">Add-ons</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <PricingAddons />
        <PricingTrust />

        {/* Divider */}
        <div className="my-20 flex items-center gap-4 max-w-2xl mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">ROI</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <PricingROICalculator />
        <PricingValue />
        <PricingFAQ />
        <PricingCTA />
      </div>
    </section>
  );
};

export default PricingSection;

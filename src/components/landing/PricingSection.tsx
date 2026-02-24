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
    <section id="pricing" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">{t("landing.pricing.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
            {t("landing.pricing.title")}{" "}
            <span className="gradient-text">{t("landing.pricing.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("landing.pricing.subtitle")}
            <br className="hidden sm:block" />
            {t("landing.pricing.subtitleLine2")}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.5, ease }} className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>{t("landing.pricing.monthly")}</span>
          <button onClick={() => setAnnual(!annual)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${annual ? "bg-primary" : "bg-muted"}`} aria-label={t("landing.pricing.switchBilling")}>
            <motion.div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm" animate={{ x: annual ? 24 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>{t("landing.pricing.annually")}</span>
          {annual && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-teal/10 text-accent-teal border border-accent-teal/20">
              {t("landing.pricing.annualBadge")}
            </motion.span>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto items-start">
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} annual={annual} index={i} />
          ))}
        </div>

        <PricingAddons />
        <PricingTrust />
        <PricingROICalculator />
        <PricingValue />
        <PricingFAQ />
        <PricingCTA />
      </div>
    </section>
  );
};

export default PricingSection;

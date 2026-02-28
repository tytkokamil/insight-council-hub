import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getValueStats } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingValue = () => {
  const { t } = useTranslation();
  const valueStats = getValueStats(t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15, duration: 0.7, ease }}
      className="mt-20 max-w-4xl mx-auto text-center"
    >
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
        {t("landing.pricing.valueTitle")}{" "}
        <span className="gradient-text">{t("landing.pricing.valueHighlight")}</span>
      </h3>
      <p className="text-muted-foreground text-sm mb-10 max-w-xl mx-auto">
        {t("landing.pricing.valueSubtitle")}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {valueStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i, duration: 0.5, ease }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 hover:border-primary/20 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.1)] transition-all duration-300"
          >
            <p className="text-3xl font-bold gradient-text mb-2">{stat.metric}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/50 mt-6 italic">
        {t("landing.pricing.valueFootnote")}
      </p>
    </motion.div>
  );
};

export default PricingValue;

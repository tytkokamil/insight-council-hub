import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingAddons = () => {
  const { t } = useTranslation();

  const addons = [
    { name: t("landing.pricing.addonUsers"), price: t("landing.pricing.addonUsersPrice"), desc: t("landing.pricing.addonUsersDesc"), from: "Starter+" },
    { name: t("landing.pricing.addonAi"), price: t("landing.pricing.addonAiPrice"), desc: t("landing.pricing.addonAiDesc"), from: "Starter+" },
    { name: t("landing.pricing.addonAudit"), price: t("landing.pricing.addonAuditPrice"), desc: t("landing.pricing.addonAuditDesc"), from: "Starter+" },
    { name: t("landing.pricing.addonRoom"), price: t("landing.pricing.addonRoomPrice"), desc: t("landing.pricing.addonRoomDesc"), from: "Starter+" },
    { name: t("landing.pricing.addonBench"), price: t("landing.pricing.addonBenchPrice"), desc: t("landing.pricing.addonBenchDesc"), from: "Professional+" },
    { name: t("landing.pricing.addonBrand"), price: t("landing.pricing.addonBrandPrice"), desc: t("landing.pricing.addonBrandDesc"), from: "Professional+" },
    { name: t("landing.pricing.addonApi"), price: t("landing.pricing.addonApiPrice"), desc: t("landing.pricing.addonApiDesc"), from: "Professional+" },
    { name: t("landing.pricing.addonOnboard"), price: t("landing.pricing.addonOnboardPrice"), desc: t("landing.pricing.addonOnboardDesc"), from: t("landing.pricing.annually") === "Annually" ? "All Plans" : "Alle Pläne" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
      className="max-w-4xl mx-auto"
    >
      <h3 className="text-xl font-bold text-center mb-2">{t("landing.pricing.addonsTitle")}</h3>
      <p className="text-sm text-muted-foreground text-center mb-8">
        {t("landing.pricing.addonsSubtitle")}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {addons.map((addon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.4, ease }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm hover:border-foreground/15 hover:shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.08)] transition-all duration-300"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{addon.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted/60 text-muted-foreground border border-border/30">
                  {addon.from}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70">{addon.desc}</p>
            </div>
            <span className="text-sm font-bold text-primary whitespace-nowrap">{addon.price}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PricingAddons;

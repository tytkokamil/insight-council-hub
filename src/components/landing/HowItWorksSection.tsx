import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    { number: "01", title: t("landing.howItWorks.step1Title"), description: t("landing.howItWorks.step1Desc") },
    { number: "02", title: t("landing.howItWorks.step2Title"), description: t("landing.howItWorks.step2Desc") },
    { number: "03", title: t("landing.howItWorks.step3Title"), description: t("landing.howItWorks.step3Desc") },
    { number: "04", title: t("landing.howItWorks.step4Title"), description: t("landing.howItWorks.step4Desc") },
  ];

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-muted/20" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-xl mx-auto mb-16">
          <p className="text-[11px] font-medium text-muted-foreground mb-4 tracking-[0.2em] uppercase">{t("landing.howItWorks.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("landing.howItWorks.title")}</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px max-w-4xl mx-auto bg-border/40 rounded-2xl overflow-hidden border border-border/40">
          {steps.map((step, i) => (
            <motion.div key={step.number} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.5, ease }} className="bg-card p-7 flex flex-col">
              <span className="text-4xl font-bold text-foreground/[0.06] mb-4 font-display">{step.number}</span>
              <h3 className="text-[15px] font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

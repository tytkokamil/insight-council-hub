import { motion } from "framer-motion";
import { Zap, Shield, Brain, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const BenefitsSection = () => {
  const { t } = useTranslation();

  const benefits = [
    { icon: Zap, title: t("landing.benefits.speedTitle"), stat: t("landing.benefits.speedStat"), statLabel: t("landing.benefits.speedStatLabel"), description: t("landing.benefits.speedDesc") },
    { icon: Shield, title: t("landing.benefits.controlTitle"), stat: t("landing.benefits.controlStat"), statLabel: t("landing.benefits.controlStatLabel"), description: t("landing.benefits.controlDesc") },
    { icon: Brain, title: t("landing.benefits.aiTitle"), stat: t("landing.benefits.aiStat"), statLabel: t("landing.benefits.aiStatLabel"), description: t("landing.benefits.aiDesc") },
    { icon: BarChart3, title: t("landing.benefits.transparencyTitle"), stat: t("landing.benefits.transparencyStat"), statLabel: t("landing.benefits.transparencyStatLabel"), description: t("landing.benefits.transparencyDesc") },
  ];

  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-xl mx-auto mb-16">
          <p className="text-[11px] font-medium text-muted-foreground mb-4 tracking-[0.2em] uppercase">{t("landing.benefits.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("landing.benefits.title")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {benefits.map((benefit, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.08, duration: 0.6, ease }} className="group relative p-7 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/[0.06] transition-colors">
                  <benefit.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold mb-1">{benefit.title}</h3>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-bold text-primary font-display">{benefit.stat}</span>
                    <span className="text-xs text-muted-foreground">{benefit.statLabel}</span>
                  </div>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;

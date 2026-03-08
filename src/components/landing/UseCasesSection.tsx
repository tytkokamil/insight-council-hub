import { motion } from "framer-motion";
import { Landmark, FlaskConical, Rocket, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => {
  const { t } = useTranslation();

  const useCases = [
    { icon: Landmark, title: t("landing.useCases.financeTitle"), subtitle: t("landing.useCases.financeSubtitle"), description: t("landing.useCases.financeDesc"), stat: t("landing.useCases.financeStat"), statLabel: t("landing.useCases.financeStatLabel") },
    { icon: FlaskConical, title: t("landing.useCases.pharmaTitle"), subtitle: t("landing.useCases.pharmaSubtitle"), description: t("landing.useCases.pharmaDesc"), stat: t("landing.useCases.pharmaStat"), statLabel: t("landing.useCases.pharmaStatLabel") },
    { icon: Rocket, title: t("landing.useCases.scaleupTitle"), subtitle: t("landing.useCases.scaleupSubtitle"), description: t("landing.useCases.scaleupDesc"), stat: t("landing.useCases.scaleupStat"), statLabel: t("landing.useCases.scaleupStatLabel") },
    { icon: Building2, title: t("landing.useCases.publicTitle"), subtitle: t("landing.useCases.publicSubtitle"), description: t("landing.useCases.publicDesc"), stat: t("landing.useCases.publicStat"), statLabel: t("landing.useCases.publicStatLabel") },
  ];

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-muted/20" />
      <div id="use-cases" className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-xl mx-auto mb-16">
          <p className="text-[11px] font-medium text-muted-foreground mb-4 tracking-[0.2em] uppercase">{t("landing.useCases.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t("landing.useCases.title")}{" "}
            <span className="text-muted-foreground font-normal">{t("landing.useCases.titleHighlight")}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {useCases.map((uc, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.08, duration: 0.6, ease }} className="group relative p-7 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/[0.06] transition-colors">
                  <uc.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold mb-0.5">{uc.title}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">{uc.subtitle}</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">{uc.description}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-primary font-display">{uc.stat}</span>
                    <span className="text-[11px] text-muted-foreground">{uc.statLabel}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;

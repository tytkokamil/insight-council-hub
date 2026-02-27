import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    { name: t("landing.testimonials.name1"), role: t("landing.testimonials.role1"), quote: t("landing.testimonials.quote1"), metric: t("landing.testimonials.metric1"), metricLabel: t("landing.testimonials.metricLabel1") },
    { name: t("landing.testimonials.name2"), role: t("landing.testimonials.role2"), quote: t("landing.testimonials.quote2"), metric: t("landing.testimonials.metric2"), metricLabel: t("landing.testimonials.metricLabel2") },
    { name: t("landing.testimonials.name3"), role: t("landing.testimonials.role3"), quote: t("landing.testimonials.quote3"), metric: t("landing.testimonials.metric3"), metricLabel: t("landing.testimonials.metricLabel3") },
  ];

  return (
    <section id="testimonials" className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease }} className="text-center max-w-xl mx-auto mb-16">
          <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">{t("landing.testimonials.label")}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("landing.testimonials.title")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((tt, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.6, ease }} className="group relative p-7 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 flex flex-col">
              <div className="mb-5">
                <span className="text-3xl font-bold font-display text-primary">{tt.metric}</span>
                <span className="text-xs text-muted-foreground/60 ml-2">{tt.metricLabel}</span>
              </div>
              <Quote className="w-4 h-4 text-foreground/[0.08] mb-3" />
              <p className="text-sm text-muted-foreground/80 leading-[1.8] mb-6 flex-1">„{tt.quote}"</p>
              <div className="pt-5 border-t border-border/30">
                <div className="text-sm font-semibold">{tt.name}</div>
                <div className="text-xs text-muted-foreground/50">{tt.role}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-8 italic">
          {t("landing.testimonials.disclaimer")}
        </p>
      </div>
    </section>
  );
};

export default TestimonialsSection;

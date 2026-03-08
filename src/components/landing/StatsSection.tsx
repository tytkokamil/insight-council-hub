import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Building2, Pill, Rocket, Landmark, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const AnimatedNumber = ({ value, suffix }: { value: number; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ref.current) {
          hasAnimated.current = true;
          const isDecimal = value % 1 !== 0;
          animate(0, value, {
            duration: 2,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => {
              if (ref.current) ref.current.textContent = (isDecimal ? v.toFixed(1) : Math.round(v).toString()) + suffix;
            },
          });
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const ease = [0.16, 1, 0.3, 1] as const;

const StatsSection = () => {
  const { t } = useTranslation();

  const industries = [
    { icon: Landmark, label: t("landing.stats.finance") },
    { icon: Pill, label: t("landing.stats.pharma") },
    { icon: Rocket, label: t("landing.stats.scaleups") },
    { icon: Building2, label: t("landing.stats.enterprise") },
    { icon: Shield, label: t("landing.stats.compliance") },
  ];

  const metrics = [
    { value: "Mio. €", label: t("landing.stats.codAvoided") },
    { value: ">95%", label: t("landing.stats.slaRate") },
    { value: "bis zu 3×", label: t("landing.stats.fasterDecisions") },
    { value: "schnell", label: t("landing.stats.roiFirstMonth") },
  ];

  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent" />
      <div className="container mx-auto px-4 relative z-10 space-y-10">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium mb-6">{t("landing.stats.socialProof")}</p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {industries.map((ind, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5, ease }} className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-300">
                <ind.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{ind.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px max-w-3xl mx-auto rounded-2xl overflow-hidden border border-border/30 bg-border/30">
          {metrics.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.06, duration: 0.5, ease }} className="bg-card/80 text-center p-6">
              <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 font-display text-primary">
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

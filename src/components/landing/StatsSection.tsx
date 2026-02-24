import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Building2, Pill, Rocket, Landmark, Shield } from "lucide-react";

const metrics = [
  { value: 4.2, suffix: "M€", label: "CoD vermieden" },
  { value: 98, suffix: "%", label: "SLA-Bestehensquote" },
  { value: 40, suffix: "%", label: "Schnellere Entscheidungen" },
  { value: 2585, suffix: "%", label: "ROI im ersten Monat" },
];

const industries = [
  { icon: Landmark, label: "Finanzdienstleister" },
  { icon: Pill, label: "Pharma" },
  { icon: Rocket, label: "Scale-Ups" },
  { icon: Building2, label: "Enterprise" },
  { icon: Shield, label: "Compliance" },
];

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

const StatsSection = () => (
  <section className="py-20 relative">
    <div className="absolute inset-0 bg-muted/20" />
    
    <div className="container mx-auto px-4 relative z-10 space-y-10">
      {/* Industry logos / Social Proof */}
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium mb-6">
          Bereits von Teams in diesen Branchen genutzt
        </p>
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="flex items-center gap-2 text-muted-foreground/30"
            >
              <ind.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{ind.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Animated metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px max-w-3xl mx-auto bg-border/30 rounded-2xl overflow-hidden border border-border/30">
        {metrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="bg-card text-center p-6"
          >
            <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 font-display text-primary">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-[11px] text-muted-foreground/60 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;

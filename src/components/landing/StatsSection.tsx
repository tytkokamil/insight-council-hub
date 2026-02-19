import { motion, animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 73, suffix: "%", label: "Schnellere Entscheidungen", description: "durchschnittliche Verbesserung" },
  { value: 94, suffix: "%", label: "Umsetzungsrate", description: "bei strukturierten Decisions" },
  { value: 2.5, suffix: "x", label: "Bessere Nachverfolgung", description: "gegenüber klassischen Tools" },
  { value: 500, suffix: "+", label: "Enterprise-Teams", description: "vertrauen auf DecisionOS" },
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

const StatsSection = () => (
  <section id="stats" className="py-32 relative overflow-hidden">
    {/* Background accent */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-xs font-medium text-primary mb-4 tracking-widest uppercase">In Zahlen</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Ergebnisse die <span className="gradient-text">überzeugen</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative text-center p-8 rounded-2xl border border-border/40 bg-card hover:border-primary/20 transition-all duration-500"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {/* Hover glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative">
              <div className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors duration-500">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm font-medium mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground/60">{stat.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;

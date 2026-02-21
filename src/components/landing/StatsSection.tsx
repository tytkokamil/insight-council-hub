import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const metrics = [
  { value: 73, suffix: "%", label: "Schnellere Entscheidungen", description: "durchschnittliche Verbesserung" },
  { value: 94, suffix: "%", label: "Umsetzungsrate", description: "bei strukturierten Decisions" },
  { value: 2.5, suffix: "x", label: "Bessere Outcomes", description: "gegenüber klassischen Tools" },
  { value: 500, suffix: "+", label: "Enterprise-Teams", description: "vertrauen auf DecisionOS" },
];

const ease = [0.16, 1, 0.3, 1] as const;

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
  <section id="stats" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Ergebnisse die überzeugen
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {metrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group relative text-center p-5 rounded-xl border border-border bg-card hover:border-foreground/15 transition-all duration-300"
          >
            <div className="relative">
              <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 tabular-nums">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-medium mb-0.5">{stat.label}</div>
              <div className="text-[10px] text-muted-foreground/60">{stat.description}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;

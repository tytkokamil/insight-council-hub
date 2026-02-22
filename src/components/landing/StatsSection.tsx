import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const metrics = [
  { value: 32, suffix: "%", label: "Schnellere Entscheidungen", description: "durchschnittliche Zeitersparnis", accent: "from-accent-blue/10 to-transparent border-accent-blue/15" },
  { value: 18, suffix: "%", label: "Weniger Eskalationen", description: "durch proaktive Governance", accent: "from-accent-teal/10 to-transparent border-accent-teal/15" },
  { value: 24, suffix: "%", label: "Bessere Outcomes", description: "vorhersagbare Ergebnisse", accent: "from-accent-violet/10 to-transparent border-accent-violet/15" },
  { value: 43, suffix: "%", label: "Kosteneinsparung", description: "bei Verzögerungskosten", accent: "from-accent-amber/10 to-transparent border-accent-amber/15" },
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
          Ergebnisse die <span className="bg-gradient-to-r from-accent-blue to-accent-teal bg-clip-text text-transparent">überzeugen</span>
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
            className={`group relative text-center p-5 rounded-xl border bg-gradient-to-b ${stat.accent} hover:shadow-card-hover transition-all duration-300`}
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

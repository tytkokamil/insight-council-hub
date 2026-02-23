import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const metrics = [
  { value: 32, suffix: "%", label: "Kürzere Zyklen", detail: "Ø Entscheidungsdauer" },
  { value: 18, suffix: "%", label: "Weniger Eskalationen", detail: "Durch Auto-Routing" },
  { value: 3.2, suffix: "x", label: "Schnellere Freigaben", detail: "SLA-gesteuert" },
  { value: 43, suffix: "%", label: "Weniger Verzögerungskosten", detail: "Cost of Delay" },
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
  <section className="py-16 relative">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {metrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="text-center"
          >
            <div className="text-3xl md:text-4xl font-bold tracking-tight mb-1 font-display text-foreground">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm font-medium text-foreground/80 mb-0.5">{stat.label}</div>
            <div className="text-[11px] text-muted-foreground/40">{stat.detail}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;

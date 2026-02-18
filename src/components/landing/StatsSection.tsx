import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 73, suffix: "%", label: "Schnellere Entscheidungen" },
  { value: 94, suffix: "%", label: "Umsetzungsrate" },
  { value: 2.5, suffix: "x", label: "Bessere Nachverfolgung" },
  { value: 500, suffix: "+", label: "Enterprise-Teams" },
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
  <section id="stats" className="py-32 relative">
    <div className="container mx-auto px-4">
      {/* Minimal divider */}
      <div className="w-12 h-px bg-border mx-auto mb-16" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 max-w-4xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;

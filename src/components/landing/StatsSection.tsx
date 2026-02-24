import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const metrics = [
  { value: 32, suffix: "%", label: "Kürzere Zyklen" },
  { value: 18, suffix: "%", label: "Weniger Eskalationen" },
  { value: 3.2, suffix: "x", label: "Schnellere Freigaben" },
  { value: 43, suffix: "%", label: "Weniger Verzögerungskosten" },
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
    
    <div className="container mx-auto px-4 relative z-10">
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

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
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="aurora-card p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
            {metrics.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.6, ease }}
                className="text-center px-6 py-6"
              >
                <div className="text-4xl md:text-5xl font-bold tracking-[-0.04em] font-display text-foreground">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default StatsSection;

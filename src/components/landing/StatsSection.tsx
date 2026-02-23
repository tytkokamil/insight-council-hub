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

const StatsSection = () => (
  <section className="py-0 relative">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {metrics.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="py-16 pr-8 border-r border-border last:border-r-0"
          >
            <div className="text-5xl md:text-6xl font-bold tracking-[-0.05em] font-display">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm text-muted-foreground mt-3">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
  </section>
);

export default StatsSection;

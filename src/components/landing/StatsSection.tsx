import { motion, animate } from "framer-motion";
import { TrendingUp, Clock, Target, Users } from "lucide-react";
import { useEffect, useRef } from "react";

const stats = [
  { icon: TrendingUp, value: 73, suffix: "%", label: "Schnellere Entscheidungen", description: "Durchschnittliche Reduktion der Entscheidungszyklen" },
  { icon: Target, value: 94, suffix: "%", label: "Umsetzungsrate", description: "Entscheidungen, die vollständig implementiert werden" },
  { icon: Clock, value: 2.5, suffix: "x", label: "Bessere Nachverfolgung", description: "Verbesserte Transparenz über den Entscheidungsfortschritt" },
  { icon: Users, value: 500, suffix: "+", label: "Enterprise-Teams", description: "Organisationen, die ihre Entscheidungen transformieren" },
];

const AnimatedNumber = ({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const isDecimal = value % 1 !== 0;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = (isDecimal ? v.toFixed(1) : Math.round(v).toString()) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const StatsSection = () => {
  return (
    <section id="stats" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">Messbare Ergebnisse</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Zahlen, die
            <span className="gradient-text"> für sich sprechen</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/8 mb-5">
                <stat.icon className="w-5.5 h-5.5 text-primary" />
              </div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={true} />
              </div>
              <div className="font-semibold text-sm mb-1">{stat.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;

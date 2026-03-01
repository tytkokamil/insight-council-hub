import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ShieldCheck, LayoutTemplate, Brain, Blocks, Zap, Lock } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const AnimatedNumber = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ref.current && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(0, value, {
            duration: 2.2,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => {
              if (ref.current) ref.current.textContent = prefix + Math.round(v) + suffix;
            },
          });
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, suffix, prefix]);

  return <span ref={ref} className="tabular-nums">0{suffix}</span>;
};

const metrics = [
  { icon: ShieldCheck, value: 9, suffix: "", label: "Compliance Frameworks", sub: "NIS2, ISO, IATF, GMP, MaRisk …", accent: "text-[hsl(175,35%,42%)] bg-[hsl(175,35%,42%,0.08)]" },
  { icon: LayoutTemplate, value: 15, suffix: "+", label: "Branchen-Templates", sub: "Sofort einsatzbereit, anpassbar", accent: "text-[hsl(220,45%,50%)] bg-[hsl(220,45%,50%,0.08)]" },
  { icon: Brain, value: 6, suffix: "", label: "KI-Module", sub: "CoPilot, Briefing, Analyse, Anomalien …", accent: "text-[hsl(250,35%,55%)] bg-[hsl(250,35%,55%,0.08)]" },
  { icon: Blocks, value: 9, suffix: "", label: "Analytics-Module", sub: "DNA, Heatmap, Friction Map, Timeline …", accent: "text-[hsl(200,40%,48%)] bg-[hsl(200,40%,48%,0.08)]" },
  { icon: Zap, value: 4, suffix: "", label: "Eskalationsstufen", sub: "Automatisch, regelbasiert", accent: "text-[hsl(35,45%,48%)] bg-[hsl(35,45%,48%,0.08)]" },
  { icon: Lock, value: 256, suffix: "-bit", label: "SHA-256 Audit Trail", sub: "Kryptographisch gesichert", accent: "text-[hsl(340,30%,50%)] bg-[hsl(340,30%,50%,0.08)]" },
];

const MetricsShowcase = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
    
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase" style={{ color: 'hsl(220 45% 50%)' }}>Die Plattform in Zahlen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Gebaut für den Mittelstand. Jedes Detail zählt.
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group relative p-6 rounded-2xl border border-border/30 bg-white/70 backdrop-blur-sm hover:border-border/50 hover:shadow-[0_8px_30px_-12px_hsl(220,20%,50%,0.08)] transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(220,40%,70%,0.02)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl ${m.accent} flex items-center justify-center mb-4`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1 font-mono" style={{ color: 'hsl(220 14% 36%)' }}>
                <AnimatedNumber value={m.value} suffix={m.suffix} />
              </div>
              <h3 className="text-[14px] font-semibold mb-1">{m.label}</h3>
              <p className="text-[12px]" style={{ color: 'hsl(220 10% 62%)' }}>{m.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default MetricsShowcase;

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Brain } from "lucide-react";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.3, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-12 w-full">
      {/* Ambient gradient — very subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-accent-teal/[0.03] blur-[80px]" />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 0.8px, transparent 0.8px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/[0.06] border border-primary/10 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-primary/80 tracking-[0.08em] uppercase">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold tracking-[-0.04em] leading-[1.05] mb-6">
            <motion.span
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 0.7, ease }}
              className="block"
            >
              Jede Entscheidung.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.35, duration: 0.7, ease }}
              className="block bg-gradient-to-r from-primary via-accent-violet to-accent-teal bg-clip-text text-transparent"
            >
              Strukturiert. Nachvollziehbar.
            </motion.span>
          </h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease }}
            className="text-base md:text-[17px] text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
          >
            KI-Risikoanalyse, SLA-Eskalation und Executive Dashboards — 
            die Plattform für Teams, die bessere Entscheidungen treffen wollen.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" className="rounded-full group px-7 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15 transition-all">
              Kostenlos starten
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full border-border/50 px-7" onClick={() => setShowTour(true)}>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Demo ansehen
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-10 flex items-center justify-center gap-6"
          >
            {[
              { icon: Shield, text: "DSGVO-konform" },
              { icon: Zap, text: "SOC 2 Ready" },
              { icon: Brain, text: "KI-gestützt" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <item.icon className="w-3 h-3 text-muted-foreground/30" />
                <span className="text-[11px] text-muted-foreground/40 font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1, ease }}
          style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity }}
          className="mt-14 relative max-w-3xl mx-auto"
        >
          <div className="relative rounded-2xl border border-border/40 bg-card overflow-hidden shadow-2xl shadow-foreground/[0.03]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 bg-muted/10">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/[0.06]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.06]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.06]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-0.5 rounded bg-muted/25 text-[10px] text-muted-foreground/35 font-mono">
                  app.decivio.com
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="relative p-4 md:p-6 space-y-3">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Decision Health", value: "87", suffix: "%", color: "text-accent-teal" },
                  { label: "Risk Exposure", value: "12", suffix: "%", color: "text-primary" },
                  { label: "SLA Compliance", value: "96", suffix: "%", color: "text-accent-violet" },
                  { label: "Cost of Delay", value: "4.2", suffix: "k", color: "text-accent-amber" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.06, duration: 0.4, ease }}
                    className="p-2.5 rounded-lg border border-border/25 bg-muted/5"
                  >
                    <div className={`text-lg font-bold font-display ${s.color}`}>
                      {s.value}<span className="text-sm">{s.suffix}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground/50 mt-0.5">{s.label}</div>
                  </motion.div>
                ))}
              </div>
              
              {/* Chart + AI insight side by side */}
              <div className="grid grid-cols-5 gap-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="col-span-3 p-3 rounded-lg bg-muted/5 border border-border/15"
                >
                  <div className="text-[9px] font-medium text-muted-foreground/50 mb-2">Decision Velocity</div>
                  <div className="flex items-end gap-[3px] h-12">
                    {[35, 55, 42, 70, 48, 78, 60, 85, 65, 50, 75, 62, 80, 68].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-[2px] bg-primary/10"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.6 + i * 0.025, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7, duration: 0.4 }}
                  className="col-span-2 p-3 rounded-lg bg-accent-violet/[0.03] border border-accent-violet/10"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain className="w-3 h-3 text-accent-violet/60" />
                    <span className="text-[9px] font-medium text-accent-violet/60">KI-Insight</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                    3 Entscheidungen im Review-Engpass. Eskalation empfohlen.
                  </p>
                </motion.div>
              </div>
              
              {/* Fade */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

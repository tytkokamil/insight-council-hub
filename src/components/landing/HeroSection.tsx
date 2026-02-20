import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Lock } from "lucide-react";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.4, 0.9], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-28 pb-16 w-full">
      {/* Layered ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/60 mb-12 relative"
          >
            <div className="absolute -inset-px rounded-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 opacity-60 blur-sm pointer-events-none" />
            <div className="relative flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">
                Enterprise Decision Intelligence
              </span>
            </div>
          </motion.div>

          {/* Headline — word-by-word stagger */}
          <h1 className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.04em] leading-[0.92] mb-8">
            {["Nie", "wieder", "verlorene"].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease }}
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5, duration: 1, ease }}
              className="gradient-text inline-block"
            >
              Entscheidungen.
            </motion.span>
          </h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-14 leading-relaxed"
          >
            DecisionOS macht jede Geschäftsentscheidung nachvollziehbar,
            KI-gestützt und termingerecht — vom Entwurf bis zur Umsetzung.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button variant="hero" size="xl" className="rounded-full group">
              Kostenlos starten
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl" className="rounded-full" onClick={() => setShowTour(true)}>
              <Play className="w-4 h-4" />
              Demo ansehen
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 1 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { icon: Shield, text: "DSGVO-konform" },
              { icon: Lock, text: "SOC 2 Ready" },
              { icon: Zap, text: "Enterprise-Sicherheit" },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2 text-muted-foreground/60"
              >
                <badge.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium tracking-wide">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 1.2, ease }}
          style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity }}
          className="mt-28 relative max-w-5xl mx-auto"
        >
          {/* Multi-layer glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/8 via-accent/4 to-transparent opacity-80 blur-2xl pointer-events-none" />
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/15 via-primary/5 to-transparent pointer-events-none" />

          <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-elevated), 0 0 60px -15px hsl(var(--primary) / 0.12)' }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-muted/20">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/50 text-[11px] text-muted-foreground/60 font-mono border border-border/30">
                  app.decisionos.com
                </div>
              </div>
            </div>

            {/* Code-based dashboard mockup */}
            <div className="relative p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Approved", value: "12", color: "text-success" },
                  { label: "In Review", value: "5", color: "text-warning" },
                  { label: "Risk Score", value: "34%", color: "text-primary" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.1, duration: 0.5, ease }}
                    className="p-3 rounded-xl bg-muted/30 border border-border/40"
                  >
                    <div className={`text-xl md:text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.label}</div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.6 }}
                className="p-4 rounded-xl bg-muted/20 border border-border/40"
              >
                <div className="text-xs font-medium text-muted-foreground mb-3">Decision Velocity</div>
                <div className="flex items-end gap-1.5 h-20">
                  {[40, 65, 50, 80, 55, 90, 70, 95, 75, 60, 85, 72].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/35 transition-colors"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.8 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
              </motion.div>
              <div className="space-y-1.5">
                {[
                  { title: "Q4 Budget Allocation", status: "Approved", statusColor: "bg-success/10 text-success" },
                  { title: "Engineering Hiring Plan", status: "Review", statusColor: "bg-warning/10 text-warning" },
                  { title: "Cloud Migration", status: "Draft", statusColor: "bg-muted text-muted-foreground" },
                ].map((row, i) => (
                  <motion.div
                    key={row.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.0 + i * 0.08, duration: 0.4, ease }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/15 border border-border/30"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span className="text-xs font-medium flex-1 truncate">{row.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${row.statusColor}`}>{row.status}</span>
                  </motion.div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

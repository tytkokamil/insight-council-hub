import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
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
      {/* Subtle animated gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full opacity-[0.03]"
          style={{ background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent-teal)), hsl(var(--accent-violet)), hsl(var(--primary)))" }}
        />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/[0.02] blur-[120px]" />
      </div>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted/60 border border-border mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-[0.12em] uppercase">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.045em] leading-[1.02] mb-8">
            <motion.span
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 0.8, ease }}
              className="block"
            >
              Governance für jede
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.35, duration: 0.8, ease }}
              className="block"
            >
              Entscheidung die{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-primary via-accent-violet to-accent-teal bg-clip-text text-transparent">
                  zählt.
                </span>
              </span>
            </motion.span>
          </h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed"
          >
            SLA-gesteuerte Freigaben, automatische Eskalation und Executive Dashboards — 
            damit keine Entscheidung liegen bleibt.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="xl" className="rounded-full group shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15 transition-all">
              Kostenlos starten
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" className="rounded-full border-border/60 hover:bg-muted/30" onClick={() => setShowTour(true)}>
              <Play className="w-4 h-4" />
              Demo ansehen
            </Button>
          </motion.div>

          {/* Minimal social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-14 flex items-center justify-center gap-8"
          >
            {[
              "DSGVO-konform",
              "SOC 2 Ready",
              "Enterprise-grade",
            ].map((text, i) => (
              <span key={i} className="text-[11px] text-muted-foreground/40 font-medium tracking-wide">
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview — compact */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 1.2, ease }}
          style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity }}
          className="mt-16 relative max-w-2xl mx-auto"
        >
          <div className="relative rounded-xl border border-border/50 bg-card overflow-hidden shadow-xl shadow-primary/[0.03]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/10">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-foreground/[0.07]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.07]" />
                <div className="w-2 h-2 rounded-full bg-foreground/[0.07]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-0.5 rounded bg-muted/30 text-[10px] text-muted-foreground/40 font-mono border border-border/15">
                  app.decivio.com
                </div>
              </div>
            </div>

            {/* Dashboard mockup — compact */}
            <div className="relative p-4 md:p-5 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Freigegeben", value: "12", color: "text-accent-teal" },
                  { label: "Im Review", value: "5", color: "text-accent-amber" },
                  { label: "Risiko-Score", value: "34%", color: "text-primary" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + i * 0.08, duration: 0.4, ease }}
                    className="p-3 rounded-lg border border-border/30 bg-muted/5"
                  >
                    <div className={`text-lg md:text-xl font-bold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">{s.label}</div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="p-3 rounded-lg bg-muted/5 border border-border/20"
              >
                <div className="text-[10px] font-medium text-muted-foreground/60 mb-2">Decision Velocity</div>
                <div className="flex items-end gap-1 h-10">
                  {[40, 65, 50, 80, 55, 90, 70, 95, 75, 60, 85, 72].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/8"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.7 + i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {/* Fade out gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

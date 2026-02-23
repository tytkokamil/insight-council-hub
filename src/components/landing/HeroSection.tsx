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
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const mockupOpacity = useTransform(scrollYProgress, [0.4, 0.8], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-28 pb-20">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-violet/[0.05] blur-[100px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent-teal/[0.04] blur-[100px]" />
      </div>

      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div className="container relative z-10 mx-auto px-4 flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.1, duration: 0.8, ease }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04] backdrop-blur-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </div>
            <span className="text-xs font-medium text-primary tracking-wide">
              Decision Governance Platform
            </span>
          </div>
        </motion.div>

        {/* Headline — massive, editorial */}
        <div className="text-center max-w-4xl">
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold tracking-[-0.05em] leading-[0.95]">
            <motion.span
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2, duration: 0.9, ease }}
              className="block"
            >
              Jede Entscheidung.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.35, duration: 0.9, ease }}
              className="block mt-1"
            >
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-accent-violet to-accent-teal bg-clip-text text-transparent">
                  Strukturiert.
                </span>
              </span>
              {" "}
              <span className="bg-gradient-to-r from-accent-violet to-primary bg-clip-text text-transparent">
                Nachvollziehbar.
              </span>
            </motion.span>
          </h1>
        </div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease }}
          className="mt-8 text-base md:text-lg text-muted-foreground max-w-xl text-center leading-relaxed"
        >
          KI-Risikoanalyse, SLA-Eskalation und Executive Dashboards — 
          die Plattform für Teams, die bessere Entscheidungen treffen wollen.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease }}
          className="mt-10 flex flex-col sm:flex-row gap-3"
        >
          <Button
            size="lg"
            className="rounded-full group px-8 h-12 text-[15px] shadow-xl shadow-primary/15 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300"
          >
            Kostenlos starten
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-[15px] border-border/50 hover:bg-muted/30"
            onClick={() => setShowTour(true)}
          >
            <Play className="w-3.5 h-3.5 mr-2" />
            Demo ansehen
          </Button>
        </motion.div>

        {/* Trust badges — minimal, inline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="mt-12 flex items-center gap-8 text-[11px] text-muted-foreground/35 font-medium"
        >
          {["DSGVO-konform", "SOC 2 Ready", "KI-gestützt", "E2E-verschlüsselt"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              {t}
            </span>
          ))}
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1.2, ease }}
          style={{ y: mockupY, scale: mockupScale, opacity: mockupOpacity }}
          className="mt-20 w-full max-w-4xl"
        >
          <div className="relative">
            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent rounded-3xl blur-2xl" />
            
            <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-foreground/[0.04]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/20" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted/30 text-[10px] text-muted-foreground/40 font-mono">
                    app.decivio.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="relative p-5 md:p-8">
                {/* KPIs row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Decision Health", value: "87", suffix: "%", color: "text-accent-teal" },
                    { label: "Risk Exposure", value: "12", suffix: "%", color: "text-primary" },
                    { label: "SLA Compliance", value: "96", suffix: "%", color: "text-accent-violet" },
                    { label: "Cost of Delay", value: "4.2", suffix: "k", color: "text-accent-amber" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.3 + i * 0.08, duration: 0.5, ease }}
                      className="p-3 rounded-xl border border-border/30 bg-background/50"
                    >
                      <div className={`text-xl md:text-2xl font-bold font-display tracking-tight ${s.color}`}>
                        {s.value}<span className="text-sm font-medium">{s.suffix}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/45 mt-1">{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart + AI panel */}
                <div className="grid grid-cols-5 gap-3">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    className="col-span-3 p-4 rounded-xl bg-background/50 border border-border/20"
                  >
                    <div className="text-[10px] font-medium text-muted-foreground/50 mb-3">Decision Velocity</div>
                    <div className="flex items-end gap-[3px] h-16">
                      {[30, 50, 38, 65, 42, 72, 55, 80, 60, 45, 70, 58, 75, 62, 82, 68].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-primary/25 to-primary/8"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1.7 + i * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                    className="col-span-2 p-4 rounded-xl bg-accent-violet/[0.04] border border-accent-violet/10"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
                      <span className="text-[10px] font-semibold text-accent-violet/70">KI-Insight</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/55 leading-relaxed">
                      3 Entscheidungen im Review-Engpass. Eskalation empfohlen für Budget Q4.
                    </p>
                  </motion.div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

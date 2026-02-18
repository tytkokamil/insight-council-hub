import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, BarChart3 } from "lucide-react";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-12 w-full">
      {/* Minimal ambient — single soft gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Minimal badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-muted/30 mb-12"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">
              Enterprise Decision Intelligence
            </span>
          </motion.div>

          {/* Headline — larger, bolder, more breathing room */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1, ease }}
            className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.04em] leading-[0.92] mb-8"
          >
            Nie wieder verlorene
            <br />
            <span className="gradient-text">Entscheidungen.</span>
          </motion.h1>

          {/* Subline — restrained, one clear sentence */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease }}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-14 leading-relaxed"
          >
            DecisionOS macht jede Geschäftsentscheidung nachvollziehbar, 
            KI-gestützt und termingerecht — vom Entwurf bis zur Umsetzung.
          </motion.p>

          {/* CTA — clean, two buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button variant="hero" size="xl" className="rounded-full">
              Kostenlos starten
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="xl" className="rounded-full" onClick={() => setShowTour(true)}>
              <Play className="w-4 h-4" />
              Demo ansehen
            </Button>
          </motion.div>

          {/* Trust — minimal, just text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { icon: Shield, text: "DSGVO-konform" },
              { icon: Zap, text: "SOC 2 Ready" },
              { icon: Shield, text: "Enterprise-Sicherheit" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/60">
                <badge.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium tracking-wide">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview — cleaner frame */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease }}
          className="mt-28 relative max-w-5xl mx-auto"
        >
          {/* Subtle glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-60 blur-xl pointer-events-none" />

          <div className="relative rounded-2xl border border-border/60 bg-card shadow-elevated overflow-hidden">
            {/* Browser chrome — minimal */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/10" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/40 text-[11px] text-muted-foreground/60 font-mono">
                  app.decisionos.com
                </div>
              </div>
            </div>

            <DashboardPreview />
          </div>
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

const DashboardPreview = () => (
  <div className="p-6 space-y-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <span className="font-display font-semibold text-sm">Decision Dashboard</span>
      </div>
      <div className="flex gap-2">
        <div className="px-2.5 py-1 rounded-md text-[10px] bg-success/8 text-success font-medium">12 Genehmigt</div>
        <div className="px-2.5 py-1 rounded-md text-[10px] bg-warning/8 text-warning font-medium">5 In Review</div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        { title: "Q4 Budget-Freigabe", status: "Genehmigt", priority: "Hoch", progress: 85 },
        { title: "Neuer Markteintritt", status: "In Review", priority: "Kritisch", progress: 60 },
        { title: "Tech Stack Migration", status: "Entwurf", priority: "Mittel", progress: 30 },
      ].map((decision, i) => (
        <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3">
          <div className="flex items-start justify-between">
            <span className="font-medium text-sm">{decision.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
              decision.status === 'Genehmigt' ? 'bg-success/8 text-success' :
              decision.status === 'In Review' ? 'bg-warning/8 text-warning' :
              'bg-muted text-muted-foreground'
            }`}>
              {decision.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-border/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${decision.progress}%` }}
                transition={{ duration: 1.4, delay: 1 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">{decision.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default HeroSection;

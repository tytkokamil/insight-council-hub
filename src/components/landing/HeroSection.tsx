import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const DAILY_COST = 5 * 120 * 8 * 3;
const PER_SECOND = DAILY_COST / 86400;

const LiveCounter = () => {
  const [value, setValue] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      setValue(elapsed * PER_SECOND);
    };
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.8, ease }}
      className="max-w-lg mx-auto mt-10 mb-10"
    >
      <div className="relative rounded-2xl border border-border bg-card p-6 overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          <span className="text-xs text-muted-foreground">Ihre simulierten Verzögerungskosten heute</span>
        </div>

        <div className="text-4xl md:text-5xl font-bold text-warning tabular-nums tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          €{value.toFixed(2)}
        </div>

        <p className="text-[11px] text-muted-foreground mt-3">
          Basierend auf 5 offenen Entscheidungen · €120/h · 8h/Tag · 3 Personen
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
          * Demo-Berechnung — konfigurieren Sie Ihre eigenen Werte im ROI-Rechner
        </p>
      </div>
    </motion.div>
  );
};

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);

  const trustItems = [
    "✓ Keine Kreditkarte",
    "✓ DSGVO-konform · Server in Deutschland",
    "✓ In 3 Minuten startklar",
    "✓ NIS2 & ISO 9001 dokumentiert",
  ];

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: "linear-gradient(hsl(225 16% 88% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(225 16% 88% / 0.6) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Radial blue glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card shadow-sm mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-[0.12em] uppercase">
              Decision Governance Platform · Made in Germany
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.2rem,5.5vw,5rem)] font-bold tracking-[-0.04em] leading-[1.05] mb-6">
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }} className="block text-foreground">
              Jede offene Entscheidung
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease }} className="block">
              <span className="text-foreground">kostet Ihr Unternehmen </span>
              <span className="text-warning">echtes Geld.</span>
            </motion.span>
          </h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease }}
            className="text-[17px] md:text-[19px] text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Decivio macht sichtbar was bisher unsichtbar war — und sorgt dafür dass Entscheidungen schneller, dokumentierter und compliance-konform getroffen werden.
          </motion.p>

          {/* Live Counter */}
          <LiveCounter />

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="inline-flex items-center justify-center gap-2 text-[15px] font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 px-8 py-3.5 rounded-xl transition-all"
            >
              <Play className="w-4 h-4" /> Demo ansehen
            </button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {trustItems.map((item, i) => (
              <span key={i} className="text-[12px] text-muted-foreground/70">{item}</span>
            ))}
          </motion.div>
        </div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

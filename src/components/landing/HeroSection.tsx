import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

/* Live cost counter: 5 decisions × €120/h × 8h × 3 persons = €14,400/day */
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
      <div className="relative rounded-2xl border border-white/[0.06] bg-[hsl(216,40%,11%)] p-6 overflow-hidden">
        {/* Blue top highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(217,91%,60%)] to-transparent" />

        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)] animate-pulse" />
          <span className="text-xs text-[hsl(215,20%,65%)]">Ihre simulierten Verzögerungskosten heute</span>
        </div>

        <div className="text-4xl md:text-5xl font-bold text-[hsl(38,92%,50%)] tabular-nums tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          €{value.toFixed(2)}
        </div>

        <p className="text-[11px] text-[hsl(215,16%,47%)] mt-3">
          Basierend auf 5 offenen Entscheidungen · €120/h · 8h/Tag · 3 Personen
        </p>
        <p className="text-[10px] text-[hsl(215,16%,47%)]/60 mt-1 italic">
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
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Radial blue glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[hsl(217,91%,60%)]/[0.08] rounded-full blur-[120px] pointer-events-none" />
      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-[hsl(217,91%,60%)] animate-pulse" />
            <span className="text-[11px] font-medium text-[hsl(215,20%,65%)] tracking-[0.12em] uppercase">
              Decision Governance Platform · Made in Germany
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(2.2rem,5.5vw,5rem)] font-bold tracking-[-0.04em] leading-[1.05] mb-6">
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }} className="block text-white">
              Jede offene Entscheidung
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease }} className="block">
              <span className="text-white">kostet Ihr Unternehmen </span>
              <span className="text-[hsl(38,92%,50%)]">echtes Geld.</span>
            </motion.span>
          </h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease }}
            className="text-[17px] md:text-[19px] text-[hsl(215,20%,65%)] max-w-2xl mx-auto leading-relaxed"
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
              className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] px-8 py-3.5 rounded-xl shadow-[0_0_30px_-6px_hsl(217,91%,60%/0.5)] hover:shadow-[0_0_40px_-6px_hsl(217,91%,60%/0.6)] transition-all"
            >
              Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="inline-flex items-center justify-center gap-2 text-[15px] font-medium text-[hsl(215,20%,65%)] hover:text-white border border-white/[0.1] hover:border-white/[0.2] px-8 py-3.5 rounded-xl transition-all"
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
              <span key={i} className="text-[12px] text-[hsl(215,16%,47%)]">{item}</span>
            ))}
          </motion.div>
        </div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

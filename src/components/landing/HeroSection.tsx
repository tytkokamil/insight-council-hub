import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease }}
      className="max-w-md mx-auto mt-10 mb-10"
    >
      <div className="relative rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Simulierte Verzögerungskosten heute</span>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-warning tabular-nums tracking-tight font-mono">
          €{value.toFixed(2)}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          5 offene Entscheidungen · €120/h · 8h/Tag · 3 Personen
        </p>
      </div>
    </motion.div>
  );
};

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,96%)] via-[hsl(225,20%,98%)] to-transparent" />
      
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.3]" style={{
        backgroundImage: "radial-gradient(circle, hsl(225 16% 78% / 0.4) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-white/70 backdrop-blur-sm mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-[clamp(2rem,5vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-6 text-foreground"
          >
            Jede offene Entscheidung
            <br />
            kostet Ihr Unternehmen{" "}
            <span className="text-warning">echtes Geld.</span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease }}
            className="text-[16px] md:text-[18px] text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Decivio macht sichtbar was bisher unsichtbar war — und sorgt dafür dass Entscheidungen schneller, dokumentierter und compliance-konform getroffen werden.
          </motion.p>

          <LiveCounter />

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-7 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-7 py-3 rounded-xl transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5" /> Demo ansehen
            </button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {["Keine Kreditkarte", "In 3 Minuten startklar", "DSGVO-konform"].map((item, i) => (
              <span key={i} className="text-[11px] text-muted-foreground/60">
                ✓ {item}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

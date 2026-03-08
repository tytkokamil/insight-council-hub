import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = [
  { text: "echtes Geld.", color: "text-destructive" },
  { text: "verlorene Zeit.", color: "text-accent-amber" },
  { text: "Compliance-Risiko.", color: "text-accent-rose" },
  { text: "verpasste Chancen.", color: "text-accent-violet" },
];

const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex relative overflow-hidden align-bottom" style={{ minWidth: "6ch", height: "1.15em" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease }}
          className={`absolute left-0 top-0 whitespace-nowrap ${ROTATING_WORDS[index].color}`}
        >
          {ROTATING_WORDS[index].text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Minimal inline CoD ticker — no orbits, just the number */
const InlineTicker = () => {
  const [cents, setCents] = useState(0);
  const costPerSecond = 47000 / 30 / 24 / 3600;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = () => {
      setCents(((performance.now() - start) / 1000) * costPerSecond);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease }}
      className="mt-12 flex items-center justify-center gap-3"
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-destructive"
      />
      <span className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
        Kosten seit Sie hier sind
      </span>
      <span className="text-lg font-mono font-bold tabular-nums text-destructive">
        €{cents.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </motion.div>
  );
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-16" aria-label="Hero">
      <motion.div style={{ opacity: bgOpacity }} className="aurora-bg" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge — minimal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-ultra mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-primary">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline — one thought, no fluff */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-6"
          >
            Jede offene Entscheidung{" "}
            <br className="hidden sm:block" />
            kostet Ihr Unternehmen{" "}
            <RotatingWord />
          </motion.h1>

          {/* Subline — one sentence */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease }}
            className="text-[15px] md:text-[17px] max-w-md mx-auto leading-relaxed text-muted-foreground"
          >
            Decivio macht die unsichtbaren Kosten sichtbar — und sorgt dafür, dass Entscheidungen fallen.
          </motion.p>

          {/* One primary CTA + one secondary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-10"
          >
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground px-8 py-4 rounded-xl bg-primary hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] transition-all duration-300 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-primary-foreground/10"
                initial={{ x: "-100%", skewX: "-15deg" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.6, ease }}
              />
              <span className="relative z-10 flex items-center gap-2">
                14 Tage kostenlos testen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/demo"
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium glass-ultra px-7 py-4 rounded-xl text-muted-foreground hover:text-foreground hover:shadow-md transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5" /> Interaktive Demo
            </Link>
          </motion.div>

          {/* Live cost ticker — inline, no fluff */}
          <InlineTicker />

          {/* Trust signals — minimal, earned */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {["Keine Kreditkarte", "In 3 Min startklar", "DSGVO-konform", "Server in DE"].map((item, i) => (
              <span key={i} className="text-[11px] font-medium text-muted-foreground">
                <span className="mr-1 text-success">✓</span>{item}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

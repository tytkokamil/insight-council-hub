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

const COST_PER_SECOND = 47000 / 30 / 24 / 3600; // ~€0.037/s

const RotatingWord = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="block text-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.4, ease }}
          className={`inline-block ${ROTATING_WORDS[index].color}`}
        >
          {ROTATING_WORDS[index].text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const LiveCodTicker = () => {
  const [cost, setCost] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setCost(((Date.now() - startRef.current) / 1000) * COST_PER_SECOND);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease }}
      className="max-w-[440px] mx-auto mt-8 mb-2"
    >
      <div
        className="flex items-center justify-between gap-4 px-6 py-4 rounded-xl border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-destructive shrink-0"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Während Sie diese Seite lesen:
          </span>
        </div>
        <span className="text-2xl font-bold font-mono tabular-nums text-destructive shrink-0">
          €{cost.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground italic text-center mt-1.5">
        Durchschnitt für einen deutschen Mittelständler
      </p>
    </motion.div>
  );
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-12" aria-label="Hero">
      <motion.div style={{ opacity: bgOpacity }} className="aurora-bg" />

      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-ultra mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-primary">
              Entscheidungsplattform für den Mittelstand
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-[clamp(2rem,5vw,3.8rem)] font-semibold tracking-[-0.02em] leading-[1.15] mb-4"
          >
            Jede offene Entscheidung
            <br />
            kostet Ihr Unternehmen
            <RotatingWord />
          </motion.h1>

          <LiveCodTicker />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease }}
            className="text-[15px] md:text-[17px] max-w-md mx-auto leading-relaxed text-muted-foreground mt-4"
          >
            Decivio macht die unsichtbaren Kosten sichtbar — und sorgt dafür, dass Entscheidungen fallen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
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

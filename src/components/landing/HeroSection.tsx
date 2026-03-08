import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Shield, Zap, BarChart3 } from "lucide-react";
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
    <>
      <br />
      <span className="inline-block relative h-[1.2em] overflow-hidden align-bottom w-full">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease }}
            className={`absolute left-0 right-0 text-center whitespace-nowrap ${ROTATING_WORDS[index].color}`}
          >
            {ROTATING_WORDS[index].text}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
};

/** Orbital CoD Ticker — the showpiece */
const CodTicker = () => {
  const [cents, setCents] = useState(0);
  const costPerSecond = 47000 / 30 / 24 / 3600;

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      setCents(elapsed * costPerSecond);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const formatted = cents.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.3, duration: 0.7, ease }}
      className="mt-16 flex flex-col items-center"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 font-semibold">
        Kosten offener Entscheidungen seit Seitenbesuch
      </p>

      {/* Orbital container */}
      <div className="relative w-[220px] h-[220px] md:w-[260px] md:h-[260px] flex items-center justify-center">
        {/* Outer orbit ring */}
        <div className="absolute inset-0 orbit-ring">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-violet/40" />
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-accent-teal/50" />
        </div>
        <div className="absolute inset-3 rounded-full border border-border/20" />
        <div className="absolute inset-6 orbit-ring-reverse">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-amber/40" />
          <div className="absolute bottom-0 right-1/4 w-1 h-1 rounded-full bg-destructive/30" />
        </div>
        <div className="absolute inset-6 rounded-full border border-border/10" />

        {/* Central ticker */}
        <div className="relative z-10 flex flex-col items-center px-6 py-5 rounded-full bg-card/80 backdrop-blur-xl border border-destructive/15 shadow-[0_0_40px_-10px_hsl(var(--destructive)/0.15)]">
          <span className="text-[10px] font-semibold text-destructive/70 mb-0.5">€</span>
          <span className="text-3xl md:text-4xl font-mono font-bold tabular-nums text-destructive tracking-tight">
            {formatted}
          </span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-destructive mt-1"
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-3">
        Basierend auf Ø €47.000/Monat bei mittleren Unternehmen
      </p>
    </motion.div>
  );
};

const STATS = [
  { value: "4,2", suffix: " Tage", label: "Ø Entscheidungsdauer", icon: Zap },
  { value: "€47k", suffix: "/Mo", label: "Ø unsichtbare Kosten", icon: BarChart3 },
  { value: "73", suffix: "%", label: "schnellere Freigaben", icon: Shield },
];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-24" aria-label="Hero">
      {/* Aurora background */}
      <motion.div style={{ opacity: bgOpacity }} className="aurora-bg" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground) / 0.4) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-ultra mb-10 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-primary">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline — Syne font via .landing-page h1 */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease }}
            className="text-[clamp(2.4rem,6vw,5rem)] font-extrabold tracking-[-0.04em] leading-[1.05] mb-6"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Jede offene Entscheidung
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              kostet Ihr Unternehmen
            </motion.span>
            <RotatingWord />
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease }}
            className="text-[15px] md:text-[17px] max-w-lg mx-auto leading-relaxed text-muted-foreground"
          >
            Decivio macht sichtbar was bisher unsichtbar war — und sorgt dafür dass Entscheidungen schneller, dokumentierter und compliance-konform getroffen werden.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-10"
          >
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground px-8 py-4 rounded-xl transition-all duration-300 overflow-hidden bg-primary hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)]"
            >
              <motion.div
                className="absolute inset-0 bg-primary-foreground/10"
                initial={{ x: "-100%", skewX: "-15deg" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.6, ease }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            <Link
              to="/demo"
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium glass-ultra px-7 py-4 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:shadow-md"
            >
              <Play className="w-3.5 h-3.5" /> Interaktive Demo
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
          >
            {["Keine Kreditkarte", "In 3 Min startklar", "DSGVO-konform", "Server in DE"].map((item, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                className="text-[11px] font-medium text-muted-foreground/70"
              >
                <span className="mr-1 text-success">✓</span> {item}
              </motion.span>
            ))}
          </motion.div>

          {/* Orbital CoD Ticker */}
          <CodTicker />

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease }}
            className="mt-14 grid grid-cols-3 gap-6 max-w-md mx-auto"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 + i * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                  <stat.icon className="w-4 h-4 text-primary/60" />
                </div>
                <p className="text-xl md:text-2xl font-bold tabular-nums text-foreground">
                  {stat.value}<span className="text-sm font-semibold text-muted-foreground">{stat.suffix}</span>
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

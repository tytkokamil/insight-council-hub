import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Shield, Zap, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = [
  { text: "echtes Geld.", color: "text-primary" },
  { text: "verlorene Zeit.", color: "text-accent" },
  { text: "Compliance-Risiko.", color: "text-primary" },
  { text: "verpasste Chancen.", color: "text-accent" },
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

/* Animated grid background */
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(220_50%_70%/0.12),transparent_70%)]" />
    <motion.div
      animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]"
    />
    <motion.div
      animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[120px]"
    />
    <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: "radial-gradient(circle, hsl(220 20% 55% / 0.6) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }} />
  </div>
);

const STATS = [
  { value: "4,2", suffix: " Tage", label: "Ø Entscheidungsdauer", icon: Zap },
  { value: "€47k", suffix: "/Mo", label: "Ø unsichtbare Kosten", icon: BarChart3 },
  { value: "73", suffix: "%", label: "schnellere Freigaben", icon: Shield },
];

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-24" aria-label="Hero">
      <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0">
        <GridBackground />
      </motion.div>

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-background/70 backdrop-blur-md mb-10 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase text-primary">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease }}
            className="text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-6"
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
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground px-8 py-4 rounded-xl transition-all duration-300 overflow-hidden bg-primary hover:shadow-[0_4px_24px_-6px_hsl(var(--primary)/0.4)]"
            >
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ x: "-100%", skewX: "-15deg" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.6, ease }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium border border-border/50 hover:border-border bg-background/60 backdrop-blur-sm px-7 py-4 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:shadow-md"
            >
              <Play className="w-3.5 h-3.5" /> Demo ansehen
            </button>
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
                <span className="mr-1 text-emerald-500">✓</span> {item}
              </motion.span>
            ))}
          </motion.div>

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

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

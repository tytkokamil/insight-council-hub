import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const DAILY_COST = 5 * 120 * 8 * 3;
const PER_SECOND = DAILY_COST / 86400;

const ROTATING_WORDS = [
  { text: "echtes Geld.", color: "text-warning" },
  { text: "verlorene Zeit.", color: "text-destructive" },
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
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            className={`absolute left-0 right-0 text-center whitespace-nowrap ${ROTATING_WORDS[index].color}`}
          >
            {ROTATING_WORDS[index].text}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
};

/* Floating particles */
const Particles = () => {
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 8,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/[0.06]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

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
      <div className="relative rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm overflow-hidden group hover:border-warning/30 transition-colors duration-500">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-warning/[0.04] to-transparent" />
        <div className="flex items-center gap-2 mb-2 relative">
          <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          <span className="text-[11px] text-muted-foreground">Simulierte Verzögerungskosten heute</span>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-warning tabular-nums tracking-tight font-mono relative">
          €{value.toFixed(2)}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 relative">
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
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Premium gradient background */}
      <motion.div style={{ scale: bgScale, opacity: bgOpacity }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,96%)] via-background to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-accent-violet/[0.03] blur-[120px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-accent-teal/[0.02] blur-[100px]" />
      </motion.div>
      
      {/* Refined dot grid */}
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "radial-gradient(circle, hsl(225 16% 60% / 0.4) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <Particles />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-white/80 backdrop-blur-sm mb-10 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold text-primary/80 tracking-wide uppercase">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline with rotating word */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-[clamp(2rem,5vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-6"
            style={{ color: 'hsl(228 15% 18%)' }}
          >
            Jede offene Entscheidung
            <br />
            kostet Ihr Unternehmen
            <RotatingWord />
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease }}
            className="text-[16px] md:text-[18px] max-w-xl mx-auto leading-relaxed"
            style={{ color: 'hsl(225 10% 45%)' }}
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
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground bg-gradient-to-b from-primary to-[hsl(214,52%,22%)] hover:from-primary/90 hover:to-[hsl(214,52%,20%)] px-8 py-3.5 rounded-xl shadow-[0_2px_12px_-3px_hsl(214_52%_25%/0.4)] hover:shadow-[0_4px_20px_-4px_hsl(214_52%_25%/0.5)] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium hover:text-foreground border border-border/60 hover:border-border bg-white/60 backdrop-blur-sm px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-sm"
              style={{ color: 'hsl(225 10% 40%)' }}
            >
              <Play className="w-3.5 h-3.5" /> Demo ansehen
            </button>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
          >
            {["Keine Kreditkarte", "In 3 Minuten startklar", "DSGVO-konform"].map((item, i) => (
              <span key={i} className="text-[11px] font-medium" style={{ color: 'hsl(225 10% 55%)' }}>
                <span className="text-success mr-1">✓</span> {item}
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

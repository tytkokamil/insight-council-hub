import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = [
  { text: "echtes Geld.", color: "text-[hsl(220,45%,50%)]" },
  { text: "verlorene Zeit.", color: "text-[hsl(200,40%,48%)]" },
  { text: "Compliance-Risiko.", color: "text-[hsl(250,35%,55%)]" },
  { text: "verpasste Chancen.", color: "text-[hsl(175,35%,45%)]" },
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

/* Floating particles — very subtle */
const Particles = () => {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 6 + 10,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[hsl(220,40%,70%,0.08)]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

const HeroSection = () => {
  const [showTour, setShowTour] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Soft ambient background */}
      <motion.div style={{ scale: bgScale, opacity: bgOpacity }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,25%,96%)] via-background to-transparent" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(220,50%,70%,0.05)] blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(250,40%,70%,0.04)] blur-[120px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-[hsl(180,35%,65%,0.03)] blur-[100px]" />
      </motion.div>
      
      {/* Very subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle, hsl(220 20% 55% / 0.5) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <Particles />

      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(220,40%,70%,0.2)] bg-white/70 backdrop-blur-sm mb-10 shadow-[0_1px_4px_hsl(220,20%,50%,0.06)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(220,50%,55%)] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'hsl(220 45% 50%)' }}>
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline with rotating word */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-[clamp(2rem,5vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-6"
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
            className="text-[15px] md:text-[17px] max-w-lg mx-auto leading-relaxed text-muted-foreground"
          >
            Decivio macht sichtbar was bisher unsichtbar war — und sorgt dafür dass Entscheidungen schneller, dokumentierter und compliance-konform getroffen werden.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-10"
          >
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-3.5 rounded-xl transition-all duration-300 overflow-hidden hover:shadow-[0_4px_20px_-4px_hsl(220,50%,40%,0.4)]"
              style={{
                background: 'linear-gradient(to bottom, hsl(220 50% 48%), hsl(220 50% 40%))',
                boxShadow: '0 2px 12px -3px hsl(220 50% 40% / 0.35)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
            <button
              onClick={() => setShowTour(true)}
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium border border-border/50 hover:border-border bg-white/60 backdrop-blur-sm px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_2px_12px_-4px_hsl(220,20%,50%,0.1)]"
              style={{ color: 'hsl(220 12% 48%)' }}
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
              <span key={i} className="text-[11px] font-medium" style={{ color: 'hsl(220 12% 58%)' }}>
                <span className="mr-1" style={{ color: 'hsl(160 40% 50%)' }}>✓</span> {item}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" })}
        >
          <span className="text-[10px] text-muted-foreground/40 tracking-wider uppercase">Mehr erfahren</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
        </motion.div>
      </motion.div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

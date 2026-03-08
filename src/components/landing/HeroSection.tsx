import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useIndustryPersonalization } from "@/hooks/useIndustryPersonalization";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = ["Geld.", "Zeit.", "Wachstum.", "Vertrauen.", "Wettbewerb."];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const industry = useIndustryPersonalization();

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[hsl(222,47%,4%)]"
      aria-label="Hero"
    >
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary) / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      {/* Radial red glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "600px",
          background: "radial-gradient(ellipse, hsl(var(--destructive) / 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <motion.div style={{ y: contentY }} className="container relative z-10 mx-auto px-4 pt-20 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10"
            style={{
              background: "hsl(var(--destructive) / 0.1)",
              border: "1px solid hsl(var(--destructive) / 0.3)",
            }}
          >
            <span className="text-destructive" style={{ fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>
              ⚡ ENTSCHEIDUNGSPLATTFORM FÜR DEN MITTELSTAND
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="text-[clamp(2rem,5vw,3.8rem)] font-semibold tracking-[-0.02em] leading-[1.15] mb-6"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Jede offene Entscheidung
            <br />
            kostet Ihr Unternehmen
            <br />
            <span className="inline-block relative" style={{ minWidth: "4ch" }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease }}
                  className="inline-block text-destructive"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Subtext — personalized if industry detected */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease }}
            className="text-[15px] md:text-[17px] max-w-md mx-auto leading-relaxed mb-8"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {industry
              ? industry.heroSub
              : "Decivio macht die unsichtbaren Kosten sichtbar — und sorgt dafür, dass Entscheidungen fallen."}
          </motion.p>

          {/* Industry-specific pain point badge */}
          {industry && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5, ease }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6"
              style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.15)" }}
            >
              <span className="text-[12px] text-white/60">
                {industry.label}: <span className="font-semibold text-destructive">{industry.painPoint}</span>
              </span>
            </motion.div>
          )}

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-10"
          >
            {["Keine Kreditkarte", "DSGVO-konform", "Server in DE"].map((item, i) => (
              <span key={i} className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                <span className="mr-1" style={{ color: "rgba(255,255,255,0.5)" }}>✓</span>{item}
              </span>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 overflow-hidden hover:opacity-90"
              style={{ background: "#EF4444" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                14 Tage kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/demo"
              className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium px-7 py-4 rounded-xl transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Play className="w-3.5 h-3.5" /> Live Demo
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
        </motion.div>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
          Scroll für das vollständige Bild
        </span>
      </div>

      {/* Gradient transition to light */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "120px",
          background: "linear-gradient(to bottom, transparent, #F8FAFC)",
        }}
      />
    </section>
  );
};

export default HeroSection;

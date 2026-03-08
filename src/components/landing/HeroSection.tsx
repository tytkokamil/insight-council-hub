import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const COST_PER_MS = 47000 / 30 / 24 / 3600 / 1000; // ~€0.018/ms → €47k/mo

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  // Inline CoD counter
  const [cost, setCost] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setCost((Date.now() - startRef.current) * COST_PER_MS);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const formattedCost = `€${cost.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      aria-label="Hero"
      style={{ background: "#030712" }}
    >
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
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
          background: "radial-gradient(ellipse, rgba(239,68,68,0.12) 0%, transparent 70%)",
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
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <span style={{ color: "#EF4444", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>
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
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease }}
              className="inline-block tabular-nums font-mono"
              style={{ color: "#EF4444" }}
            >
              {formattedCost}
            </motion.span>
            <span style={{ color: "rgba(255,255,255,0.95)" }}>.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease }}
            className="text-[15px] md:text-[17px] max-w-md mx-auto leading-relaxed mb-8"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Decivio macht die unsichtbaren Kosten sichtbar — und sorgt dafür, dass Entscheidungen fallen.
          </motion.p>

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

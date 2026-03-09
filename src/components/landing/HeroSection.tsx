import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = ["Geld.", "Zeit.", "Wachstum.", "Wettbewerb."];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const [wordIndex, setWordIndex] = useState(0);
  const [exposure, setExposure] = useState(0);
  const exposureStart = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - exposureStart.current) / 1000;
      setExposure(elapsed * 0.14);
    }, 100);
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
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left column */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{
                background: "hsl(var(--destructive) / 0.1)",
                border: "1px solid hsl(var(--destructive) / 0.3)",
              }}
            >
              <span className="text-destructive" style={{ fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>
                ⚡ DECISION GOVERNANCE FÜR DEN DEUTSCHEN MITTELSTAND
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

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7, ease }}
              className="text-[15px] md:text-[17px] max-w-md leading-relaxed mb-8"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Decivio macht die Kosten offener Entscheidungen in Echtzeit sichtbar —
              und sorgt dafür, dass Freigaben fallen. Nicht irgendwann. Heute.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-10"
            >
              {["Keine Kreditkarte", "DSGVO-konform", "Server in Deutschland", "14 Tage kostenlos"].map((item, i) => (
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
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                to="/auth"
                className="group relative inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 overflow-hidden hover:opacity-90 bg-destructive"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <a
                href="#showcase"
                className="group inline-flex items-center justify-center gap-2 text-[14px] font-medium px-7 py-4 rounded-xl transition-all duration-200"
                style={{
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <Play className="w-3.5 h-3.5" /> Demo ansehen
              </a>
            </motion.div>
          </div>

          {/* Right column — Dashboard Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease }}
            className="hidden lg:block"
          >
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                  💸 Economic Exposure
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-destructive inline-block"
                  />
                  LIVE
                </span>
              </div>

              {/* Big amount */}
              <div className="px-5 py-6 text-center">
                <div className="text-3xl font-bold font-mono tabular-nums text-destructive">
                  €{exposure.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  seit Ihrem Seitenaufruf
                </p>
              </div>

              {/* Decision rows */}
              <div className="px-4 pb-2 space-y-2">
                {[
                  { color: "#EF4444", title: "Cloud-Migration", badge: "CRITICAL", badgeColor: "#EF4444", days: "8 Tage offen" },
                  { color: "#F59E0B", title: "CNC-Investitionsfreigabe", badge: "SLA HEUTE", badgeColor: "#F59E0B", days: "12 Tage offen" },
                  { color: "#F97316", title: "Lieferantenwechsel", badge: "OVERDUE", badgeColor: "#F97316", days: "5 Tage offen" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{item.title}</p>
                    </div>
                    <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded" style={{ color: item.badgeColor, background: `${item.badgeColor}15` }}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{item.days}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button className="flex-1 text-[11px] font-semibold py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                  ✓ Genehmigen
                </button>
                <button className="flex-1 text-[11px] font-semibold py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                  ✗ Ablehnen
                </button>
              </div>
            </div>
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
          background: "linear-gradient(to bottom, transparent, hsl(var(--background)))",
        }}
      />
    </section>
  );
};

export default HeroSection;

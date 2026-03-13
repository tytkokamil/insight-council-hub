import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const ROTATING_WORDS = ["Geld.", "Zeit.", "Wachstum.", "Wettbewerb."];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

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
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      aria-label="Hero"
      style={{ background: "hsl(222, 47%, 4%)" }}
    >
      {/* Mesh gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "-20%",
            left: "10%",
            width: "60%",
            height: "60%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, hsl(var(--primary) / 0.15) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <motion.div
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 25, -15, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            bottom: "-10%",
            right: "-5%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, hsl(var(--accent-violet) / 0.1) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <motion.div
          animate={{
            x: [0, 15, -10, 0],
            y: [0, -10, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "40%",
            right: "20%",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, hsl(var(--accent-teal) / 0.06) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Animated dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary) / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          animation: "gridMove 30s linear infinite",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-50" />

      {/* Content */}
      <motion.div style={{ y: contentY, opacity }} className="container relative z-10 mx-auto px-4 pt-24 pb-36">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left column */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-10"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--accent-violet) / 0.08))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
              <span style={{ fontSize: "11px", letterSpacing: "0.14em", fontWeight: 600, color: "hsl(var(--primary-bright))" }}>
                DECISION GOVERNANCE FÜR DEN DEUTSCHEN MITTELSTAND
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease }}
              className="text-[clamp(2.2rem,5.5vw,4.2rem)] font-bold tracking-[-0.04em] leading-[1.08] mb-7"
              style={{ color: "rgba(255,255,255,0.97)" }}
            >
              Jede offene Entscheidung
              <br />
              kostet Ihr Unternehmen
              <br />
              <span className="inline-block relative" style={{ minWidth: "4ch" }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                    transition={{ duration: 0.5, ease }}
                    className="inline-block"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--accent-rose)))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
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
              className="text-[16px] md:text-[18px] max-w-lg leading-[1.7] mb-9"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Decivio macht die Kosten offener Entscheidungen in Echtzeit sichtbar —
              und sorgt dafür, dass Freigaben fallen. Nicht irgendwann. Heute.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mb-11"
            >
              {["Keine Kreditkarte", "DSGVO-konform", "Server in Deutschland", "14 Tage kostenlos"].map((item, i) => (
                <span key={i} className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: "hsl(var(--primary) / 0.6)" }} />{item}
                </span>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5, ease }}
              className="flex flex-col sm:flex-row gap-3.5"
            >
              <Link
                to="/auth"
                className="group relative inline-flex items-center justify-center gap-2.5 text-[15px] font-bold text-white px-9 py-4.5 rounded-2xl transition-all duration-300 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-blue)))",
                  boxShadow: "0 0 50px -10px hsl(var(--primary) / 0.5), 0 0 100px -20px hsl(var(--accent-blue) / 0.3)",
                }}
              >
                {/* Shine effect */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2.5">
                  Kostenlos starten <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
              <a
                href="#showcase"
                className="group inline-flex items-center justify-center gap-2.5 text-[14px] font-medium px-7 py-4 rounded-2xl transition-all duration-300 hover:border-white/20"
                style={{
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Play className="w-3.5 h-3.5" /> Demo ansehen
              </a>
            </motion.div>
          </div>

          {/* Right column — Dashboard Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateY: -5 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: 0.5, duration: 1, ease }}
            className="hidden lg:block"
            style={{ perspective: "1200px" }}
          >
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              {/* Gradient border glow */}
              <div className="absolute -inset-[1px] rounded-2xl pointer-events-none" style={{
                background: "conic-gradient(from 180deg, hsl(var(--primary) / 0.15), hsl(var(--accent-violet) / 0.1), hsl(var(--accent-teal) / 0.1), hsl(var(--primary) / 0.15))",
                zIndex: -1,
                filter: "blur(1px)",
              }} />

              {/* Header */}
              <div className="px-5 py-3.5 flex items-center justify-between relative z-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                  💸 Economic Exposure
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-destructive inline-block"
                  />
                  LIVE
                </span>
              </div>

              {/* Big amount */}
              <div className="px-5 py-7 text-center relative z-10">
                <motion.div
                  className="text-4xl font-bold font-mono tabular-nums"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--accent-rose)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 20px hsl(var(--destructive) / 0.3))",
                  }}
                >
                  €{exposure.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.div>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  seit Ihrem Seitenaufruf
                </p>
              </div>

              {/* Decision rows */}
              <div className="px-4 pb-3 space-y-2 relative z-10">
                {[
                  { color: "#EF4444", title: "Cloud-Migration", badge: "CRITICAL", badgeColor: "#EF4444", days: "8 Tage offen" },
                  { color: "#F59E0B", title: "CNC-Investitionsfreigabe", badge: "SLA HEUTE", badgeColor: "#F59E0B", days: "12 Tage offen" },
                  { color: "#F97316", title: "Lieferantenwechsel", badge: "OVERDUE", badgeColor: "#F97316", days: "5 Tage offen" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease }}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="w-1.5 h-7 rounded-full shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{item.title}</p>
                    </div>
                    <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-md" style={{ color: item.badgeColor, background: `${item.badgeColor}15` }}>
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{item.days}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="px-4 py-3.5 flex gap-2.5 relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button className="flex-1 text-[11px] font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                  ✓ Genehmigen
                </button>
                <button className="flex-1 text-[11px] font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02]" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                  ✗ Ablehnen
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5" style={{ color: "rgba(255,255,255,0.25)" }} />
        </motion.div>
      </div>

      {/* Subtle bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "80px",
          background: "linear-gradient(to bottom, transparent, hsl(222 47% 4%))",
        }}
      />
    </section>
  );
};

export default HeroSection;

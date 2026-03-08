import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;
const ROTATING_WORDS = ["Geld.", "Zeit.", "Wachstum.", "Wettbewerb."];

const DARK_TEXTURE = `radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.08) 0%, transparent 60%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const HeroSection = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [costCounter, setCostCounter] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length), 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCostCounter((prev) => prev + 0.14), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative min-h-[100svh] flex items-center overflow-hidden"
      style={{
        background: "#030810",
        backgroundImage: `${DARK_TEXTURE}, radial-gradient(ellipse at 70% 50%, rgba(239,68,68,0.12) 0%, transparent 50%)`,
      }}
      aria-label="Hero"
    >
      <div className="container relative z-10 mx-auto px-4 pt-24 pb-32">
        <div className="grid lg:grid-cols-5 gap-12 items-center max-w-6xl mx-auto">
          {/* Left column */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
              style={{ background: "#1E293B", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <span style={{ color: "#EF4444", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>
                ⚡ DECISION GOVERNANCE FÜR DEN DEUTSCHEN MITTELSTAND
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease }}
              className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.15] mb-6"
              style={{ fontFamily: "'DM Serif Display', serif", color: "rgba(255,255,255,0.95)" }}
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
                    className="inline-block"
                    style={{ color: "#EF4444" }}
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7, ease }}
              className="text-lg leading-relaxed mb-6"
              style={{ color: "#94A3B8", maxWidth: "520px", fontFamily: "'DM Sans', sans-serif" }}
            >
              Decivio macht die Kosten offener Entscheidungen in Echtzeit sichtbar —
              und sorgt dafür, dass Freigaben fallen. Nicht irgendwann. Heute.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8"
            >
              {["Keine Kreditkarte", "DSGVO-konform", "Server in Deutschland", "14 Tage kostenlos"].map((item) => (
                <span key={item} className="text-sm" style={{ color: "#64748B" }}>
                  <span style={{ color: "#94A3B8" }}>✓</span> {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5, ease }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-lg transition-all duration-200 min-h-[48px] shadow-lg"
                style={{ background: "#EF4444", boxShadow: "0 4px 14px rgba(153,27,27,0.2)" }}
              >
                Kostenlos starten <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#showcase"
                onClick={(e) => { e.preventDefault(); document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" }); }}
                className="inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-lg transition-all duration-200 min-h-[48px]"
                style={{ color: "#F1F5F9", border: "1px solid #1E293B", background: "rgba(255,255,255,0.03)" }}
              >
                <Play className="w-3.5 h-3.5" /> Demo ansehen
              </a>
            </motion.div>
          </div>

          {/* Right column — Dashboard mockup */}
          <motion.div
            className="lg:col-span-2 hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease }}
          >
            <motion.div
              className="rounded-xl p-5 space-y-4"
              style={{
                background: "rgba(15,23,41,0.9)",
                border: "1px solid #1E293B",
                transform: "perspective(1000px) rotateY(-8deg) rotateX(4deg)",
              }}
              whileHover={{ rotateY: -4, rotateX: 2 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>💸 Economic Exposure</span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "#EF4444" }}>
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                  LIVE
                </span>
              </div>

              <div>
                <span
                  className="text-4xl font-bold tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#EF4444" }}
                >
                  €{costCounter.toFixed(2).replace(".", ",")}
                </span>
                <p className="text-xs mt-1" style={{ color: "#64748B" }}>seit Ihrem Seitenaufruf — in Ihrer Branche</p>
              </div>

              <div className="space-y-2 pt-2" style={{ borderTop: "1px solid #1E293B" }}>
                {[
                  { color: "#EF4444", name: "Cloud-Migration", badge: "CRITICAL", days: 8 },
                  { color: "#F59E0B", name: "CNC-Investitionsfreigabe", badge: "SLA HEUTE", days: 12 },
                  { color: "#F97316", name: "Lieferantenwechsel", badge: "OVERDUE", days: 5 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs" style={{ color: "#94A3B8" }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span style={{ color: "#F1F5F9" }}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${item.color}20`, color: item.color }}>
                        {item.badge}
                      </span>
                      <span>{item.days}T</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid #1E293B" }}>
                <button className="flex-1 py-2 rounded-md text-xs font-semibold text-white" style={{ background: "#22C55E" }}>✓ Genehmigen</button>
                <button className="flex-1 py-2 rounded-md text-xs font-semibold" style={{ background: "#1E293B", color: "#F1F5F9" }}>✗ Ablehnen</button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <motion.div animate={{ y: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

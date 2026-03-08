import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;
const ROTATING_WORDS = ["Geld.", "Zeit.", "Wachstum.", "Wettbewerb."];

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
    <section className="dark" aria-label="Hero">
      <div className="relative min-h-[100svh] flex items-center overflow-hidden bg-background">
        <div className="aurora-bg" />
        <div className="container relative z-10 mx-auto px-4 pt-24 pb-32">
          <div className="grid lg:grid-cols-5 gap-12 items-center max-w-6xl mx-auto">
            {/* Left column */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 bg-card border border-destructive/30"
              >
                <span className="text-destructive text-[11px] tracking-[0.12em] font-semibold">
                  ⚡ DECISION GOVERNANCE FÜR DEN DEUTSCHEN MITTELSTAND
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease }}
                className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] mb-6 tracking-[-0.03em]"
              >
                <span className="shimmer-text">Jede offene Entscheidung</span>
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

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease }}
                className="text-lg leading-relaxed mb-6 text-muted-foreground max-w-[520px]"
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
                  <span key={item} className="text-sm text-muted-foreground">
                    <span className="text-foreground/60">✓</span> {item}
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
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-destructive-foreground px-6 py-3 rounded-lg transition-all duration-200 min-h-[48px] bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                >
                  Kostenlos starten <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#showcase"
                  onClick={(e) => { e.preventDefault(); document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="inline-flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-lg transition-all duration-200 min-h-[48px] text-foreground border border-border hover:border-destructive/40 glass-ultra"
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
                className="glass-ultra rounded-xl p-5 space-y-4"
                style={{ transform: "perspective(1000px) rotateY(-8deg) rotateX(4deg)" }}
                whileHover={{ rotateY: -4, rotateX: 2 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">💸 Economic Exposure</span>
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    LIVE
                  </span>
                </div>

                <div>
                  <span className="text-4xl font-bold tabular-nums text-destructive" style={{ fontFamily: "var(--font-mono)" }}>
                    €{costCounter.toFixed(2).replace(".", ",")}
                  </span>
                  <p className="text-xs mt-1 text-muted-foreground">seit Ihrem Seitenaufruf — in Ihrer Branche</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  {[
                    { color: "hsl(var(--destructive))", name: "Cloud-Migration", badge: "CRITICAL", days: 8 },
                    { color: "hsl(var(--warning))", name: "CNC-Investitionsfreigabe", badge: "SLA HEUTE", days: 12 },
                    { color: "hsl(38 90% 55%)", name: "Lieferantenwechsel", badge: "OVERDUE", days: 5 },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-foreground">{item.name}</span>
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

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button className="flex-1 py-2 rounded-md text-xs font-semibold text-success-foreground bg-success">✓ Genehmigen</button>
                  <button className="flex-1 py-2 rounded-md text-xs font-semibold text-foreground bg-card border border-border">✗ Ablehnen</button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, 8, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-5 h-5 text-foreground/30" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

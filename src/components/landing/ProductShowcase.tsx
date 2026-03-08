import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const tabs = ["Live Dashboard", "One-Click Approval", "Audit Trail"] as const;

const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Live Dashboard");
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setRotateX(-((e.clientY - rect.top) / rect.height - 0.5) * 10);
    setRotateY(((e.clientX - rect.left) / rect.width - 0.5) * 10);
  }, []);

  return (
    <section id="showcase" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-foreground">Sehen Sie Decivio in Aktion.</h2>
        </motion.div>
        <div className="flex justify-center gap-2 mb-10">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>
        {activeTab === "Live Dashboard" && (
          <div className="dark">
            <motion.div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); }} style={{ perspective: "1000px" }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="glass-ultra rounded-xl p-8 max-w-3xl mx-auto" style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, transition: "transform 0.1s ease" }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { l: "Entscheidungen offen", v: "23", cls: "text-foreground" },
                    { l: "Economic Exposure", v: "€48.200", cls: "text-destructive" },
                    { l: "SLA-Warnungen", v: "3", cls: "text-warning" },
                    { l: "SLAs eingehalten", v: "94%", cls: "text-success" },
                  ].map(k => (
                    <div key={k.l} className="p-4 rounded-lg bg-card border border-border">
                      <p className="text-xs mb-1 text-muted-foreground">{k.l}</p>
                      <p className={`text-xl font-bold tabular-nums ${k.cls}`} style={{ fontFamily: "var(--font-mono)" }}>{k.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {activeTab === "One-Click Approval" && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-sm mx-auto rounded-2xl p-6 space-y-4 bg-card border-2 border-border shadow-[var(--shadow-elevated)]">
            <p className="text-xs font-semibold text-muted-foreground">Von: Decivio · noreply@decivio.com</p>
            <p className="text-sm font-semibold text-foreground">Freigabe erforderlich: Lieferantenwechsel Weber GmbH</p>
            <p className="text-xs text-muted-foreground">Wechsel des Hauptlieferanten für CNC-Frästeile. Kostenreduktion 12%.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-lg text-sm font-semibold text-success-foreground bg-success">✓ Genehmigen</button>
              <button className="flex-1 py-3 rounded-lg text-sm font-semibold text-destructive-foreground bg-destructive">✗ Ablehnen</button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">Kein Login erforderlich. Token-Link. DSGVO-konform.</p>
          </motion.div>
        )}
        {activeTab === "Audit Trail" && (
          <div className="dark">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto rounded-xl p-6 space-y-3 glass-ultra">
              {["GENESIS Block — Kette gestartet", "decision.created — 14.01.2026 09:12 · Maria K.", "decision.reviewed — 14.01.2026 11:34 · Peter M.", "decision.approved — 14.01.2026 14:02 · Dr. Weber", "decision.implemented — 15.01.2026 08:15 · System"].map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm"><span className="text-success">✓</span><span className="font-mono text-xs text-foreground">{e}</span></div>
              ))}
              <div className="flex gap-3 pt-4 border-t border-border">
                <span className="text-xs px-2 py-1 rounded bg-success/20 text-success">Integrität verifiziert ✓</span>
                <span className="text-xs px-2 py-1 rounded bg-card text-muted-foreground border border-border">Als PDF exportieren</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground">Hash: sha256:a3f7b2...c91d</p>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;

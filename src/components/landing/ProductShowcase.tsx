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
    <section id="showcase" className="py-24" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Sehen Sie Decivio in Aktion.</h2>
        </motion.div>
        <div className="flex justify-center gap-2 mb-10">
          {tabs.map(t => (<button key={t} onClick={() => setActiveTab(t)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === t ? { background: "#EF4444", color: "#fff" } : { background: "#F1F5F9", color: "#64748B" }}>{t}</button>))}
        </div>
        {activeTab === "Live Dashboard" && (
          <motion.div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={() => { setRotateX(0); setRotateY(0); }} style={{ perspective: "1000px" }} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="rounded-xl p-8 max-w-3xl mx-auto" style={{ background: "#0F1729", border: "1px solid #1E293B", transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`, transition: "transform 0.1s ease" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ l: "Entscheidungen offen", v: "23", c: "#F1F5F9" }, { l: "Economic Exposure", v: "€48.200", c: "#EF4444" }, { l: "SLA-Warnungen", v: "3", c: "#F59E0B" }, { l: "SLAs eingehalten", v: "94%", c: "#22C55E" }].map(k => (
                  <div key={k.l} className="p-4 rounded-lg" style={{ background: "#1E293B" }}>
                    <p className="text-xs mb-1" style={{ color: "#64748B" }}>{k.l}</p>
                    <p className="text-xl font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color: k.c }}>{k.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === "One-Click Approval" && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-sm mx-auto rounded-2xl p-6 space-y-4" style={{ background: "#FFFFFF", border: "2px solid #E2E8F0", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            <p className="text-xs font-semibold" style={{ color: "#64748B" }}>Von: Decivio · noreply@decivio.com</p>
            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>Freigabe erforderlich: Lieferantenwechsel Weber GmbH</p>
            <p className="text-xs" style={{ color: "#64748B" }}>Wechsel des Hauptlieferanten für CNC-Frästeile. Kostenreduktion 12%.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#22C55E" }}>✓ Genehmigen</button>
              <button className="flex-1 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#EF4444" }}>✗ Ablehnen</button>
            </div>
            <p className="text-[10px] text-center" style={{ color: "#94A3B8" }}>Kein Login erforderlich. Token-Link. DSGVO-konform.</p>
          </motion.div>
        )}
        {activeTab === "Audit Trail" && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto rounded-xl p-6 space-y-3" style={{ background: "#0F1729", border: "1px solid #1E293B" }}>
            {["GENESIS Block — Kette gestartet", "decision.created — 14.01.2026 09:12 · Maria K.", "decision.reviewed — 14.01.2026 11:34 · Peter M.", "decision.approved — 14.01.2026 14:02 · Dr. Weber", "decision.implemented — 15.01.2026 08:15 · System"].map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm"><span style={{ color: "#22C55E" }}>✓</span><span className="font-mono text-xs" style={{ color: "#F1F5F9" }}>{e}</span></div>
            ))}
            <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid #1E293B" }}>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#22C55E20", color: "#22C55E" }}>Integrität verifiziert ✓</span>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "#1E293B", color: "#94A3B8" }}>Als PDF exportieren</span>
            </div>
            <p className="text-xs font-mono" style={{ color: "#475569" }}>Hash: sha256:a3f7b2...c91d</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ProductShowcase;

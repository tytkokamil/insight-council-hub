import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const features = [
  { icon: "📧", title: "One-Click Approval aus E-Mail", text: "Reviewer genehmigen oder lehnen direkt aus der E-Mail ab. Kein Login, kein Portal-Besuch. Token-basiert, DSGVO-konform.", badge: "Ab Starter Plan" },
  { icon: "🤖", title: "KI Daily Brief um 07:30 Uhr", text: "Jeden Morgen: die 3 kritischsten offenen Entscheidungen, aktuelle SLA-Warnungen und die gesamte Economic Exposure.", badge: "Ab Professional Plan" },
  { icon: "🔐", title: "Kryptographischer Audit Trail", text: "Jede Änderung wird SHA-256-gehasht und unveränderlich verkettet. Kein nachträgliches Bearbeiten möglich.", badge: "Ab Professional Plan" },
  { icon: "⚠️", title: "Predictive SLA Warning", text: "KI erkennt drohende SLA-Verletzungen bevor sie eintreten — basierend auf historischen Entscheidungsmustern.", badge: "Ab Professional Plan" },
  { icon: "📋", title: "15 Branchen-Templates", text: "ECO, PPAP, Change Control, CAPA, MaRisk, ADR, VOB, HACCP — sofort einsatzbereit.", badge: "Alle Pläne" },
];

const CoDTicker = () => {
  const [val, setVal] = useState(0);
  useEffect(() => { const id = setInterval(() => setVal(v => v + 0.14), 1000); return () => clearInterval(id); }, []);
  return <span className="text-3xl font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#EF4444" }}>€{val.toFixed(2).replace(".", ",")}</span>;
};

const SolutionSection = () => (
  <section id="solution" className="py-24" style={{ background: "#FFFFFF" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Decision Governance. So wie sie sein sollte.</h2>
        <p className="text-lg" style={{ color: "#64748B" }}>Fünf Kernfunktionen. Alle implementiert. Sofort einsatzbereit.</p>
      </motion.div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
        className="rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "#0F1729", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⏱</span>
            <h3 className="text-xl font-semibold" style={{ color: "#F1F5F9" }}>Echtzeit Cost-of-Delay</h3>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#EF4444" }}><span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" /> LIVE</span>
          </div>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: "#94A3B8" }}>Jede offene Entscheidung zeigt täglich wachsende Verzögerungskosten — berechnet aus Stundensatz × Beteiligte × Tage offen.</p>
        </div>
        <CoDTicker />
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {features.slice(0, 3).map((f, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="rounded-xl p-6" style={{ border: "1px solid #E2E8F0" }}>
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: "#0F172A" }}>{f.title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748B" }}>{f.text}</p>
            <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>{f.badge}</span>
          </motion.div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {features.slice(3).map((f, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="rounded-xl p-6" style={{ border: "1px solid #E2E8F0" }}>
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: "#0F172A" }}>{f.title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748B" }}>{f.text}</p>
            <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>{f.badge}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

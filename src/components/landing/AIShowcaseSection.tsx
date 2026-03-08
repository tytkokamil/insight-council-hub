import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const capabilities = [
  { icon: "🧠", title: "Risiko-Scoring", desc: "0–100 Risiko-Score pro Entscheidung" },
  { icon: "⚠️", title: "Anomalie-Erkennung", desc: "Ungewöhnliche Muster in Echtzeit" },
  { icon: "🔮", title: "Predictive Timeline", desc: "Voraussage wann Entscheidung abgeschlossen" },
  { icon: "📋", title: "Entscheidungs-DNA", desc: "Welche Typen entscheiden Sie schnell?" },
  { icon: "🎯", title: "Strategy Alignment", desc: "Verknüpfung mit strategischen Zielen" },
  { icon: "💡", title: "KI Co-Pilot", desc: "Kontextuelle Empfehlung zum richtigen Zeitpunkt" },
];

const AIShowcaseSection = () => (
  <section className="py-24" style={{ background: "#F8FAFC" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Entscheidungsintelligenz die mitdenkt.</h2>
        <p className="text-lg" style={{ color: "#64748B" }}>KI nicht als Feature-Checkbox — sondern als täglicher Arbeitsassistent.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="space-y-6">
          {[
            { label: "📈 Velocity Score", value: "Ø 2,3 Tage", sub: "vs. Branchendurchschnitt Ø 8,7 Tage" },
            { label: "⚡ KI Daily Brief", value: "Täglich um 07:30 Uhr", sub: "3 kritischste Entscheidungen · SLA-Warnungen · Economic Exposure" },
            { label: "🤖 Modell", value: "Gemini 2.5 Pro / Flash", sub: "Konfidenz-Badge bei jeder KI-Ausgabe sichtbar" },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <p className="text-sm mb-1" style={{ color: "#64748B" }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0F172A" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#94A3B8" }}>{s.sub}</p>
            </div>
          ))}
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {capabilities.map((c, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
              className="p-4 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <span className="text-xl block mb-2">{c.icon}</span>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "#0F172A" }}>{c.title}</h3>
              <p className="text-xs" style={{ color: "#64748B" }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AIShowcaseSection;

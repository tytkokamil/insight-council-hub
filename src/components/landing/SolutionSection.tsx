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
  return <span className="text-3xl font-bold tabular-nums text-destructive" style={{ fontFamily: "var(--font-mono)" }}>€{val.toFixed(2).replace(".", ",")}</span>;
};

const SolutionSection = () => (
  <section id="solution" className="py-24 bg-background">
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-4 text-foreground">Decision Governance. So wie sie sein sollte.</h2>
        <p className="text-lg text-muted-foreground">Fünf Kernfunktionen. Alle implementiert. Sofort einsatzbereit.</p>
      </motion.div>

      {/* Hero feature - dark card */}
      <div className="dark">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="rounded-xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-destructive/30 glass-ultra">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">⏱</span>
              <h3 className="text-xl font-semibold text-foreground">Echtzeit Cost-of-Delay</h3>
              <span className="flex items-center gap-1.5 text-xs text-destructive"><span className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> LIVE</span>
            </div>
            <p className="text-sm leading-relaxed max-w-lg text-muted-foreground">Jede offene Entscheidung zeigt täglich wachsende Verzögerungskosten — berechnet aus Stundensatz × Beteiligte × Tage offen.</p>
          </div>
          <CoDTicker />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.slice(0, 3).map((f, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="rounded-xl p-6 border border-border bg-card magnetic-card">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed mb-4 text-muted-foreground">{f.text}</p>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{f.badge}</span>
          </motion.div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {features.slice(3).map((f, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="rounded-xl p-6 border border-border bg-card magnetic-card">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed mb-4 text-muted-foreground">{f.text}</p>
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{f.badge}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

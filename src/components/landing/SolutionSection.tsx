import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: "⏱", title: "Echtzeit Cost-of-Delay", color: "hsl(38,92%,50%)", desc: "Wie ein Taxi-Meter: Sie sehen buchstäblich wie viel Geld jede offene Entscheidung kostet — jede Sekunde.", tag: "● Live-Berechnung", tagColor: "text-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/10", featured: true },
  { icon: "✓", title: "One-Click Approval", color: "hsl(217,91%,60%)", desc: "Reviewer genehmigen direkt aus der E-Mail — ohne Login. Ein Klick. Aktion dokumentiert. Audit Trail aktualisiert.", tag: "Neu", tagColor: "text-[hsl(217,91%,60%)] bg-[hsl(217,91%,60%)]/10", featured: false },
  { icon: "🤖", title: "KI Daily Brief", color: "hsl(160,60%,45%)", desc: "Jeden Morgen um 07:30 Uhr: Brief mit den 3 kritischsten Entscheidungen, SLA-Warnungen und Economic Exposure.", tag: "KI-gestützt", tagColor: "text-[hsl(160,60%,45%)] bg-[hsl(160,60%,45%)]/10", featured: false },
  { icon: "📋", title: "Cryptographic Audit Trail", color: "hsl(175,84%,32%)", desc: "Jede Aktion unveränderbar dokumentiert — mit kryptographischer Hash-Kette. BaFin, ISO 9001, NIS2: Audit-ready.", tag: "Compliance", tagColor: "text-[hsl(175,84%,32%)] bg-[hsl(175,84%,32%)]/10", featured: false },
  { icon: "🔮", title: "Predictive SLA", color: "hsl(0,84%,60%)", desc: "Das System erkennt SLA-Verletzungen bevor sie passieren — basierend auf dem historischen Verhalten Ihrer Reviewer.", tag: "KI-gestützt", tagColor: "text-[hsl(0,84%,60%)] bg-[hsl(0,84%,60%)]/10", featured: false },
  { icon: "⬡", title: "Branchen-Templates", color: "hsl(263,85%,58%)", desc: "ECO für Maschinenbau, Change Control für Pharma, PPAP für Automotive — branchenspezifisch und sofort nutzbar.", tag: "15 Branchen", tagColor: "text-[hsl(263,85%,58%)] bg-[hsl(263,85%,58%)]/10", featured: false },
];

const SolutionSection = () => (
  <section id="solution" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs font-semibold text-[hsl(217,91%,60%)] mb-4 tracking-[0.2em] uppercase">Die Lösung</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Decision Governance. So wie sie sein sollte.
        </h2>
        <p className="text-[hsl(215,20%,65%)] leading-relaxed">
          Decivio macht jede Entscheidung sichtbar, messbar und compliance-konform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className={`group relative p-6 rounded-2xl border bg-[hsl(216,40%,11%)] transition-all duration-300 ${
              f.featured
                ? "border-[hsl(217,91%,60%)]/30 shadow-[0_0_30px_-8px_hsl(217,91%,60%/0.15)]"
                : "border-white/[0.06] hover:border-white/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{f.icon}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${f.tagColor}`}>{f.tag}</span>
            </div>
            <h3 className="text-[15px] font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-[hsl(215,20%,65%)] leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

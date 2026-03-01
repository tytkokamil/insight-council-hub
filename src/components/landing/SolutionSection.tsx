import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: "⏱", title: "Echtzeit Cost-of-Delay", desc: "Wie ein Taxi-Meter: Sie sehen buchstäblich wie viel Geld jede offene Entscheidung kostet — jede Sekunde.", tag: "● Live-Berechnung", tagBg: "bg-warning/10 text-warning", featured: true },
  { icon: "✓", title: "One-Click Approval", desc: "Reviewer genehmigen direkt aus der E-Mail — ohne Login. Ein Klick. Aktion dokumentiert. Audit Trail aktualisiert.", tag: "Neu", tagBg: "bg-primary/10 text-primary", featured: false },
  { icon: "🤖", title: "KI Daily Brief", desc: "Jeden Morgen um 07:30 Uhr: Brief mit den 3 kritischsten Entscheidungen, SLA-Warnungen und Economic Exposure.", tag: "KI-gestützt", tagBg: "bg-success/10 text-success", featured: false },
  { icon: "📋", title: "Cryptographic Audit Trail", desc: "Jede Aktion unveränderbar dokumentiert — mit kryptographischer Hash-Kette. BaFin, ISO 9001, NIS2: Audit-ready.", tag: "Compliance", tagBg: "bg-accent text-accent-foreground", featured: false },
  { icon: "🔮", title: "Predictive SLA", desc: "Das System erkennt SLA-Verletzungen bevor sie passieren — basierend auf dem historischen Verhalten Ihrer Reviewer.", tag: "KI-gestützt", tagBg: "bg-destructive/10 text-destructive", featured: false },
  { icon: "⬡", title: "Branchen-Templates", desc: "ECO für Maschinenbau, Change Control für Pharma, PPAP für Automotive — branchenspezifisch und sofort nutzbar.", tag: "15 Branchen", tagBg: "bg-[hsl(263,85%,95%)] text-[hsl(263,85%,50%)]", featured: false },
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
        <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Die Lösung</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Decision Governance. So wie sie sein sollte.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
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
            className={`group relative p-6 rounded-2xl border bg-card transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
              f.featured
                ? "border-primary/30 shadow-[0_0_20px_-8px_hsl(217,91%,53%/0.15)]"
                : "border-border hover:border-primary/20"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{f.icon}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${f.tagBg}`}>{f.tag}</span>
            </div>
            <h3 className="text-[15px] font-bold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

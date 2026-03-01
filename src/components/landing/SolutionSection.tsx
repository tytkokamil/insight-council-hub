import { motion } from "framer-motion";
import { Timer, MousePointerClick, Bot, ShieldCheck, LineChart, LayoutTemplate } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: Timer, title: "Echtzeit Cost-of-Delay", desc: "Wie ein Taxi-Meter: Sie sehen wie viel Geld jede offene Entscheidung kostet — jede Sekunde.", tag: "Live", color: "text-warning bg-warning/8" },
  { icon: MousePointerClick, title: "One-Click Approval", desc: "Reviewer genehmigen direkt aus der E-Mail — ohne Login. Ein Klick, dokumentiert.", tag: "Neu", color: "text-primary bg-primary/8" },
  { icon: Bot, title: "KI Daily Brief", desc: "Jeden Morgen: Die 3 kritischsten Entscheidungen, SLA-Warnungen und Economic Exposure.", tag: "KI", color: "text-accent-teal bg-accent/50" },
  { icon: ShieldCheck, title: "Cryptographic Audit Trail", desc: "Jede Aktion unveränderbar dokumentiert — mit kryptographischer Hash-Kette. Audit-ready.", tag: "Compliance", color: "text-accent-violet bg-accent-violet/8" },
  { icon: LineChart, title: "Predictive SLA", desc: "Das System erkennt SLA-Verletzungen bevor sie passieren — basierend auf historischem Verhalten.", tag: "KI", color: "text-destructive bg-destructive/8" },
  { icon: LayoutTemplate, title: "Branchen-Templates", desc: "ECO für Maschinenbau, Change Control für Pharma, PPAP für Automotive — sofort nutzbar.", tag: "15 Branchen", color: "text-muted-foreground bg-muted" },
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="group p-6 rounded-2xl border border-border/60 bg-white/60 backdrop-blur-sm hover:border-border hover:shadow-sm transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
                <f.icon className="w-[18px] h-[18px] text-foreground/60" />
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${f.color}`}>{f.tag}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

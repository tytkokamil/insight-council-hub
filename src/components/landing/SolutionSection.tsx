import { motion } from "framer-motion";
import { Timer, MousePointerClick, Bot, ShieldCheck, LineChart, LayoutTemplate } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: Timer, title: "Echtzeit Cost-of-Delay", desc: "Wie ein Taxi-Meter: Sie sehen wie viel Geld jede offene Entscheidung kostet — jede Sekunde.", tag: "Live", color: "text-[hsl(35,45%,48%)] bg-[hsl(35,45%,48%,0.08)]" },
  { icon: MousePointerClick, title: "One-Click Approval", desc: "Reviewer genehmigen direkt aus der E-Mail — ohne Login. Ein Klick, dokumentiert.", tag: "Neu", color: "text-[hsl(220,45%,50%)] bg-[hsl(220,45%,50%,0.08)]" },
  { icon: Bot, title: "KI Daily Brief", desc: "Jeden Morgen: Die 3 kritischsten Entscheidungen, SLA-Warnungen und Economic Exposure.", tag: "KI", color: "text-[hsl(175,35%,42%)] bg-[hsl(175,35%,42%,0.08)]" },
  { icon: ShieldCheck, title: "Cryptographic Audit Trail", desc: "Jede Aktion unveränderbar dokumentiert — mit kryptographischer Hash-Kette. Audit-ready.", tag: "Compliance", color: "text-[hsl(250,35%,55%)] bg-[hsl(250,35%,55%,0.08)]" },
  { icon: LineChart, title: "Predictive SLA", desc: "Das System erkennt SLA-Verletzungen bevor sie passieren — basierend auf historischem Verhalten.", tag: "KI", color: "text-[hsl(200,40%,48%)] bg-[hsl(200,40%,48%,0.08)]" },
  { icon: LayoutTemplate, title: "Branchen-Templates", desc: "ECO für Maschinenbau, Change Control für Pharma, PPAP für Automotive — sofort nutzbar.", tag: "15 Branchen", color: "text-muted-foreground bg-muted/60" },
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
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase" style={{ color: 'hsl(220 45% 50%)' }}>Die Lösung</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Decision Governance. So wie sie sein sollte.
        </h2>
        <p className="leading-relaxed">
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
            className="group relative p-6 rounded-2xl border border-border/30 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-border/50 hover:shadow-[0_8px_30px_-12px_hsl(220,20%,50%,0.08)] transition-all duration-500"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-[hsl(220,40%,70%,0.02)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center group-hover:bg-[hsl(220,40%,95%)] transition-colors duration-500">
                  <f.icon className="w-[18px] h-[18px] text-muted-foreground group-hover:text-[hsl(220,40%,50%)] transition-colors duration-500" />
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${f.color}`}>{f.tag}</span>
              </div>
              <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
              <p className="text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;

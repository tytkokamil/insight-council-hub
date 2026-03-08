import { motion } from "framer-motion";
import { Timer, MousePointerClick, Bot, ShieldCheck, LineChart, LayoutTemplate } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: MousePointerClick, title: "One-Click Approval", desc: "Reviewer genehmigen direkt aus der E-Mail — ohne Login. Ein Klick, dokumentiert.", tag: "Neu", accent: "accent-blue" },
  { icon: Bot, title: "KI Daily Brief", desc: "Jeden Morgen: Die 3 kritischsten Entscheidungen, SLA-Warnungen und Economic Exposure.", tag: "KI", accent: "accent-teal" },
  { icon: ShieldCheck, title: "Cryptographic Audit Trail", desc: "Jede Aktion unveränderbar dokumentiert — mit kryptographischer Hash-Kette. Audit-ready.", tag: "Compliance", accent: "accent-violet" },
  { icon: LineChart, title: "Predictive SLA", desc: "Das System erkennt SLA-Verletzungen bevor sie passieren — basierend auf historischem Verhalten.", tag: "KI", accent: "accent-blue" },
  { icon: LayoutTemplate, title: "Branchen-Templates", desc: "ECO für Maschinenbau, Change Control für Pharma, PPAP für Automotive — sofort nutzbar.", tag: "15 Branchen", accent: "primary" },
];

const accentMap: Record<string, { icon: string; bg: string; tag: string }> = {
  "accent-blue": { icon: "text-accent-blue", bg: "bg-accent-blue/8", tag: "text-accent-blue bg-accent-blue/10" },
  "accent-teal": { icon: "text-accent-teal", bg: "bg-accent-teal/8", tag: "text-accent-teal bg-accent-teal/10" },
  "accent-violet": { icon: "text-accent-violet", bg: "bg-accent-violet/8", tag: "text-accent-violet bg-accent-violet/10" },
  "primary": { icon: "text-muted-foreground", bg: "bg-muted/50", tag: "text-muted-foreground bg-muted/60" },
};

const SolutionSection = () => (
  <section id="solution" className="py-24 relative overflow-hidden">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">Die Lösung</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Decision Governance. So wie sie sein sollte.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Decivio macht jede Entscheidung sichtbar, messbar und compliance-konform.
        </p>
      </motion.div>

      {/* Hero feature card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
        className="group relative p-8 md:p-10 rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-accent-amber/30 hover:shadow-card-hover transition-all duration-500 mb-4"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-amber/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-amber/8 flex items-center justify-center shrink-0">
            <Timer className="w-7 h-7 text-accent-amber" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold">Echtzeit Cost-of-Delay</h3>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-accent-amber bg-accent-amber/10">Live</span>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
              Wie ein Taxi-Meter für Ihre Entscheidungen: Sie sehen in Echtzeit wie viel Geld jede offene Entscheidung Ihr Unternehmen kostet — jede Sekunde. Das ändert Prioritäten.
            </p>
          </div>
          {/* Animated ticker preview */}
          <motion.div
            className="hidden lg:flex items-center gap-2 px-5 py-3 rounded-xl border border-border/30 bg-muted/10"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
            <span className="font-mono text-lg font-bold tabular-nums text-primary">€12.847</span>
            <span className="text-[10px] text-muted-foreground/50 ml-1">/ heute</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Remaining feature cards — bento grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => {
          const colors = accentMap[f.accent] || accentMap.primary;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              whileHover={{ y: -3 }}
              className="group relative p-6 rounded-2xl border border-border/30 bg-card/70 backdrop-blur-sm hover:bg-card hover:border-border/50 hover:shadow-card-hover transition-all duration-500"
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center transition-colors duration-500`}>
                    <f.icon className={`w-[18px] h-[18px] ${colors.icon} transition-colors duration-500`} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.tag}`}>{f.tag}</span>
                </div>
                <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default SolutionSection;

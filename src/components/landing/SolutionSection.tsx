import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Timer, MousePointerClick, Bot, ShieldCheck, LineChart, LayoutTemplate } from "lucide-react";

const DAILY_COST = 47000 / 30;
const PER_SECOND = DAILY_COST / 86400;

const LiveCodTicker = () => {
  const [value, setValue] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - start.current) / 1000;
      const hoursToday = new Date().getHours() + new Date().getMinutes() / 60;
      const baseCost = (hoursToday / 24) * DAILY_COST;
      setValue(baseCost + elapsed * PER_SECOND);
    }, 100);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      className="hidden lg:flex items-center gap-2 px-5 py-3 rounded-xl border border-destructive/15 bg-destructive/[0.03]"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-2 rounded-full bg-destructive"
      />
      <span className="font-mono text-lg font-bold tabular-nums text-destructive">
        €{value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
      </span>
      <span className="text-[10px] text-muted-foreground ml-1">/ heute</span>
    </motion.div>
  );
};

const ease = [0.16, 1, 0.3, 1] as const;

const features = [
  { icon: MousePointerClick, title: "One-Click Approval aus E-Mail", desc: "Reviewer genehmigen oder lehnen direkt aus der E-Mail ab. Kein Login, kein Portal-Besuch. Token-basiert, DSGVO-konform. Alle Aktionen landen sofort im Audit Trail.", tag: "Ab Starter Plan", accent: "accent-blue" },
  { icon: Bot, title: "KI Daily Brief um 07:30 Uhr", desc: "Jeden Morgen: die 3 kritischsten offenen Entscheidungen, aktuelle SLA-Warnungen und die gesamte Economic Exposure der Organisation. Generiert von Gemini 2.5 Pro. In 30 Sekunden erfassbar.", tag: "Ab Professional Plan", accent: "accent-teal" },
  { icon: ShieldCheck, title: "Kryptographischer Audit Trail", desc: "Jede Änderung, Genehmigung und Ablehnung wird SHA-256-gehasht und unveränderlich verkettet. Kein nachträgliches Bearbeiten möglich. Integritätsverifizierung per Klick.", tag: "Ab Professional Plan", accent: "accent-violet" },
  { icon: LineChart, title: "Predictive SLA Warning", desc: "KI erkennt drohende SLA-Verletzungen bevor sie eintreten — basierend auf historischen Entscheidungsmustern Ihrer Organisation. Proaktive Eskalation statt reaktiver Feuerwehr.", tag: "Ab Professional Plan", accent: "accent-blue" },
  { icon: LayoutTemplate, title: "15 Branchen-Templates", desc: "ECO, PPAP, Change Control, CAPA, MaRisk, ADR, VOB, HACCP — sofort einsatzbereit. Compliance-Pflichtfelder und Review-Flows bereits vorkonfiguriert.", tag: "Alle Pläne", accent: "primary" },
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
          Fünf Kernfunktionen. Alle implementiert. Sofort einsatzbereit.
        </p>
      </motion.div>

      {/* Hero feature card — Cost-of-Delay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
        className="group relative p-8 md:p-10 rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm magnetic-card mb-4 overflow-hidden"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-amber/[0.03] via-transparent to-accent-amber/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-amber/8 flex items-center justify-center shrink-0">
            <Timer className="w-7 h-7 text-accent-amber" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold">⏱ Echtzeit Cost-of-Delay</h3>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-accent-amber bg-accent-amber/10 flex items-center gap-1">
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1 h-1 rounded-full bg-accent-amber inline-block" />
                LIVE
              </span>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
              Jede offene Entscheidung zeigt täglich wachsende Verzögerungskosten — berechnet aus Stundensatz × Beteiligte × Tage offen. Konfigurierbar pro Team. Sichtbar für alle Stakeholder.
            </p>
          </div>
          <LiveCodTicker />
        </div>
      </motion.div>

      {/* Bento feature grid */}
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
              className="magnetic-card group relative p-6 rounded-2xl border border-border/30 bg-card/70 backdrop-blur-sm cursor-default overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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

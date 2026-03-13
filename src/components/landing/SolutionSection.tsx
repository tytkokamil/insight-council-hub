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
      className="hidden lg:flex items-center gap-3 px-6 py-4 rounded-2xl border border-destructive/15 bg-destructive/[0.03]"
      style={{ backdropFilter: "blur(12px)" }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2.5 h-2.5 rounded-full bg-destructive"
      />
      <span
        className="font-mono text-xl font-bold tabular-nums"
        style={{
          background: "linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--accent-rose)))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
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
  <section id="solution" className="py-28 relative overflow-hidden">
    <div className="absolute inset-0 mesh-gradient opacity-20 pointer-events-none" />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="text-center max-w-2xl mx-auto mb-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-primary tracking-[0.15em] uppercase">Die Lösung</span>
        </motion.div>
        <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-[-0.04em] mb-5 leading-[1.1]">
          Decision Governance. So wie sie sein sollte.
        </h2>
        <p className="text-[16px] text-muted-foreground leading-relaxed">
          Fünf Kernfunktionen. Alle implementiert. Sofort einsatzbereit.
        </p>
      </motion.div>

      {/* Hero feature card — Cost-of-Delay */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        whileHover={{ y: -3, transition: { duration: 0.25 } }}
        className="spotlight-card card-shine group relative p-8 md:p-10 rounded-2xl border border-border/20 bg-card/70 mb-5 overflow-hidden"
        style={{ backdropFilter: "blur(16px)" }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
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
            <p className="text-[15px] text-muted-foreground leading-[1.7] max-w-2xl">
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
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="spotlight-card card-shine group relative p-7 rounded-2xl border border-border/20 bg-card/60 cursor-default overflow-hidden"
              style={{ backdropFilter: "blur(12px)" }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center transition-colors duration-500`}>
                    <f.icon className={`w-5 h-5 ${colors.icon} transition-colors duration-500`} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${colors.tag}`}>{f.tag}</span>
                </div>
                <h3 className="text-[16px] font-bold mb-2.5">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-[1.7]">{f.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default SolutionSection;

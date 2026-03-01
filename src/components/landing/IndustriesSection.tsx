import { motion } from "framer-motion";
import { Factory, Pill, Car, Landmark, Monitor, HardHat, Zap, HeartPulse } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const industries = [
  { icon: Factory, name: "Maschinenbau", desc: "ECOs, Projektfreigaben, Maschinenabnahmen", focus: true },
  { icon: Pill, name: "Pharma", desc: "Change Control, CAPA, Batch-Freigaben", focus: false },
  { icon: Car, name: "Automotive", desc: "PPAP, 8D-Reports, Änderungsmanagement", focus: false },
  { icon: Landmark, name: "Finanzdienstleister", desc: "Kreditentscheidungen, Compliance", focus: false },
  { icon: Monitor, name: "IT & Software", desc: "ADRs, Release-Freigaben, Security", focus: false },
  { icon: HardHat, name: "Bau", desc: "Nachträge, Subunternehmer, Abnahmen", focus: false },
  { icon: Zap, name: "Energie", desc: "Netzinvestitionen, KRITIS, NIS2", focus: false },
  { icon: HeartPulse, name: "Healthcare", desc: "Geräteinvestitionen, Protokolländerungen", focus: false },
];

const IndustriesSection = () => (
  <section id="industries" className="py-24 relative bg-muted/30">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Branchen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Für jede Branche die richtige Sprache.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Decivio passt sich Ihrer Branche an — Terminologie, Templates, Compliance-Anforderungen.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {industries.map((ind, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className={`relative p-5 rounded-xl border bg-card transition-colors duration-200 ${
              ind.focus ? "border-primary/30 shadow-sm" : "border-border hover:border-primary/20"
            }`}
          >
            {ind.focus && (
              <span className="absolute top-3 right-3 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wider uppercase">Fokus</span>
            )}
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
              <ind.icon className="w-4 h-4 text-foreground/60" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{ind.name}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{ind.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default IndustriesSection;
import { motion } from "framer-motion";
import { Factory, Pill, Car, Landmark, Monitor, HardHat, Zap, HeartPulse } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const industries = [
  { icon: Factory, name: "Maschinenbau", desc: "ECOs, Projektfreigaben, Maschinenabnahmen" },
  { icon: Pill, name: "Pharma", desc: "Change Control, CAPA, Batch-Freigaben" },
  { icon: Car, name: "Automotive", desc: "PPAP, 8D-Reports, Änderungsmanagement" },
  { icon: Landmark, name: "Finanzdienstleister", desc: "Kreditentscheidungen, Compliance" },
  { icon: Monitor, name: "IT & Software", desc: "ADRs, Release-Freigaben, Security" },
  { icon: HardHat, name: "Bau", desc: "Nachträge, Subunternehmer, Abnahmen" },
  { icon: Zap, name: "Energie", desc: "Netzinvestitionen, KRITIS, NIS2" },
  { icon: HeartPulse, name: "Healthcare", desc: "Geräteinvestitionen, Protokolländerungen" },
];

const IndustriesSection = () => (
  <section id="industries" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
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
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.5, ease }}
            className="p-5 rounded-xl border border-border/50 bg-white/60 backdrop-blur-sm hover:border-border hover:shadow-sm transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center mb-3">
              <ind.icon className="w-4 h-4 text-foreground/50" />
            </div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">{ind.name}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{ind.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default IndustriesSection;

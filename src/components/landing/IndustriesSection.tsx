import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const industries = [
  { icon: "🏭", name: "Maschinenbau", desc: "ECOs, Projektfreigaben, Maschinenabnahmen", focus: true },
  { icon: "💊", name: "Pharma", desc: "Change Control, CAPA, Batch-Freigaben", focus: false },
  { icon: "🚗", name: "Automotive", desc: "PPAP, 8D-Reports, Änderungsmanagement", focus: false },
  { icon: "🏦", name: "Finanzdienstleister", desc: "Kreditentscheidungen, Compliance", focus: false },
  { icon: "💻", name: "IT & Software", desc: "ADRs, Release-Freigaben, Security", focus: false },
  { icon: "🏗️", name: "Bau", desc: "Nachträge, Subunternehmer, Abnahmen", focus: false },
  { icon: "⚡", name: "Energie", desc: "Netzinvestitionen, KRITIS, NIS2", focus: false },
  { icon: "🏥", name: "Healthcare", desc: "Geräteinvestitionen, Protokolländerungen", focus: false },
];

const IndustriesSection = () => (
  <section id="industries" className="py-24 relative">
    <div className="absolute inset-0 bg-white/[0.01]" />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <p className="text-xs font-semibold text-[hsl(217,91%,60%)] mb-4 tracking-[0.2em] uppercase">Branchen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Für jede Branche die richtige Sprache.
        </h2>
        <p className="text-[hsl(215,20%,65%)] leading-relaxed">
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
            className={`relative p-5 rounded-xl border bg-[hsl(216,40%,11%)] cursor-default transition-all duration-200 hover:border-white/[0.15] ${
              ind.focus ? "border-[hsl(217,91%,60%)]/30" : "border-white/[0.06]"
            }`}
          >
            {ind.focus && (
              <span className="absolute top-3 right-3 text-[9px] font-bold text-[hsl(217,91%,60%)] bg-[hsl(217,91%,60%)]/10 px-2 py-0.5 rounded-full tracking-wider uppercase">Fokus</span>
            )}
            <span className="text-2xl block mb-3">{ind.icon}</span>
            <h3 className="text-sm font-semibold text-white mb-1">{ind.name}</h3>
            <p className="text-[12px] text-[hsl(215,16%,47%)] leading-relaxed">{ind.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default IndustriesSection;

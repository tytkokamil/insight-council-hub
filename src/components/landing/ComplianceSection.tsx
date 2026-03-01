import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const pills = ["NIS2", "ISO 9001", "IATF 16949", "GMP / FDA 21 CFR Part 11", "MaRisk", "DSGVO", "VOB/VgV", "Solvency II", "EU AI Act"];

const frameworks = [
  { name: "NIS2", color: "hsl(0,84%,60%)", desc: "Dokumentierte Entscheidungsprozesse für kritische Infrastrukturen — mit Nachweiskette und Eskalationsprotokoll.", badge: "Kritisch" },
  { name: "ISO 9001", color: "hsl(263,85%,58%)", desc: "Qualitätsmanagement-Entscheidungen vollständig dokumentiert — Change Requests, Korrekturmaßnahmen, Freigaben.", badge: "Qualität" },
  { name: "IATF 16949", color: "hsl(217,91%,60%)", desc: "PPAP-Freigaben, 8D-Reports und Änderungsmanagement mit lückenlosem Audit Trail.", badge: "Automotive" },
  { name: "GMP", color: "hsl(160,60%,45%)", desc: "Batch-Freigaben, Change Control und CAPA-Entscheidungen FDA-konform dokumentiert.", badge: "Pharma" },
  { name: "MaRisk", color: "hsl(38,92%,50%)", desc: "Kreditentscheidungen, Risikoakzeptanz und Compliance-Freigaben revisionssicher nachweisen.", badge: "Finanzen" },
  { name: "DSGVO", color: "hsl(175,84%,32%)", desc: "Datenverarbeitungs-Entscheidungen, TOM-Änderungen und Löschanfragen rechtskonform protokollieren.", badge: "Datenschutz" },
];

const ComplianceSection = () => (
  <section id="compliance" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <p className="text-xs font-semibold text-[hsl(175,84%,32%)] mb-4 tracking-[0.2em] uppercase">Compliance</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Kein Audit mehr ohne Decivio.
        </h2>
        <p className="text-[hsl(215,20%,65%)] leading-relaxed">
          Regulatorische Anforderungen sind keine Option. Decivio macht Compliance zur Nebensache.
        </p>
      </motion.div>

      {/* Pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="flex flex-wrap items-center justify-center gap-2 mb-14"
      >
        {pills.map((pill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border border-[hsl(175,84%,32%)]/20 bg-[hsl(175,84%,32%)]/[0.06] text-[hsl(175,84%,32%)] cursor-default"
          >
            ✓ {pill}
          </span>
        ))}
      </motion.div>

      {/* Framework cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((fw, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="p-6 rounded-2xl border border-white/[0.06] bg-[hsl(216,40%,11%)] hover:border-white/[0.12] transition-all"
          >
            <span
              className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-4 tracking-wide uppercase"
              style={{ color: fw.color, backgroundColor: `${fw.color}15` }}
            >
              {fw.badge}
            </span>
            <h3 className="text-[15px] font-bold text-white mb-2">{fw.name}</h3>
            <p className="text-sm text-[hsl(215,20%,65%)] leading-relaxed mb-3">{fw.desc}</p>
            <button className="text-xs font-medium text-[hsl(217,91%,60%)] hover:underline">
              Vorlage ansehen →
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ComplianceSection;

import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const pills = ["NIS2", "ISO 9001", "IATF 16949", "GMP / FDA", "MaRisk", "DSGVO", "VOB/VgV", "Solvency II", "EU AI Act"];

const frameworks = [
  { name: "NIS2", desc: "Dokumentierte Entscheidungsprozesse für kritische Infrastrukturen.", badge: "Kritisch", badgeColor: "text-destructive bg-destructive/10" },
  { name: "ISO 9001", desc: "Qualitätsmanagement-Entscheidungen vollständig dokumentiert.", badge: "Qualität", badgeColor: "text-accent-violet bg-accent-violet/10" },
  { name: "IATF 16949", desc: "PPAP-Freigaben und Änderungsmanagement mit Audit Trail.", badge: "Automotive", badgeColor: "text-accent-blue bg-accent-blue/10" },
  { name: "GMP", desc: "Batch-Freigaben und Change Control FDA-konform dokumentiert.", badge: "Pharma", badgeColor: "text-accent-teal bg-accent-teal/10" },
  { name: "MaRisk", desc: "Kreditentscheidungen und Risikoakzeptanz revisionssicher.", badge: "Finanzen", badgeColor: "text-accent-amber bg-accent-amber/10" },
  { name: "DSGVO", desc: "Datenverarbeitungs-Entscheidungen rechtskonform protokollieren.", badge: "Datenschutz", badgeColor: "text-accent-teal bg-accent-teal/10" },
];

const ComplianceSection = () => (
  <section id="compliance" className="py-24 relative bg-muted/15">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">Compliance</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Kein Audit mehr ohne Decivio.
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Regulatorische Anforderungen sind keine Option. Decivio macht Compliance zur Nebensache.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="flex flex-wrap items-center justify-center gap-2 mb-14"
      >
        {pills.map((pill, i) => (
          <span key={i} className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-border/30 bg-card/60 text-muted-foreground">
            ✓ {pill}
          </span>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((fw, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="p-6 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-border/50 hover:shadow-card-hover transition-all duration-200"
          >
            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-4 tracking-wide uppercase ${fw.badgeColor}`}>
              {fw.badge}
            </span>
            <h3 className="text-[15px] font-semibold mb-2">{fw.name}</h3>
            <p className="text-[13px] leading-relaxed">{fw.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ComplianceSection;

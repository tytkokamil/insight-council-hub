import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const pills = ["NIS2", "ISO 9001", "IATF 16949", "GMP / FDA", "MaRisk", "DSGVO", "VOB/VgV", "Solvency II", "EU AI Act"];

const frameworks = [
  { name: "NIS2", desc: "Dokumentierte Entscheidungsprozesse für kritische Infrastrukturen.", badge: "Kritisch", badgeColor: "text-destructive bg-destructive/8" },
  { name: "ISO 9001", desc: "Qualitätsmanagement-Entscheidungen vollständig dokumentiert.", badge: "Qualität", badgeColor: "text-accent-violet bg-accent-violet/8" },
  { name: "IATF 16949", desc: "PPAP-Freigaben und Änderungsmanagement mit Audit Trail.", badge: "Automotive", badgeColor: "text-primary bg-primary/8" },
  { name: "GMP", desc: "Batch-Freigaben und Change Control FDA-konform dokumentiert.", badge: "Pharma", badgeColor: "text-success bg-success/8" },
  { name: "MaRisk", desc: "Kreditentscheidungen und Risikoakzeptanz revisionssicher.", badge: "Finanzen", badgeColor: "text-warning bg-warning/8" },
  { name: "DSGVO", desc: "Datenverarbeitungs-Entscheidungen rechtskonform protokollieren.", badge: "Datenschutz", badgeColor: "text-accent-teal bg-accent/50" },
];

const ComplianceSection = () => (
  <section id="compliance" className="py-24 relative bg-muted/20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-10"
      >
        <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Compliance</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Kein Audit mehr ohne Decivio.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
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
          <span key={i} className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-border/50 bg-white/60 text-muted-foreground">
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
            className="p-6 rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm hover:border-border hover:shadow-sm transition-all duration-200"
          >
            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-4 tracking-wide uppercase ${fw.badgeColor}`}>
              {fw.badge}
            </span>
            <h3 className="text-[15px] font-semibold text-foreground mb-2">{fw.name}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{fw.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ComplianceSection;

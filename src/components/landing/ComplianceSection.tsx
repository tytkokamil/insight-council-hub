import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const pills = ["NIS2", "ISO 9001", "IATF 16949", "GMP/FDA 21 CFR", "MaRisk", "DSGVO", "VOB/B", "Solvency II", "EU AI Act"];

const frameworks = [
  { name: "NIS2", badge: "KRITISCH", badgeColor: "text-destructive bg-destructive/10", title: "NIS2 — Nachweispflicht für Sicherheitsentscheidungen", desc: "NIS2 Art. 21 verlangt dokumentierte Maßnahmen zur Cybersicherheit. Decivio protokolliert alle Sicherheitsentscheidungen im SHA-256 Audit Trail — nachweisbar gegenüber BSI und Behörden." },
  { name: "ISO 9001:2015", badge: "Qualität", badgeColor: "text-accent-violet bg-accent-violet/10", title: "ISO 9001 — Kapitel 7.5 automatisch erfüllt", desc: "Kapitel 7.5 fordert Lenkung und Aufbewahrung dokumentierter Information. Jede Entscheidung in Decivio ist mit Begründung, Alternativen, Genehmiger und Zeitstempel versehen — exportierbar für jeden Auditor." },
  { name: "IATF 16949", badge: "Automotive", badgeColor: "text-accent-blue bg-accent-blue/10", title: "IATF 16949 — PPAP und Änderungsmanagement", desc: "Produktionsprozess-Freigaben, PPAP-Level 1–5 und Engineering Change Orders als vorkonfigurierte Workflow-Templates. Lieferanten ohne Account als externe Reviewer." },
  { name: "GMP / FDA 21 CFR Part 11", badge: "Pharma", badgeColor: "text-accent-teal bg-accent-teal/10", title: "GMP — Elektronische Aufzeichnungen mit Integritätsnachweis", desc: "21 CFR Part 11 verlangt elektronische Signaturen und Audit Trails. Decivios SHA-256 Hash-Chain erfüllt die Integritätsanforderungen. Change Control und Batch-Freigaben als Templates." },
  { name: "MaRisk (BaFin)", badge: "Finanzen", badgeColor: "text-accent-amber bg-accent-amber/10", title: "MaRisk — Vier-Augen-Prinzip technisch erzwungen", desc: "Sequential Review Workflow erzwingt das Vier-Augen-Prinzip für Kreditentscheidungen und Risikoakzeptanzen. Vollständige BaFin-ready Dokumentation. Revisionssicher." },
  { name: "DSGVO", badge: "Datenschutz", badgeColor: "text-accent-teal bg-accent-teal/10", title: "DSGVO — AVV inklusive, Art. 17 und 20 umgesetzt", desc: "Auftragsverarbeitungsvertrag in allen Plänen inklusive. Datenexport nach Art. 20 und vollständige Account-Löschung nach Art. 17 auf Knopfdruck. Server in Deutschland (Frankfurt)." },
];

const ComplianceSection = () => (
  <section id="compliance" className="py-28 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20 pointer-events-none" />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-primary tracking-[0.15em] uppercase">Compliance</span>
        </motion.div>
        <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-[-0.04em] mb-5 leading-[1.1]">
          Kein Audit mehr ohne Decivio.
        </h2>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          9 Compliance-Frameworks. Konfigurierbar. Audit-Pakete in einem Klick.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5, ease }}
        className="flex flex-wrap items-center justify-center gap-2 mb-16 overflow-x-auto"
      >
        {pills.map((pill, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            className="text-[12px] font-medium px-4 py-2 rounded-xl border border-border/30 bg-card/60 text-muted-foreground whitespace-nowrap hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-default"
          >
            ✓ {pill}
          </motion.span>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frameworks.map((fw, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="group p-7 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm hover:border-border/50 hover:shadow-card-hover transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mb-5 tracking-wide uppercase ${fw.badgeColor}`}>
              {fw.badge}
            </span>
            <h3 className="text-[15px] font-bold mb-3">{fw.title}</h3>
            <p className="text-[13px] leading-[1.7] text-muted-foreground">{fw.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ComplianceSection;

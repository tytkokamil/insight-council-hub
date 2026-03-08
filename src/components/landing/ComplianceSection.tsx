import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const pills = ["NIS2", "ISO 9001", "IATF 16949", "GMP/FDA 21 CFR", "MaRisk", "DSGVO", "VOB/B", "Solvency II", "EU AI Act"];
const frameworks = [
  { name: "NIS2", critical: true, headline: "NIS2 — Nachweispflicht für Sicherheitsentscheidungen", text: "NIS2 Art. 21 verlangt dokumentierte Maßnahmen zur Cybersicherheit. Decivio protokolliert alle Sicherheitsentscheidungen im SHA-256 Audit Trail." },
  { name: "ISO 9001:2015", headline: "ISO 9001 — Kapitel 7.5 automatisch erfüllt", text: "Kapitel 7.5 fordert Lenkung dokumentierter Information. Jede Entscheidung in Decivio ist mit Begründung, Alternativen und Zeitstempel versehen." },
  { name: "IATF 16949", headline: "IATF 16949 — PPAP und Änderungsmanagement", text: "PPAP-Level 1–5 und Engineering Change Orders als vorkonfigurierte Workflow-Templates. Lieferanten ohne Account als externe Reviewer." },
  { name: "GMP", headline: "GMP — Elektronische Aufzeichnungen mit Integritätsnachweis", text: "21 CFR Part 11 verlangt elektronische Unterschriften und Audit Trails. Decivios SHA-256 Hash-Chain erfüllt die Integritätsanforderungen." },
  { name: "MaRisk", headline: "MaRisk — Vier-Augen-Prinzip technisch erzwungen", text: "Sequential Review Workflow erzwingt das Vier-Augen-Prinzip für Kreditentscheidungen. Vollständige BaFin-ready Dokumentation." },
  { name: "DSGVO", headline: "DSGVO — AVV inklusive, Art. 17 und 20 umgesetzt", text: "AVV in allen Plänen inklusive. Datenexport nach Art. 20 und vollständige Löschung nach Art. 17. Server in Deutschland." },
];

const ComplianceSection = () => (
  <section className="dark">
    <div className="py-24 bg-background relative overflow-hidden">
      <div className="aurora-bg" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-4 text-foreground">Kein Audit mehr ohne Decivio.</h2>
          <p className="text-lg text-muted-foreground">9 Compliance-Frameworks. Konfigurierbar. Audit-Pakete in einem Klick.</p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {pills.map(p => <span key={p} className="px-3 py-1 rounded-full text-sm bg-card border border-border text-muted-foreground">{p}</span>)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworks.map((f, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
              className="rounded-xl p-6 glass-ultra magnetic-card">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground">{f.headline}</h3>
                {f.critical && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">KRITISCH</span>}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ComplianceSection;

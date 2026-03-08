import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const DARK_TEXTURE = `radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.08) 0%, transparent 60%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
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
  <section className="py-24" style={{ background: "#0F1729", backgroundImage: DARK_TEXTURE }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#F1F5F9" }}>Kein Audit mehr ohne Decivio.</h2>
        <p className="text-lg" style={{ color: "#94A3B8" }}>9 Compliance-Frameworks. Konfigurierbar. Audit-Pakete in einem Klick.</p>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {pills.map(p => <span key={p} className="px-3 py-1 rounded-full text-sm" style={{ background: "#1E293B", border: "1px solid #334155", color: "#94A3B8" }}>{p}</span>)}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frameworks.map((f, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="rounded-xl p-6" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155" }}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{f.headline}</h3>
              {f.critical && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>KRITISCH</span>}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{f.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ComplianceSection;

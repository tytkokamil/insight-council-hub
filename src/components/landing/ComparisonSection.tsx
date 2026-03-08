import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const rows = [
  { label: "Primärer Zweck", excel: "Tabellen", monday: "Projektmgt.", jira: "Dev-Ticketing", sap: "ERP", decivio: "Decision Governance" },
  { label: "Echtzeit CoD-Ticker", excel: "✗", monday: "✗", jira: "✗", sap: "✗", decivio: "✅" },
  { label: "SHA-256 Audit Trail", excel: "✗", monday: "✗", jira: "✗", sap: "~ Modul", decivio: "✅ inklusive" },
  { label: "One-Click E-Mail Approval", excel: "✗", monday: "~ App-Link", jira: "~ App-Link", sap: "✗", decivio: "✅ kein Login" },
  { label: "KI Daily Brief", excel: "✗", monday: "✗", jira: "✗", sap: "✗", decivio: "✅" },
  { label: "DE Compliance-Templates", excel: "✗", monday: "✗", jira: "✗", sap: "~ teuer", decivio: "✅ 15 Branchen" },
  { label: "Externe Reviewer", excel: "✗", monday: "✗", jira: "✗", sap: "✗", decivio: "✅" },
  { label: "Für Mittelstand", excel: "~", monday: "~", jira: "✗", sap: "✗", decivio: "✅" },
  { label: "Setup", excel: "sofort", monday: "1–3 Tage", jira: "Wochen", sap: "Monate", decivio: "3 Minuten" },
];

const ComparisonSection = () => (
  <section className="py-24" style={{ background: "#FFFFFF" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
        <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Decision Governance ist keine Funktion. Es ist eine Kategorie.</h2>
        <p className="text-base" style={{ color: "#64748B" }}>Bestehende Tools lösen andere Probleme — sie wurden nicht für Decision Governance gebaut.</p>
      </motion.div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "700px" }}>
          <thead><tr>
            <th className="text-left py-3 px-3 font-medium" style={{ color: "#64748B" }}></th>
            {["Excel", "Monday.com", "Jira", "SAP"].map(h => <th key={h} className="py-3 px-3 font-medium" style={{ color: "#64748B" }}>{h}</th>)}
            <th className="py-3 px-3 font-semibold" style={{ color: "#EF4444", background: "#FEF2F2", borderLeft: "3px solid #EF4444" }}>Decivio</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                <td className="py-3 px-3 font-medium" style={{ color: "#0F172A" }}>{r.label}</td>
                <td className="py-3 px-3 text-center" style={{ color: "#64748B" }}>{r.excel}</td>
                <td className="py-3 px-3 text-center" style={{ color: "#64748B" }}>{r.monday}</td>
                <td className="py-3 px-3 text-center" style={{ color: "#64748B" }}>{r.jira}</td>
                <td className="py-3 px-3 text-center" style={{ color: "#64748B" }}>{r.sap}</td>
                <td className="py-3 px-3 text-center font-semibold" style={{ color: "#0F172A", background: "#FEF2F2", borderLeft: "3px solid #EF4444" }}>{r.decivio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-4" style={{ color: "#94A3B8" }}>✅ = Nativ | ~ = Eingeschränkt | ✗ = Nicht vorhanden</p>
      <p className="text-sm mt-4 italic leading-relaxed" style={{ color: "#64748B" }}>Decivio ist das einzige Tool das Echtzeit-Kostentransparenz, deutsche Compliance-Anforderungen und One-Click-Approval in einer Plattform für den Mittelstand kombiniert.</p>
    </div>
  </section>
);

export default ComparisonSection;

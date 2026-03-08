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
  <section className="py-24 bg-background">
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
        <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold mb-4 text-foreground">Decision Governance ist keine Funktion. Es ist eine Kategorie.</h2>
        <p className="text-base text-muted-foreground">Bestehende Tools lösen andere Probleme — sie wurden nicht für Decision Governance gebaut.</p>
      </motion.div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "700px" }}>
          <thead><tr>
            <th className="text-left py-3 px-3 font-medium text-muted-foreground"></th>
            {["Excel", "Monday.com", "Jira", "SAP"].map(h => <th key={h} className="py-3 px-3 font-medium text-muted-foreground">{h}</th>)}
            <th className="py-3 px-3 font-semibold text-destructive bg-destructive/5 border-l-[3px] border-l-destructive">Decivio</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-3 px-3 font-medium text-foreground">{r.label}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{r.excel}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{r.monday}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{r.jira}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{r.sap}</td>
                <td className="py-3 px-3 text-center font-semibold text-foreground bg-destructive/5 border-l-[3px] border-l-destructive">{r.decivio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-4 text-muted-foreground">✅ = Nativ | ~ = Eingeschränkt | ✗ = Nicht vorhanden</p>
      <p className="text-sm mt-4 italic leading-relaxed text-muted-foreground">Decivio ist das einzige Tool das Echtzeit-Kostentransparenz, deutsche Compliance-Anforderungen und One-Click-Approval in einer Plattform für den Mittelstand kombiniert.</p>
    </div>
  </section>
);

export default ComparisonSection;

import React from "react";
import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type CellValue = "✅" | "✗" | "~";

const rows: { label: string; values: CellValue[] }[] = [
  { label: "Primärer Zweck", values: ["✗", "✗", "✗", "✗", "✅"] },
  { label: "Echtzeit CoD-Ticker", values: ["✗", "✗", "✗", "✗", "✅"] },
  { label: "SHA-256 Audit Trail", values: ["✗", "✗", "✗", "~", "✅"] },
  { label: "One-Click E-Mail Approval", values: ["✗", "~", "~", "✗", "✅"] },
  { label: "KI Daily Brief", values: ["✗", "✗", "✗", "✗", "✅"] },
  { label: "DE Compliance-Templates", values: ["✗", "✗", "✗", "~", "✅"] },
  { label: "Externe Reviewer ohne Account", values: ["✗", "✗", "✗", "✗", "✅"] },
  { label: "Für Mittelstand optimiert", values: ["~", "~", "✗", "✗", "✅"] },
  { label: "Setup-Zeit", values: ["✗", "✗", "✗", "✗", "✅"] },
];

const purposeLabels = ["Tabellen", "Projektmgt.", "Dev-Ticketing", "ERP", "Decision Governance"];
const setupLabels = ["sofort", "1–3 Tage", "Wochen", "Monate + €€€", "3 Minuten"];

const tools = ["Excel", "Monday.com", "Jira", "SAP", "Decivio"];

const CellIcon = ({ value, isDecivio }: { value: CellValue; isDecivio: boolean }) => {
  if (value === "✅") return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDecivio ? "bg-primary/10 text-primary" : "bg-success/10 text-success"}`}>
      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
    </div>
  );
  if (value === "~") return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-warning/10 text-warning">
      <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
    </div>
  );
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground/50">
      <X className="w-3 h-3" />
    </div>
  );
};

const ComparisonSection = React.memo(() => (
  <section id="comparison" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/10" />
    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-primary">Vergleich</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Decision Governance ist keine Funktion. Es ist eine Kategorie.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Bestehende Tools lösen andere Probleme — sie wurden nicht für Decision Governance gebaut.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.7, ease }}
        className="rounded-2xl border border-border/40 bg-background/80 backdrop-blur-sm overflow-x-auto shadow-sm -mx-4 sm:mx-0"
      >
        {/* Header */}
        <div className="grid grid-cols-[160px_repeat(5,1fr)] items-center border-b border-border/30 px-4 py-4 bg-muted/30 min-w-[600px]">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider" />
          {tools.map((tool, i) => (
            <div key={tool} className="text-center">
              <span className={`text-xs font-semibold ${i === 4 ? "text-primary" : "text-muted-foreground/70"}`}>
                {tool}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`grid grid-cols-[160px_repeat(5,1fr)] items-center px-4 py-3 min-w-[600px] ${
              ri < rows.length - 1 ? "border-b border-border/15" : ""
            } hover:bg-primary/[0.02] transition-colors`}
          >
            <span className="text-[13px]">{row.label}</span>
            {row.values.map((val, ci) => {
              // Special first and last row
              if (ri === 0) {
                return (
                  <div key={ci} className="text-center">
                    <span className={`text-[11px] font-medium ${ci === 4 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {purposeLabels[ci]}
                    </span>
                  </div>
                );
              }
              if (ri === rows.length - 1) {
                return (
                  <div key={ci} className="text-center">
                    <span className={`text-[11px] font-medium ${ci === 4 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {setupLabels[ci]}
                    </span>
                  </div>
                );
              }
              return (
                <div key={ci} className="flex justify-center">
                  <CellIcon value={val} isDecivio={ci === 4} />
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Legend */}
      <p className="text-[11px] text-muted-foreground mt-4 text-center">
        ✅ = Nativ &nbsp; ~ = Eingeschränkt oder extra kostenpflichtig &nbsp; ✗ = Nicht vorhanden
      </p>

      {/* Footnote */}
      <p className="text-[11px] text-muted-foreground/60 mt-4 text-center italic max-w-3xl mx-auto leading-relaxed">
        Monday.com und Jira haben Approval-Workflows — aber keinen Decision-Governance-Fokus, keine CoD-Visibility und keine deutschen Compliance-Templates. SAP bietet Compliance-Module, aber erst nach einem mehrmonatigen Implementierungsprojekt. Decivio ist das einzige Tool das Echtzeit-Kostentransparenz, deutsche Compliance und One-Click-Approval in einer Plattform für den Mittelstand kombiniert.
      </p>
    </div>
  </section>
));

ComparisonSection.displayName = "ComparisonSection";

export default ComparisonSection;

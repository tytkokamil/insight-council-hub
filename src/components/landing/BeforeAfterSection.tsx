import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const withoutSteps = [
  { day: "Tag 1", icon: "📧", title: "E-Mail an 5 Personen gesendet", sub: "Kein Tracking. Kein Fälligkeitsdatum." },
  { day: "Tag 3", icon: "⏳", title: "Kein Feedback eingegangen", sub: "Manuelles Follow-up per WhatsApp nötig.\nKontext geht in E-Mail-Threads verloren." },
  { day: "Tag 6", icon: "✓", title: "Entscheidung irgendwie gefallen", sub: "Begründung nicht dokumentiert.\nAlternativen nicht festgehalten." },
  { day: "Audit", icon: "❌", title: "Prüfer fragt nach Dokumentation", sub: "Nicht vorhanden. Nacharbeit erforderlich." },
];

const withSteps = [
  { day: "Tag 1", icon: "✅", title: "Entscheidung angelegt, SLA startet", sub: "CoD-Ticker läuft. Reviewer automatisch\nper E-Mail benachrichtigt." },
  { day: "Tag 1", icon: "✅", title: "Reviewer genehmigt per One-Click", sub: "Direkt aus E-Mail. Kein Login nötig.\nAudit Trail: vollständig, SHA-256." },
  { day: "Tag 1", icon: "✅", title: "Entscheidung implementiert", sub: "Begründung, Alternativen, Genehmigung —\nalles dokumentiert." },
  { day: "Audit", icon: "✅", title: "Export als PDF — ein Klick", sub: "ISO 9001 Kap. 7.5 erfüllt." },
];

const BeforeAfterSection = () => (
  <section className="py-24 bg-muted/30">
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-4 text-foreground">
          Eine Entscheidung. Zwei Realitäten.
        </h2>
        <p className="text-lg text-muted-foreground">Lieferantenwechsel. Maschinenbau. 5 Beteiligte.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Without */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="bg-card rounded-xl overflow-hidden border-t-[3px] border-t-destructive shadow-[var(--shadow-card)]">
          <div className="px-6 py-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-destructive-foreground bg-destructive">OHNE DECIVIO</span>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {withoutSteps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono font-semibold w-12 flex-shrink-0 pt-0.5 text-muted-foreground">{s.day}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{s.icon}</span>
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                  </div>
                  <p className="text-xs whitespace-pre-line text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 text-sm font-semibold text-destructive border-t border-border">
              6 Tage Laufzeit · 0% dokumentiert
            </div>
          </div>
        </motion.div>

        {/* With */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="bg-card rounded-xl overflow-hidden border-t-[3px] border-t-success shadow-[var(--shadow-card)]">
          <div className="px-6 py-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-success-foreground bg-success">MIT DECIVIO</span>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {withSteps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono font-semibold w-12 flex-shrink-0 pt-0.5 text-muted-foreground">{s.day}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{s.icon}</span>
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                  </div>
                  <p className="text-xs whitespace-pre-line text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 text-sm font-semibold text-success border-t border-border">
              1 Tag Laufzeit · 100% dokumentiert
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mt-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-destructive-foreground px-6 py-3 rounded-lg min-h-[48px] bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20">
          Den Unterschied selbst erleben →
        </Link>
      </motion.div>
    </div>
  </section>
);

export default BeforeAfterSection;

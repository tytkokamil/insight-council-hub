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
  <section className="py-24" style={{ background: "#F8FAFC" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>
          Eine Entscheidung. Zwei Realitäten.
        </h2>
        <p className="text-lg" style={{ color: "#64748B" }}>Lieferantenwechsel. Maschinenbau. 5 Beteiligte.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Without */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="bg-white rounded-xl overflow-hidden" style={{ borderTop: "3px solid #EF4444" }}>
          <div className="px-6 py-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: "#EF4444" }}>OHNE DECIVIO</span>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {withoutSteps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono font-semibold w-12 flex-shrink-0 pt-0.5" style={{ color: "#94A3B8" }}>{s.day}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{s.icon}</span>
                    <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{s.title}</span>
                  </div>
                  <p className="text-xs whitespace-pre-line" style={{ color: "#94A3B8" }}>{s.sub}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 text-sm font-semibold" style={{ borderTop: "1px solid #E2E8F0", color: "#EF4444" }}>
              6 Tage Laufzeit · 0% dokumentiert
            </div>
          </div>
        </motion.div>

        {/* With */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="bg-white rounded-xl overflow-hidden" style={{ borderTop: "3px solid #22C55E" }}>
          <div className="px-6 py-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: "#22C55E" }}>MIT DECIVIO</span>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {withSteps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs font-mono font-semibold w-12 flex-shrink-0 pt-0.5" style={{ color: "#94A3B8" }}>{s.day}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{s.icon}</span>
                    <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{s.title}</span>
                  </div>
                  <p className="text-xs whitespace-pre-line" style={{ color: "#94A3B8" }}>{s.sub}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 text-sm font-semibold" style={{ borderTop: "1px solid #E2E8F0", color: "#22C55E" }}>
              1 Tag Laufzeit · 100% dokumentiert
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mt-10">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-lg min-h-[48px] shadow-lg"
          style={{ background: "#EF4444", boxShadow: "0 4px 14px rgba(153,27,27,0.2)" }}>
          Den Unterschied selbst erleben →
        </Link>
      </motion.div>
    </div>
  </section>
);

export default BeforeAfterSection;

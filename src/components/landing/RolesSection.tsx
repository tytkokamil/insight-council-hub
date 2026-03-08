import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const roles = [
  {
    icon: "🏢", title: "Geschäftsführer / Org-Owner", badge: "Alle Pläne", highlight: false,
    sees: ["Executive Dashboard: alle offenen Entscheidungen, Gesamtkosten, Trends", "KI Daily Brief täglich um 07:30 Uhr mit Top-3 Entscheidungen", "Economic Exposure: Gesamtkosten aller offenen Entscheidungen live", "Eskalations-Übersicht: was braucht sofort Aufmerksamkeit"],
    does: ["Strategische Ziele anlegen und Entscheidungen verknüpfen", "Plan verwalten und upgraden", "Compliance-Exports für Audits abrufen", "Ownership übertragen"],
  },
  {
    icon: "👔", title: "Abteilungsleiter / Org-Admin", badge: "Alle Pläne", highlight: false,
    sees: ["Alle Entscheidungen der Organisation", "Team-Health-Status (Stable / Warning / Critical)", "Bottleneck Intelligence: wer blockt, wo läuft was nicht?", "SLA-Dashboard: welche Fristen drohen zu reißen?"],
    does: ["Entscheidungen anlegen, bearbeiten, zuweisen", "Teams und Mitglieder verwalten", "Automatisierungsregeln und Eskalationsregeln konfigurieren", "Audit Trail exportieren"],
  },
  {
    icon: "👥", title: "Team-Lead / Org-Lead", badge: "Starter / Professional", highlight: false,
    sees: ["Team-Cockpit: alle Entscheidungen des eigenen Teams", "Decision Velocity: wie schnell werden Entscheidungen getroffen?", "Offene Reviews die auf Feedback warten"],
    does: ["Entscheidungen erstellen und dem Team zuweisen", "Meeting-Modus starten", "Abwesenheitsvertretung konfigurieren", "Team-Chat mit @Mentions"],
  },
  {
    icon: "✅", title: "Reviewer / Org-Member", badge: "Alle Pläne", highlight: false,
    sees: ["Eigene offene Review-Anfragen mit Fälligkeitsdatum", "Cost-of-Delay pro Entscheidung", "Tasks die mir zugewiesen sind"],
    does: ["Entscheidungen genehmigen oder ablehnen — direkt aus E-Mail", "In der App mit Kommentar und Bedingungen", "Aufgaben bearbeiten und abschließen", "@Mentions in Diskussionen"],
  },
  {
    icon: "📊", title: "Executive / Org-Executive", badge: "Professional / Enterprise", highlight: false,
    sees: ["Strategische KPIs ohne operativen Lärm", "Welche Entscheidungen bewegen die strategischen Ziele?", "Board Report: PDF für Vorstandssitzungen"],
    does: ["Strategische Ziele kommentieren und priorisieren", "High-Stakes Entscheidungen auf Watchlist setzen", "Board Reports abrufen und teilen"],
  },
  {
    icon: "🔗", title: "Externer Reviewer", badge: "NEU", highlight: true,
    subtext: "Kein Account erforderlich",
    sees: ["Lieferanten, Rechtsanwälte, Wirtschaftsprüfer, externe Berater"],
    does: ["Einladung per E-Mail mit sicherem Token-Link", "Browser öffnen — keine Registrierung, kein Passwort", "Entscheidung lesen, Feedback geben: Genehmigen / Ablehnen / Kommentar", "Alle Aktionen im Audit Trail dokumentiert. DSGVO-konform."],
  },
];

const RolesSection = () => (
  <section id="rollen" className="py-24" style={{ background: "#F8FAFC" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>
          Für jede Rolle die richtige Ansicht.
        </h2>
        <p className="text-lg" style={{ color: "#64748B" }}>Decivio passt sich an — vom Geschäftsführer bis zum externen Reviewer.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((r, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="bg-white rounded-xl p-6"
            style={{ border: r.highlight ? "1px solid rgba(239,68,68,0.4)" : "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.icon}</span>
                <h3 className="text-sm font-semibold" style={{ color: "#0F172A" }}>{r.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={r.highlight ? { background: "#FEE2E2", color: "#EF4444" } : { background: "#F1F5F9", color: "#64748B" }}>
                {r.badge}
              </span>
            </div>
            {r.subtext && <p className="text-xs mb-3" style={{ color: "#64748B" }}>{r.subtext}</p>}
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Sieht:</p>
              <ul className="space-y-1">
                {r.sees.map((s, j) => <li key={j} className="text-xs" style={{ color: "#64748B" }}>• {s}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#94A3B8" }}>Tut:</p>
              <ul className="space-y-1">
                {r.does.map((d, j) => <li key={j} className="text-xs" style={{ color: "#64748B" }}>• {d}</li>)}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default RolesSection;

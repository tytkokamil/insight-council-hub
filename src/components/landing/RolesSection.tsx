import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const roles = [
  {
    icon: "🏢",
    name: "Geschäftsführer / Org-Owner",
    badge: "Alle Pläne",
    badgeClass: "bg-muted/50 text-muted-foreground",
    sees: [
      "Executive Dashboard: alle offenen Entscheidungen, Gesamtkosten, Trends",
      "KI Daily Brief täglich um 07:30 Uhr mit Top-3 Entscheidungen",
      "Economic Exposure: Gesamtkosten aller offenen Entscheidungen live",
      "Eskalations-Übersicht: was braucht sofort Aufmerksamkeit",
    ],
    does: [
      "Strategische Ziele anlegen und Entscheidungen damit verknüpfen",
      "Plan verwalten und upgraden",
      "Compliance-Exports für Audits abrufen",
      "Ownership übertragen",
    ],
  },
  {
    icon: "👔",
    name: "Abteilungsleiter / Org-Admin",
    badge: "Alle Pläne",
    badgeClass: "bg-muted/50 text-muted-foreground",
    sees: [
      "Alle Entscheidungen der Organisation",
      "Team-Health-Status farbcodiert: Stable / Warning / Critical",
      "Bottleneck Intelligence: wer blockt, wo läuft was nicht?",
      "SLA-Dashboard: welche Fristen drohen zu reißen?",
    ],
    does: [
      "Entscheidungen anlegen, bearbeiten, zuweisen",
      "Teams und Mitglieder verwalten",
      "Automatisierungs- und Eskalationsregeln konfigurieren",
      "Audit Trail exportieren",
    ],
  },
  {
    icon: "👥",
    name: "Team-Lead / Org-Lead",
    badge: "Starter / Professional",
    badgeClass: "bg-accent-blue/10 text-accent-blue",
    sees: [
      "Team-Cockpit: alle Entscheidungen und Tasks des eigenen Teams",
      "Decision Velocity: wie schnell werden Entscheidungen im Team getroffen?",
      "Offene Reviews die auf Feedback warten",
    ],
    does: [
      "Entscheidungen erstellen und dem Team zuweisen",
      "Meeting-Modus starten: strukturierte Entscheidungs-Meetings leiten",
      "Abwesenheitsvertretung für das Team konfigurieren",
      "Team-Chat mit @Mentions für schnelle Abstimmung",
    ],
  },
  {
    icon: "✅",
    name: "Reviewer / Org-Member",
    badge: "Alle Pläne",
    badgeClass: "bg-muted/50 text-muted-foreground",
    sees: [
      "Eigene offene Review-Anfragen mit Fälligkeitsdatum",
      "Cost-of-Delay pro Entscheidung: was kostet meine Verzögerung?",
      "Tasks die mir zugewiesen sind",
    ],
    does: [
      "Entscheidungen genehmigen oder ablehnen — direkt aus E-Mail (One-Click, kein Login)",
      "Oder in der App mit Kommentar und Bedingungen",
      "Aufgaben bearbeiten und abschließen",
      "@Mentions in Diskussionen: Feedback geben",
    ],
  },
  {
    icon: "📊",
    name: "Executive / Org-Executive",
    badge: "Professional / Enterprise",
    badgeClass: "bg-accent-violet/10 text-accent-violet",
    sees: [
      "Executive-Ansicht: strategische KPIs ohne operativen Lärm",
      "Welche Entscheidungen bewegen die strategischen Ziele?",
      "Board Report: PDF für Vorstandssitzungen in einem Klick",
    ],
    does: [
      "Strategische Ziele kommentieren und priorisieren",
      "High-Stakes Entscheidungen auf persönliche Watchlist setzen",
      "Board Reports abrufen und teilen",
    ],
  },
  {
    icon: "🔗",
    name: "Externer Reviewer",
    badge: "NEU",
    badgeClass: "bg-primary/10 text-primary",
    highlighted: true,
    subtitle: "Kein Account erforderlich",
    sees: [
      "Lieferanten, Rechtsanwälte, Wirtschaftsprüfer, externe Berater",
    ],
    does: [
      "Einladung per E-Mail mit sicherem Token-Link",
      "Browser öffnen — keine Registrierung, kein Passwort",
      "Entscheidung lesen, Feedback geben: Genehmigen / Ablehnen / Kommentar",
      "Alle Aktionen im Audit Trail dokumentiert. DSGVO-konform.",
    ],
  },
];

const RolesSection = () => (
  <section id="rollen" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">Rollen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Für jede Rolle die richtige Ansicht.
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Decivio passt sich an — vom Geschäftsführer bis zum externen Reviewer.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className={`p-6 rounded-2xl border bg-card/70 backdrop-blur-sm transition-all duration-300 hover:shadow-card-hover ${
              (role as any).highlighted
                ? "border-primary/30 bg-primary/[0.02]"
                : "border-border/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-2xl">{role.icon}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${role.badgeClass}`}>
                {role.badge}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold mb-1">{role.name}</h3>
            {(role as any).subtitle && (
              <p className="text-[11px] text-primary mb-3">{(role as any).subtitle}</p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sieht:</p>
                <ul className="space-y-1.5">
                  {role.sees.map((item, j) => (
                    <li key={j} className="text-[12px] text-muted-foreground leading-relaxed flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tut:</p>
                <ul className="space-y-1.5">
                  {role.does.map((item, j) => (
                    <li key={j} className="text-[12px] text-muted-foreground leading-relaxed flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default RolesSection;

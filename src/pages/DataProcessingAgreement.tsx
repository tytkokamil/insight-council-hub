import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, FileCheck } from "lucide-react";

const DataProcessingAgreement = () => (
  <>
    <Helmet>
      <title>Auftragsverarbeitungsvertrag (AVV) — Decivio</title>
      <meta name="description" content="Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO für die Decivio Plattform." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileCheck className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Auftragsverarbeitungsvertrag (AVV)</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm font-medium text-foreground">Gemäß Art. 28 DSGVO (AVV / DPA)</p>
          <p className="text-xs">Stand: März 2026 · Version 1.0</p>

          {/* Präambel */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">Präambel</h2>
            <p>Der Auftraggeber (nachfolgend "Verantwortlicher") nutzt die Dienstleistungen des Auftragnehmers (nachfolgend "Auftragsverarbeiter"). Im Rahmen dieser Dienstleistungen verarbeitet der Auftragsverarbeiter im Auftrag des Verantwortlichen personenbezogene Daten. Die Parteien schließen daher diesen Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.</p>
          </section>

          {/* § 1 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 1 Gegenstand und Dauer der Auftragsverarbeitung</h2>
            <p>(1) Gegenstand: Der Auftragsverarbeiter erbringt für den Verantwortlichen die in den AGB beschriebenen Leistungen (Betrieb der Decivio-Plattform).</p>
            <p>(2) Dauer: Die Auftragsverarbeitung beginnt mit dem Inkrafttreten des Hauptvertrages und endet mit dessen Beendigung.</p>
          </section>

          {/* § 2 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 2 Art und Zweck der Verarbeitung</h2>
            <p>Der Auftragsverarbeiter verarbeitet personenbezogene Daten ausschließlich im Rahmen der Bereitstellung der Decivio-Plattform und auf dokumentierte Weisung des Verantwortlichen.</p>

            <h3 className="text-foreground text-base font-semibold mt-4">Art der verarbeiteten Daten</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identifikationsdaten:</strong> Namen, E-Mail-Adressen, Nutzer-IDs der Mitarbeiter des Auftraggebers</li>
              <li><strong>Nutzungsdaten:</strong> Login-Zeiten, Aktivitätsprotokolle, Audit-Trail-Einträge</li>
              <li><strong>Inhaltsdaten:</strong> Entscheidungstitel und -beschreibungen, Kommentare, Aufgaben, soweit personenbezogene Daten enthalten</li>
              <li><strong>Kommunikationsdaten:</strong> Team-Chat-Nachrichten, Benachrichtigungen</li>
              <li><strong>Technische Daten:</strong> IP-Adressen (soweit gespeichert), Browser-Informationen</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Kategorien betroffener Personen</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mitarbeiter des Auftraggebers, die als Nutzer in Decivio registriert sind</li>
              <li>Externe Reviewer und Stakeholder, die explizit eingeladen wurden</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Zweck der Verarbeitung</h3>
            <p>Bereitstellung der Decivio-Plattform inklusive aller Funktionen (Dashboard, Entscheidungsmanagement, Task-Verwaltung, Analysen, KI-gestützte Auswertungen) sowie technischer Support und Betrieb der Infrastruktur.</p>
          </section>

          {/* § 3 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 3 Pflichten des Auftragsverarbeiters</h2>
            <p>Der Auftragsverarbeiter verpflichtet sich gegenüber dem Verantwortlichen:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Daten ausschließlich auf dokumentierte Weisung des Verantwortlichen zu verarbeiten;</li>
              <li>Sicherzustellen, dass die zur Verarbeitung befugten Personen zur Vertraulichkeit verpflichtet sind oder einer angemessenen gesetzlichen Verschwiegenheitspflicht unterliegen;</li>
              <li>Alle erforderlichen Maßnahmen gemäß Art. 32 DSGVO zur Sicherheit der Verarbeitung zu ergreifen;</li>
              <li>Die in § 4 genannten Bedingungen für die Inanspruchnahme von Unterauftragsverarbeitern einzuhalten;</li>
              <li>Unter Berücksichtigung der Art der Verarbeitung den Verantwortlichen so weit wie möglich dabei zu unterstützen, seiner Pflicht zur Beantwortung von Anträgen auf Wahrnehmung der Rechte betroffener Personen nachzukommen;</li>
              <li>Den Verantwortlichen unter Berücksichtigung der Art der Verarbeitung und der ihm zur Verfügung stehenden Informationen bei der Einhaltung der Pflichten gemäß Art. 32-36 DSGVO zu unterstützen;</li>
              <li>Nach Beendigung der Verarbeitungsleistungen alle personenbezogenen Daten zu löschen oder zurückzugeben und bestehende Kopien zu löschen, sofern nicht eine Verpflichtung zur Speicherung nach Unionsrecht oder dem Recht der Mitgliedstaaten besteht;</li>
              <li>Dem Verantwortlichen alle erforderlichen Informationen zum Nachweis der Einhaltung der in Art. 28 DSGVO niedergelegten Pflichten zur Verfügung zu stellen und Überprüfungen durch den Verantwortlichen zu ermöglichen.</li>
            </ol>
          </section>

          {/* § 4 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 4 Unterauftragsverarbeiter</h2>
            <p>(1) Folgende Unterauftragsverarbeiter werden vom Auftragsverarbeiter eingesetzt:</p>
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Unterauftragsverarbeiter</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Sitz</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Zweck</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Rechtsgrundlage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Lovable Technologies</td><td className="px-3 py-2 border-b border-border/50">EU</td><td className="px-3 py-2 border-b border-border/50">Plattform-Infrastruktur, Hosting, Datenbank &amp; Authentifizierung (via Lovable Cloud)</td><td className="px-3 py-2 border-b border-border/50">Art. 28 DSGVO, DPA</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Stripe Inc.</td><td className="px-3 py-2 border-b border-border/50">USA (EU-Entity)</td><td className="px-3 py-2 border-b border-border/50">Zahlungsabwicklung</td><td className="px-3 py-2 border-b border-border/50">Art. 28 DSGVO, SCCs</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Google LLC</td><td className="px-3 py-2 border-b border-border/50">USA</td><td className="px-3 py-2 border-b border-border/50">KI-Verarbeitung (Gemini) — nur bei Nutzung von KI-Features</td><td className="px-3 py-2 border-b border-border/50">Art. 28 DSGVO, SCCs</td></tr>
                  <tr><td className="px-3 py-2">OpenAI LLC</td><td className="px-3 py-2">USA</td><td className="px-3 py-2">KI-Verarbeitung (GPT) — optional, nur bei Nutzung</td><td className="px-3 py-2">Art. 28 DSGVO, SCCs</td></tr>
                </tbody>
              </table>
            </div>
            <p>(2) Der Auftragsverarbeiter informiert den Verantwortlichen über geplante Änderungen hinsichtlich der Hinzuziehung oder Ersetzung von Unterauftragsverarbeitern. Der Verantwortliche hat das Recht, gegen solche Änderungen Einspruch zu erheben. Der Einspruch muss schriftlich innerhalb von 14 Tagen nach der Mitteilung erfolgen.</p>
          </section>

          {/* § 5 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 5 Weisungsrecht</h2>
            <p>(1) Der Verantwortliche erteilt seine Weisungen zur Datenverarbeitung in der Regel durch die Nutzung der Plattform gemäß dem Vertrag. Darüber hinaus kann der Verantwortliche jederzeit schriftliche Weisungen per E-Mail an hallo@decivio.com erteilen.</p>
            <p>(2) Der Auftragsverarbeiter informiert den Verantwortlichen unverzüglich, wenn eine Weisung nach seiner Einschätzung gegen datenschutzrechtliche Vorschriften verstößt.</p>
          </section>

          {/* § 6 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 6 Technische und organisatorische Maßnahmen (TOM)</h2>
            <p>Der Auftragsverarbeiter hat folgende technische und organisatorische Maßnahmen zur Sicherheit der Verarbeitung implementiert:</p>

            <h3 className="text-foreground text-base font-semibold mt-4">Zutrittskontrolle</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Keine physischen Serverräume (Cloud-Infrastruktur bei zertifizierten Rechenzentren)</li>
              <li>Zugang zu Verwaltungstools nur für berechtigte Administratoren</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Zugangskontrolle</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authentifizierung via Supabase Auth (E-Mail + Passwort / OAuth)</li>
              <li>Optionale Zwei-Faktor-Authentifizierung für Nutzer</li>
              <li>Automatischer Session-Timeout</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Zugriffskontrolle</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Row-Level Security (RLS) auf Datenbankebene — jeder Nutzer sieht nur Daten seiner Organisation</li>
              <li>Rollen-basiertes Berechtigungskonzept (Owner, Admin, Executive, Team Lead, Member, Viewer)</li>
              <li>Protokollierung aller privilegierten Zugriffe im Audit Trail</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Trennungskontrolle</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mandantentrennung auf Datenbankebene via org_id und RLS</li>
              <li>Keine Vermischung von Kundendaten verschiedener Organisationen</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Integrität</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kryptographischer Audit Trail mit SHA-256 Hash-Kette (unveränderliche Protokollierung)</li>
              <li>HTTPS/TLS für alle Datenübertragungen</li>
              <li>Datenbankintegrität via Foreign Key Constraints und Check Constraints</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Verfügbarkeit</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Automatische tägliche Backups mit 7-Tage-Retention</li>
              <li>Redundante Cloud-Infrastruktur über Supabase (AWS Frankfurt)</li>
            </ul>

            <h3 className="text-foreground text-base font-semibold mt-4">Wiederherstellung</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Backup-Restore innerhalb von 4 Stunden (Supabase Standard)</li>
              <li>Point-in-Time-Recovery über Supabase Pro-Features</li>
            </ul>
          </section>

          {/* § 7 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 7 Meldepflichten bei Datenpannen</h2>
            <p>(1) Der Auftragsverarbeiter unterrichtet den Verantwortlichen unverzüglich und nach Möglichkeit innerhalb von 24 Stunden, nachdem ihm eine Verletzung des Schutzes personenbezogener Daten bekannt geworden ist.</p>
          </section>

          {/* § 8 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 8 Löschung und Rückgabe</h2>
            <p>(1) Nach Beendigung des Hauptvertrages stellt der Auftragsverarbeiter dem Verantwortlichen für 30 Tage eine Exportfunktion zur Verfügung, mit der alle Inhaltsdaten heruntergeladen werden können.</p>
            <p>(2) Nach Ablauf der 30-tägigen Exportperiode werden alle personenbezogenen Daten des Verantwortlichen aus den Systemen des Auftragsverarbeiters gelöscht. Eine Bestätigung der Löschung wird auf Anfrage ausgestellt.</p>
            <p>(3) Von der Löschverpflichtung ausgenommen sind Daten, für die gesetzliche Aufbewahrungspflichten bestehen (insbesondere steuerrelevante Daten für 10 Jahre gemäß § 147 AO).</p>
          </section>

          {/* § 9 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 9 Schlussbestimmungen</h2>
            <p>(1) Für diesen AVV gilt deutsches Recht.</p>
            <p>(2) Bei Widersprüchen zwischen diesem AVV und den AGB haben im Hinblick auf datenschutzrechtliche Fragen die Bestimmungen dieses AVV Vorrang.</p>
            <p>(3) Dieser AVV wird durch die Annahme der AGB bei der Registrierung oder dem Upgrade auf einen kostenpflichtigen Tarif geschlossen. Einer gesonderten Unterschrift bedarf es nicht.</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">
              Verwandte Dokumente:{" "}
              <Link to="/ai-data-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link> ·{" "}
              <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> ·{" "}
              <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link> ·{" "}
              <Link to="/terms" className="text-primary hover:underline">AGB</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default DataProcessingAgreement;

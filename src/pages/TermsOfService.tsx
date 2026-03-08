import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfService = () => (
  <>
    <Helmet>
      <title>AGB — Decivio</title>
      <meta name="description" content="Allgemeine Geschäftsbedingungen der Decivio Plattform — B2B SaaS Nutzungsbedingungen." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Allgemeine Geschäftsbedingungen</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm font-medium text-foreground">Decivio — B2B SaaS Nutzungsbedingungen</p>
          <p className="text-xs">Stand: März 2026 · Version 1.0</p>

          <div className="bg-muted/50 border border-border/60 rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground">Diese AGB gelten ausschließlich für Unternehmer im Sinne des § 14 BGB (B2B). Decivio bietet keine Leistungen für Verbraucher an.</p>
          </div>

          {/* § 1 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 1 Geltungsbereich und Vertragspartner</h2>
            <p>(1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge über die Nutzung der Software-as-a-Service-Plattform "Decivio" (nachfolgend "Plattform" oder "Dienst"), die zwischen dem Anbieter und dem jeweiligen Kunden (nachfolgend "Kunde") geschlossen werden.</p>
            <p>(2) Decivio richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB, d. h. natürliche oder juristische Personen oder rechtsfähige Personengesellschaften, die bei Abschluss eines Rechtsgeschäfts in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handeln.</p>
            <p>(3) Entgegenstehende oder von diesen AGB abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.</p>
            <p>(4) Diese AGB gelten auch für alle zukünftigen Leistungen des Anbieters gegenüber dem Kunden, ohne dass diese erneut vereinbart werden müssen.</p>
          </section>

          {/* § 2 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 2 Leistungsbeschreibung</h2>
            <p>(1) Decivio ist eine cloudbasierte Entscheidungs-Governance-Plattform. Die Plattform ermöglicht Unternehmen die strukturierte Erfassung, Verwaltung, Nachverfolgung und Analyse von organisationalen Entscheidungsprozessen. Zu den Kernfunktionen gehören insbesondere:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Erfassung und Verwaltung von Entscheidungen mit Kategorisierung, Priorisierung und SLA-Management</li>
              <li>Cost-of-Delay Berechnung und Echtzeit-Visualisierung von Verzögerungskosten</li>
              <li>Review- und Genehmigungsworkflows mit optionaler E-Mail-basierter Genehmigung</li>
              <li>Revisionssicherer Audit Trail mit kryptographischer Hash-Kette (SHA-256)</li>
              <li>Compliance-Templates für branchenspezifische Anforderungen (u. a. ISO 9001, IATF 16949, NIS2, GMP)</li>
              <li>Analyse- und Reporting-Funktionen</li>
              <li>Teamverwaltung und kollaborative Funktionen</li>
            </ul>
            <p>(2) Der genaue Funktionsumfang richtet sich nach dem vom Kunden gebuchten Tarif (Free, Starter, Professional, Enterprise). Die jeweils aktuellen Leistungsbeschreibungen der Tarife sind auf der Website des Anbieters (<a href="https://decivio.com/pricing" className="text-primary hover:underline">https://decivio.com/pricing</a>) veröffentlicht.</p>
            <p>(3) Der Anbieter stellt die Plattform als Software-as-a-Service über das Internet zur Verfügung. Der Kunde erhält kein Recht auf Herausgabe des Quellcodes oder der Installationsdateien.</p>
            <p>(4) Der Anbieter ist berechtigt, den Funktionsumfang der Plattform zu erweitern, zu ändern oder zu reduzieren, soweit dies dem Kunden zumutbar ist und die vertraglich zugesicherten Kernfunktionen nicht wesentlich beeinträchtigt werden. Der Anbieter wird den Kunden über wesentliche Änderungen mit angemessener Vorlauffrist (mindestens 30 Tage) per E-Mail informieren.</p>
          </section>

          {/* § 3 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 3 Vertragsschluss und Registrierung</h2>
            <p>(1) Die Darstellung der Plattform auf der Website des Anbieters stellt kein verbindliches Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum).</p>
            <p>(2) Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform und die Bestätigung durch den Anbieter zustande. Mit der Registrierung erklärt der Kunde, diese AGB gelesen und akzeptiert zu haben.</p>
            <p>(3) Bei der Registrierung hat der Kunde zutreffende und vollständige Angaben zu machen. Er ist verpflichtet, diese Angaben bei Änderungen unverzüglich zu aktualisieren.</p>
            <p>(4) Der Kunde ist verpflichtet, seine Zugangsdaten vertraulich zu behandeln und Dritten nicht zugänglich zu machen. Bei Verdacht auf Missbrauch hat der Kunde den Anbieter unverzüglich zu informieren.</p>
          </section>

          {/* § 4 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 4 Tarife und Entgelte</h2>
            <p>(1) Die Nutzung der Plattform ist nach Maßgabe der nachfolgenden Regelungen entgeltpflichtig. Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer.</p>
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Tarif</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Preis (zzgl. MwSt.)</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Nutzer</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Laufzeit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Free</td><td className="px-3 py-2 border-b border-border/50">0,00 € / Monat</td><td className="px-3 py-2 border-b border-border/50">1</td><td className="px-3 py-2 border-b border-border/50">Unbefristet, kündbar jederzeit</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Starter</td><td className="px-3 py-2 border-b border-border/50">49,00 € / Monat</td><td className="px-3 py-2 border-b border-border/50">bis 5</td><td className="px-3 py-2 border-b border-border/50">Monatlich, kündbar zum Monatsende</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Professional</td><td className="px-3 py-2 border-b border-border/50">149,00 € / Monat</td><td className="px-3 py-2 border-b border-border/50">bis 25</td><td className="px-3 py-2 border-b border-border/50">Monatlich, kündbar zum Monatsende</td></tr>
                  <tr><td className="px-3 py-2">Enterprise</td><td className="px-3 py-2">Individuell</td><td className="px-3 py-2">Unbegrenzt</td><td className="px-3 py-2">Individuell vereinbart</td></tr>
                </tbody>
              </table>
            </div>
            <p>(2) Jahresverträge können zu den auf der Website ausgewiesenen vergünstigten Konditionen abgeschlossen werden. Bei Jahresverträgen ist das Entgelt für das gesamte Jahr im Voraus fällig.</p>
            <p>(3) Der Anbieter ist berechtigt, die Preise mit einer Ankündigungsfrist von mindestens 30 Tagen per E-Mail zu ändern. Stimmt der Kunde der Preisänderung nicht zu, kann er den Vertrag zum Zeitpunkt des Inkrafttretens der Preisänderung außerordentlich kündigen.</p>
            <p>(4) Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Es werden die Zahlungsmethoden Kreditkarte und SEPA-Lastschrift unterstützt. Mit der Buchung eines kostenpflichtigen Tarifs erteilt der Kunde eine Einzugsermächtigung für die monatliche bzw. jährliche Abbuchung.</p>
            <p>(5) Im Falle des Zahlungsverzugs ist der Anbieter berechtigt, den Zugang zur Plattform zu sperren, bis der offene Betrag vollständig beglichen ist. Der Anbieter behält sich das Recht vor, Verzugszinsen in gesetzlicher Höhe (§ 288 Abs. 2 BGB: 9 Prozentpunkte über dem Basiszinssatz) zu berechnen.</p>
          </section>

          {/* § 5 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 5 Laufzeit und Kündigung</h2>
            <p>(1) Monatliche Verträge haben eine Mindestlaufzeit von einem Monat und verlängern sich automatisch um jeweils einen weiteren Monat, sofern keine Kündigung erfolgt.</p>
            <p>(2) Die Kündigung kann durch den Kunden jederzeit zum Ende der laufenden Abrechnungsperiode über die Kontoeinstellungen in der Plattform oder per E-Mail an hallo@decivio.com erfolgen.</p>
            <p>(3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund für eine Kündigung durch den Anbieter liegt insbesondere vor, wenn:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>der Kunde trotz Mahnung mit Zahlungen in Verzug ist,</li>
              <li>der Kunde gegen diese AGB oder geltendes Recht verstößt,</li>
              <li>der Kunde die Plattform missbräuchlich nutzt.</li>
            </ul>
            <p>(4) Nach Beendigung des Vertrages hat der Kunde das Recht, seine Daten innerhalb von 30 Tagen zu exportieren. Danach werden alle Kundendaten unwiderruflich gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
          </section>

          {/* § 6 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 6 Nutzungsrechte</h2>
            <p>(1) Der Anbieter räumt dem Kunden für die Dauer des Vertragsverhältnisses ein nicht ausschließliches, nicht übertragbares und nicht unterlizenzierbares Recht ein, die Plattform im Rahmen der gebuchten Tariflimits für eigene unternehmerische Zwecke zu nutzen.</p>
            <p>(2) Der Kunde ist nicht berechtigt, die Plattform Dritten entgeltlich oder unentgeltlich zur Verfügung zu stellen, es sei denn, dies ist ausdrücklich im jeweiligen Tarif vorgesehen (z. B. externe Reviewer-Funktion im Rahmen des bestimmungsgemäßen Gebrauchs).</p>
            <p>(3) Dem Kunden ist es untersagt:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>die Plattform zu vervielfältigen, zu dekompilieren oder zu disassemblieren;</li>
              <li>Sicherheitsmechanismen zu umgehen oder zu deaktivieren;</li>
              <li>automatisierte Abfragen (Scraping, Bots) durchzuführen, die den Betrieb beeinträchtigen;</li>
              <li>die Plattform für rechtswidrige Zwecke zu nutzen;</li>
              <li>Malware oder schädlichen Code einzubringen.</li>
            </ul>
          </section>

          {/* § 7 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 7 Pflichten des Kunden und Daten</h2>
            <p>(1) Der Kunde ist allein verantwortlich für die Rechtmäßigkeit der Daten, die er in die Plattform einpflegt, insbesondere für die Einhaltung datenschutzrechtlicher Anforderungen gegenüber seinen eigenen Mitarbeitern und Dritten.</p>
            <p>(2) Der Kunde stellt sicher, dass die in der Plattform gespeicherten Inhalte keine Rechte Dritter (insbesondere Urheberrechte, Persönlichkeitsrechte, Betriebsgeheimnisse) verletzen.</p>
            <p>(3) Der Anbieter verarbeitet personenbezogene Daten des Kunden und seiner Nutzer ausschließlich zur Vertragserfüllung und gemäß der Datenschutzerklärung sowie dem Auftragsverarbeitungsvertrag (AVV). Der Anbieter ist Auftragsverarbeiter im Sinne des Art. 28 DSGVO in Bezug auf personenbezogene Daten, die der Kunde in die Plattform einpflegt.</p>
          </section>

          {/* § 8 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 8 Verfügbarkeit und Wartung</h2>
            <p>(1) Der Anbieter strebt eine Verfügbarkeit der Plattform von 99,0 % im Jahresmittel an (gemessen auf Basis 24/7, abzüglich planmäßiger Wartungsfenster).</p>
            <p>(2) Geplante Wartungsarbeiten werden dem Kunden nach Möglichkeit mit mindestens 24 Stunden Vorankündigung per E-Mail oder In-App-Nachricht mitgeteilt und werden vorzugsweise in Zeiten geringer Nutzung (werktags 22:00–06:00 Uhr MEZ) durchgeführt.</p>
            <p>(3) Ein Anspruch auf eine bestimmte Verfügbarkeit besteht nur, wenn dies ausdrücklich schriftlich vereinbart wurde (Enterprise SLA). Im Starter- und Professional-Tarif werden keine garantierten SLAs vereinbart.</p>
            <p>(4) Der Anbieter haftet nicht für Unterbrechungen, die auf Umständen außerhalb seines Einflussbereichs beruhen, insbesondere auf Ausfällen des Internets, der von Drittanbietern bereitgestellten Infrastruktur oder auf höherer Gewalt.</p>
          </section>

          {/* § 9 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 9 Haftung</h2>
            <p>(1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte Schäden und bei Übernahme einer Garantie.</p>
            <p>(2) Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung einer wesentlichen Vertragspflicht (Kardinalpflicht), und zwar der Höhe nach begrenzt auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden. Die Haftung bei einfacher Fahrlässigkeit ist der Höhe nach auf den 12-fachen Monatsbetrag des vom Kunden in den letzten 12 Monaten bezahlten Entgelts beschränkt, maximal jedoch auf 10.000 Euro.</p>
            <p>(3) Der Anbieter haftet nicht für mittelbare Schäden, entgangenen Gewinn, Datenverluste oder sonstige Folgeschäden, sofern es sich nicht um Vorsatz oder grobe Fahrlässigkeit handelt.</p>
            <p>(4) Der Anbieter weist ausdrücklich darauf hin, dass die Plattform kein Ersatz für rechtliche, steuerliche oder fachliche Beratung ist. Entscheidungen, die der Kunde auf Basis der Plattform trifft, liegen in dessen alleiniger Verantwortung.</p>
          </section>

          {/* § 10 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 10 Datensicherung</h2>
            <p>(1) Der Anbieter führt regelmäßige automatisierte Backups der Kundendaten durch. Backups werden täglich erstellt und mindestens 7 Tage vorgehalten.</p>
            <p>(2) Eine Haftung für Datenverluste besteht nur, wenn der Anbieter die Datensicherung schuldhaft unterlassen hat und der Kunde zumutbare Vorkehrungen zur Datensicherung auf seiner Seite getroffen hat (z. B. regelmäßige Datenexporte über die Exportfunktion der Plattform).</p>
          </section>

          {/* § 11 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 11 Geheimhaltung</h2>
            <p>(1) Beide Parteien verpflichten sich, alle ihnen im Rahmen des Vertragsverhältnisses bekannt gewordenen vertraulichen Informationen der jeweils anderen Partei vertraulich zu behandeln und Dritten gegenüber nicht preiszugeben.</p>
            <p>(2) Diese Verpflichtung gilt nicht für Informationen, die öffentlich bekannt sind oder werden, ohne dass eine Partei dies zu verantworten hat.</p>
            <p>(3) Der Anbieter ist berechtigt, den Kunden und dessen Firmennamen in seiner Referenzliste zu nennen, sofern der Kunde nicht ausdrücklich widerspricht.</p>
          </section>

          {/* § 12 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 12 Änderungen der AGB</h2>
            <p>(1) Der Anbieter behält sich vor, diese AGB mit Wirkung für die Zukunft zu ändern.</p>
            <p>(2) Änderungen werden dem Kunden mindestens 30 Tage vor ihrem Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Kunde der Änderung nicht innerhalb von 30 Tagen nach Zugang der Änderungsmitteilung, gelten die geänderten AGB als akzeptiert. Auf diese Rechtsfolge wird in der Änderungsmitteilung gesondert hingewiesen.</p>
            <p>(3) Im Falle des Widerspruchs hat der Anbieter das Recht, den Vertrag zum Zeitpunkt des Inkrafttretens der Änderungen zu kündigen.</p>
          </section>

          {/* § 13 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 13 Schlussbestimmungen</h2>
            <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).</p>
            <p>(2) Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.</p>
            <p>(3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung möglichst nahekommt.</p>
            <p>(4) Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen bedürfen der Schriftform.</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">
              Verwandte Dokumente:{" "}
              <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link> ·{" "}
              <Link to="/dpa" className="text-primary hover:underline">AVV</Link> ·{" "}
              <Link to="/ai-data-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link> ·{" "}
              <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default TermsOfService;

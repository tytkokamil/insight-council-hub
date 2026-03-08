import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import CookieSettingsModal from "@/components/shared/CookieSettingsModal";

const CookieSettingsButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Cookie-Einstellungen ändern</Button>
      <CookieSettingsModal open={open} onOpenChange={setOpen} />
    </>
  );
};

const PrivacyPolicy = () => (
  <>
    <Helmet>
      <title>Datenschutzerklärung — Decivio</title>
      <meta name="description" content="Datenschutzerklärung der Decivio Plattform gemäß Art. 13, 14 DSGVO." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Datenschutzerklärung</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm font-medium text-foreground">Gemäß Art. 13, 14 DSGVO</p>
          <p className="text-xs">Stand: März 2026 · Version 1.0</p>

          {/* 1 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">1. Verantwortlicher</h2>
            <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze sowie sonstiger datenschutzrechtlicher Bestimmungen ist:</p>
            <p>
              ✏️ Vollständiger Name<br />
              ✏️ Straße, Hausnummer<br />
              ✏️ PLZ und Ort<br />
              E-Mail: hallo@decivio.com<br />
              Website: <a href="https://decivio.com" className="text-primary hover:underline">https://decivio.com</a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">2. Allgemeines zur Datenverarbeitung</h2>
            <p>(1) Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
            <p>(2) Die Nutzung unserer Plattform ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unserer Plattform personenbezogene Daten erhoben werden, erfolgt dies, soweit möglich, stets auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben, soweit nachfolgend nicht anders angegeben.</p>
            <p>(3) Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">3. Rechtsgrundlagen der Verarbeitung</h2>
            <p>Wir verarbeiten personenbezogene Daten auf folgenden Rechtsgrundlagen:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Art. 6 Abs. 1 lit. a DSGVO — Einwilligung</li>
              <li>Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Bereitstellung der Plattform)</li>
              <li>Art. 6 Abs. 1 lit. c DSGVO — rechtliche Verpflichtung (z. B. Aufbewahrungspflichten)</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen (z. B. Sicherheit, Betrugsprävention)</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">4. Datenerhebung beim Besuch der Website</h2>

            <h3 className="text-foreground text-base font-semibold mt-4">4.1 Server-Log-Dateien</h3>
            <p>Der Hosting-Anbieter der Website erhebt und speichert automatisch Informationen in Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind: Browser-Typ und -Version, verwendetes Betriebssystem, Referrer-URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.</p>
            <p>Diese Daten sind nicht bestimmten Personen zuordenbar. Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen an der Sicherheit des Betriebs).</p>

            <h3 className="text-foreground text-base font-semibold mt-4">4.2 Cookies</h3>
            <p>Wir verwenden auf unserer Website technisch notwendige Cookies zur Aufrechterhaltung der Session nach dem Login sowie zur Speicherung von Nutzereinstellungen. Diese Cookies werden nach dem Schließen des Browsers oder spätestens nach 30 Tagen gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO.</p>
            <p>Wir verwenden keine Tracking-Cookies, keine Analyse-Cookies von Drittanbietern und kein Google Analytics oder ähnliche Tools, sofern nicht ausdrücklich anders angegeben.</p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">5. Datenerhebung bei Nutzung der Plattform</h2>

            <h3 className="text-foreground text-base font-semibold mt-4">5.1 Registrierung und Account-Daten</h3>
            <p>Bei der Registrierung erheben wir folgende Daten: Name, E-Mail-Adresse, Unternehmensname, Branche (optional). Diese Daten werden zur Vertragserfüllung verarbeitet.</p>

            <h3 className="text-foreground text-base font-semibold mt-4">5.2 Entscheidungs- und Nutzungsdaten</h3>
            <p>Die in der Plattform eingetragenen Entscheidungen, Aufgaben, Kommentare und sonstigen Inhalte sind Inhaltsdaten des Kunden. Der Anbieter verarbeitet diese Daten ausschließlich zur Vertragserfüllung und als Auftragsverarbeiter im Sinne des Art. 28 DSGVO. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>

            <h3 className="text-foreground text-base font-semibold mt-4">5.3 Audit Trail</h3>
            <p>Zur Sicherstellung der Compliance und Revisionssicherheit wird ein Audit Trail gespeichert, der Aktionen innerhalb der Plattform protokolliert (wer hat wann was geändert). Die Protokolleinträge enthalten IP-Adressen und Nutzer-IDs. Diese Daten werden für die im jeweiligen Tarif angegebene Speicherdauer aufbewahrt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO.</p>

            <h3 className="text-foreground text-base font-semibold mt-4">5.4 Kommunikations-Daten</h3>
            <p>E-Mail-Adressen die für Benachrichtigungen, One-Click-Genehmigungen oder externe Reviews verwendet werden, werden nur zur Durchführung der jeweiligen Funktion verarbeitet und nicht für Werbezwecke genutzt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">6. Weitergabe von Daten an Dritte und Drittanbieter</h2>
            <p>Wir nutzen folgende Drittanbieter für den Betrieb der Plattform:</p>
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Anbieter</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Zweck</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Sitz</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Rechtsgrundlage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Lovable Technologies</td><td className="px-3 py-2 border-b border-border/50">Plattform-Infrastruktur, Hosting, Datenbank &amp; Authentifizierung (via Lovable Cloud, EU-Region Frankfurt)</td><td className="px-3 py-2 border-b border-border/50">EU</td><td className="px-3 py-2 border-b border-border/50">Art. 28 DSGVO, DPA</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Stripe Inc.</td><td className="px-3 py-2 border-b border-border/50">Zahlungsabwicklung</td><td className="px-3 py-2 border-b border-border/50">USA / EU</td><td className="px-3 py-2 border-b border-border/50">Art. 6 Abs. 1 lit. b DSGVO, SCCs</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Google LLC</td><td className="px-3 py-2 border-b border-border/50">KI-Verarbeitung (Gemini) — nur bei Nutzung von KI-Features</td><td className="px-3 py-2 border-b border-border/50">USA</td><td className="px-3 py-2 border-b border-border/50">Art. 6 Abs. 1 lit. f DSGVO, SCCs</td></tr>
                  <tr><td className="px-3 py-2">OpenAI LLC</td><td className="px-3 py-2">KI-Verarbeitung (GPT) — optional, nur bei Nutzung</td><td className="px-3 py-2">USA</td><td className="px-3 py-2">Art. 6 Abs. 1 lit. f DSGVO, SCCs</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/60">"SCCs" = EU-Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO. Mit allen Auftragsverarbeitern werden Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO geschlossen.</p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">7. Speicherdauer</h2>
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Datenkategorie</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Free</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Starter / Professional</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Account-Daten</td><td className="px-3 py-2 border-b border-border/50">Bis Kündigung + 30 Tage</td><td className="px-3 py-2 border-b border-border/50">Bis Kündigung + 30 Tage</td><td className="px-3 py-2 border-b border-border/50">Individuell vereinbart</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Entscheidungs-/Inhaltsdaten</td><td className="px-3 py-2 border-b border-border/50">Bis Kündigung + 30 Tage</td><td className="px-3 py-2 border-b border-border/50">Bis Kündigung + 30 Tage</td><td className="px-3 py-2 border-b border-border/50">Individuell</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Audit Trail</td><td className="px-3 py-2 border-b border-border/50">30 Tage</td><td className="px-3 py-2 border-b border-border/50">Unbegrenzt</td><td className="px-3 py-2 border-b border-border/50">Unbegrenzt</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Server-Log-Dateien</td><td className="px-3 py-2 border-b border-border/50">7 Tage</td><td className="px-3 py-2 border-b border-border/50">7 Tage</td><td className="px-3 py-2 border-b border-border/50">7 Tage</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Zahlungsdaten</td><td className="px-3 py-2 border-b border-border/50">Gesetzl. Aufbewahrung (10 Jahre)</td><td className="px-3 py-2 border-b border-border/50">10 Jahre</td><td className="px-3 py-2 border-b border-border/50">10 Jahre</td></tr>
                  <tr><td className="px-3 py-2">E-Mail-Logs</td><td className="px-3 py-2">30 Tage</td><td className="px-3 py-2">90 Tage</td><td className="px-3 py-2">Individuell</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">8. Ihre Rechte als betroffene Person</h2>
            <p>Sie haben nach der DSGVO folgende Rechte gegenüber uns:</p>
            <div className="overflow-x-auto my-4">
              <table className="min-w-full text-sm border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Recht</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Grundlage</th>
                    <th className="text-left px-3 py-2 border-b border-border font-medium text-foreground">Wie geltend machen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="px-3 py-2 border-b border-border/50">Auskunft über gespeicherte Daten</td><td className="px-3 py-2 border-b border-border/50">Art. 15 DSGVO</td><td className="px-3 py-2 border-b border-border/50">E-Mail an hallo@decivio.com</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Berichtigung unrichtiger Daten</td><td className="px-3 py-2 border-b border-border/50">Art. 16 DSGVO</td><td className="px-3 py-2 border-b border-border/50">E-Mail oder Kontoeinstellungen</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Löschung (Recht auf Vergessenwerden)</td><td className="px-3 py-2 border-b border-border/50">Art. 17 DSGVO</td><td className="px-3 py-2 border-b border-border/50">E-Mail oder Account löschen</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Einschränkung der Verarbeitung</td><td className="px-3 py-2 border-b border-border/50">Art. 18 DSGVO</td><td className="px-3 py-2 border-b border-border/50">E-Mail an hallo@decivio.com</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Datenportabilität</td><td className="px-3 py-2 border-b border-border/50">Art. 20 DSGVO</td><td className="px-3 py-2 border-b border-border/50">Exportfunktion in der Plattform</td></tr>
                  <tr><td className="px-3 py-2 border-b border-border/50">Widerspruch gegen Verarbeitung</td><td className="px-3 py-2 border-b border-border/50">Art. 21 DSGVO</td><td className="px-3 py-2 border-b border-border/50">E-Mail an hallo@decivio.com</td></tr>
                  <tr><td className="px-3 py-2">Widerruf einer Einwilligung</td><td className="px-3 py-2">Art. 7 Abs. 3 DSGVO</td><td className="px-3 py-2">E-Mail an hallo@decivio.com</td></tr>
                </tbody>
              </table>
            </div>
            <p>Sie haben außerdem das Recht, sich bei der zuständigen Datenschutz-Aufsichtsbehörde zu beschweren. In Deutschland ist dies für Nordrhein-Westfalen die Landesbeauftragte für Datenschutz und Informationsfreiheit (LDI NRW): <a href="https://www.ldi.nrw.de" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.ldi.nrw.de</a></p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">9. Sicherheit der Daten</h2>
            <p>(1) Wir treffen technische und organisatorische Sicherheitsmaßnahmen (TOM), um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen Entwicklung fortlaufend verbessert.</p>
            <p>(2) Zu den technischen Sicherheitsmaßnahmen gehören insbesondere: Verschlüsselung der Datenübertragung via TLS/HTTPS, Verschlüsselung der Daten at rest, Row-Level Security (RLS) in der Datenbank, kryptographischer Audit Trail (SHA-256 Hash-Kette), Zwei-Faktor-Authentifizierung (optional für Nutzer), regelmäßige Sicherheitsbackups.</p>
            <p>(3) Im Falle einer Datenpanne die ein hohes Risiko für betroffene Personen darstellt, werden wir die zuständige Aufsichtsbehörde innerhalb von 72 Stunden und die betroffenen Personen unverzüglich informieren (Art. 33, 34 DSGVO).</p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">10. Änderungen dieser Datenschutzerklärung</h2>
            <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich rechtliche Anforderungen oder unser Angebot ändern. Die jeweils aktuelle Version ist unter https://decivio.com/datenschutz abrufbar. Über wesentliche Änderungen informieren wir registrierte Nutzer per E-Mail.</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border space-y-4">
            <div>
              <h2 className="text-foreground text-lg font-semibold mb-2">Cookie-Einstellungen</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Sie können Ihre Cookie-Einstellungen jederzeit anpassen. Notwendige Cookies können nicht deaktiviert werden.
              </p>
              <CookieSettingsButton />
            </div>
            <p className="text-xs text-muted-foreground/60">
              Verwandte Dokumente:{" "}
              <Link to="/dpa" className="text-primary hover:underline">AVV</Link> ·{" "}
              <Link to="/ai-data-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link> ·{" "}
              <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> ·{" "}
              <Link to="/terms" className="text-primary hover:underline">AGB</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default PrivacyPolicy;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => (
  <>
    <Helmet>
      <title>Datenschutzerklärung — Decivio</title>
      <meta name="description" content="Datenschutzerklärung der Decivio Plattform. Informationen zur Verarbeitung personenbezogener Daten." />
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
          <p className="text-xs">Zuletzt aktualisiert: 23. Februar 2026</p>

          <section>
            <h2 className="text-foreground text-lg font-semibold">1. Verantwortlicher</h2>
            <p>Verantwortlich im Sinne der DSGVO ist die Decivio GmbH, vertreten durch die Geschäftsführung. Kontakt: datenschutz@decivio.com</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">2. Erhobene Daten</h2>
            <p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse, Passwort (gehasht)</li>
              <li><strong>Nutzungsdaten:</strong> IP-Adresse, Browser-Typ, Zugriffszeiten</li>
              <li><strong>Inhaltsdaten:</strong> Entscheidungen, Kommentare, Dateien die Sie erstellen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">3. Zweck der Verarbeitung</h2>
            <p>Ihre Daten werden verarbeitet zur Bereitstellung und Verbesserung unserer Dienste, zur Authentifizierung und Kontosicherheit sowie zur Kommunikation bei Service-Änderungen (Art. 6 Abs. 1 lit. b, f DSGVO).</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">4. Datenweitergabe</h2>
            <p>Wir geben Ihre Daten nur an Auftragsverarbeiter weiter, die für den Betrieb der Plattform notwendig sind (Hosting, E-Mail). Eine Übermittlung in Drittländer erfolgt nur mit angemessenen Garantien.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">5. Speicherdauer</h2>
            <p>Personenbezogene Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">6. Ihre Rechte</h2>
            <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich an datenschutz@decivio.com.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">7. Cookies</h2>
            <p>Wir verwenden technisch notwendige Cookies für die Authentifizierung und Session-Verwaltung. Optionale Analyse-Cookies werden nur mit Ihrer Zustimmung gesetzt.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">8. KI-gestützte Verarbeitung</h2>
            <p>Unsere Plattform nutzt KI-Modelle zur Risikoanalyse, Entscheidungsunterstützung und automatisierten Briefings. Die KI-Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO. Ihre Entscheidungsdaten werden ausschließlich für Ihre Organisation verarbeitet und nicht zum Training von KI-Modellen verwendet. Sie können den KI-Umfang in den Einstellungen konfigurieren.</p>
            <p>Für die KI-Verarbeitung setzen wir externe Anbieter (Google Gemini, OpenAI) ein, die als Unterauftragsverarbeiter in unserer <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> aufgeführt sind. Ausführliche Informationen zu allen KI-Features, verarbeiteten Datenkategorien und Deaktivierungsmöglichkeiten finden Sie in unserer <Link to="/ai-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link>.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">9. Hosting & Datenresidenz</h2>
            <p>Alle Daten werden in der EU gehostet (Rechenzentrum Frankfurt am Main, Deutschland). Es findet keine Datenübertragung in Drittländer statt, sofern nicht ausdrücklich in der Auftragsverarbeitungsvereinbarung geregelt. Verschlüsselung: AES-256 at rest, TLS 1.3 in transit.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">10. Auftragsverarbeiter</h2>
            <p>Folgende Auftragsverarbeiter werden eingesetzt:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase Inc.</strong> — Datenbank & Authentifizierung (EU-Region)</li>
              <li><strong>Vercel Inc.</strong> — Hosting & CDN (EU Edge)</li>
              <li><strong>Resend</strong> — Transaktionale E-Mails</li>
            </ul>
            <p>Alle Auftragsverarbeiter unterliegen Art. 28 DSGVO-konformen Vereinbarungen.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">11. Sicherheit</h2>
            <p>Wir setzen TLS-Verschlüsselung, Row-Level Security, Multi-Faktor-Authentifizierung und regelmäßige Sicherheitsaudits ein, um Ihre Daten zu schützen. Enterprise-Kunden erhalten zusätzlich Security Reviews und Penetrationstests.</p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default PrivacyPolicy;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";

const AiDataPolicy = () => (
  <>
    <Helmet>
      <title>KI-Datenverarbeitungsrichtlinie — Decivio</title>
      <meta name="description" content="Transparenz über den Einsatz künstlicher Intelligenz in Decivio. Welche Daten verarbeitet werden und wie wir KI-Dienste nutzen." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">KI-Datenverarbeitungsrichtlinie</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-foreground font-medium">Transparenz über den Einsatz künstlicher Intelligenz in Decivio</p>
          <p className="text-xs">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO, Art. 13/14 DSGVO, EU AI Act</p>

          {/* 1. Übersicht */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">1. Übersicht — Welche KI-Features gibt es</h2>
            <p>Decivio bietet optionale KI-gestützte Funktionen, die auf großen Sprachmodellen (LLMs) basieren. Alle KI-Features sind optional. Die Grundfunktionen der Plattform (Entscheidungen erstellen, Tasks verwalten, Audit Trail) funktionieren vollständig ohne KI-Nutzung.</p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">KI-Feature</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Was es tut</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Welche Daten werden gesendet</th>
                    <th className="text-left py-2 font-semibold text-foreground">Deaktivierbar</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {[
                    ["KI-Risikoanalyse", "Bewertet Entscheidungsrisiko 0–100%", "Titel, Beschreibung, Kategorie, Priorität", "✅ Ja"],
                    ["Decision Co-Pilot", "Chat-Assistent im Entscheidungskontext", "Entscheidungskontext + Nutzerfragen", "✅ Ja"],
                    ["CEO / KI-Briefing", "Tägliche Zusammenfassung der Lage", "Aggregierte Metriken, keine Einzelpersonen-Daten", "✅ Ja"],
                    ["Szenario-Simulation", "Was-wäre-wenn Analysen", "Entscheidungsparameter", "✅ Ja"],
                    ["Smart Reviewer Suggestion", "Empfiehlt passende Reviewer", "Entscheidungskategorie + Nutzerprofile (anonym)", "✅ Ja"],
                    ["Muster-Erkennung", "Identifiziert Engpässe und Muster", "Aggregierte anonymisierte Metriken", "✅ Ja"],
                    ["Entscheidungs-Import", "Extrahiert Entscheidungen aus Text", "Der hochgeladene Text", "✅ Ja"],
                  ].map(([feature, desc, data, toggle]) => (
                    <tr key={feature} className="border-b border-border/40">
                      <td className="py-2 pr-4 font-medium text-foreground">{feature}</td>
                      <td className="py-2 pr-4">{desc}</td>
                      <td className="py-2 pr-4">{data}</td>
                      <td className="py-2">{toggle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. KI-Anbieter */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">2. Welche KI-Anbieter wir nutzen</h2>

            <h3 className="text-foreground text-base font-semibold mt-4">2.1 Google Gemini</h3>
            <p><strong>Anbieter:</strong> Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
            <p><strong>Eingesetzte Modelle:</strong> Gemini 2.5 Flash (Standard), Gemini 2.5 Pro (für komplexe Analysen)</p>
            <p><strong>Datenverarbeitung:</strong> Daten werden in Google-Rechenzentren verarbeitet. Google hat sich vertraglich verpflichtet, Daten aus der Gemini API nicht für das Training von Modellen zu verwenden.</p>
            <p><strong>Rechtsgrundlage für Drittlandübermittlung:</strong> EU-Standardvertragsklauseln (SCCs) gemäß Art. 46 Abs. 2 lit. c DSGVO</p>
            <p><strong>Datenschutzerklärung:</strong> <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></p>

            <h3 className="text-foreground text-base font-semibold mt-4">2.2 OpenAI</h3>
            <p><strong>Anbieter:</strong> OpenAI, LLC, 3180 18th Street, San Francisco, CA 94110, USA</p>
            <p><strong>Eingesetzte Modelle:</strong> GPT-5 / GPT-5 Mini (optional, für spezifische Analysen)</p>
            <p><strong>Datenverarbeitung:</strong> OpenAI verarbeitet API-Daten nicht für Modell-Training (Zero Data Retention Policy für API-Nutzung).</p>
            <p><strong>Rechtsgrundlage für Drittlandübermittlung:</strong> EU-Standardvertragsklauseln (SCCs) gemäß Art. 46 Abs. 2 lit. c DSGVO</p>
            <p><strong>Datenschutzerklärung:</strong> <a href="https://openai.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">openai.com/privacy</a></p>
          </section>

          {/* 3. Was wir NICHT tun */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">3. Was wir NICHT tun</h2>
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-foreground text-sm">Unsere Garantien</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Wir senden <strong>keine besonderen Kategorien</strong> personenbezogener Daten (Art. 9 DSGVO) an KI-Dienste — keine Gesundheitsdaten, keine politischen Meinungen, keine biometrischen Daten</li>
                <li>Wir nutzen eure Daten <strong>nicht für das Training</strong> eigener oder fremder KI-Modelle</li>
                <li>Wir verkaufen <strong>keine Daten</strong> an Dritte</li>
                <li>KI-Ausgaben werden <strong>nicht als Rechtsberatung, Finanzberatung oder medizinische Beratung</strong> bereitgestellt</li>
                <li>Wir speichern KI-Anfragen und -Antworten <strong>nicht dauerhaft</strong> auf unseren Servern (nur für die Dauer der Verarbeitung)</li>
              </ul>
            </div>
          </section>

          {/* 4. Datensparsamkeit */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">4. Datensparsamkeit — was genau gesendet wird</h2>
            <p>Wir senden grundsätzlich nur die Daten, die für die jeweilige KI-Funktion technisch notwendig sind:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Keine Nutzer-IDs oder E-Mail-Adressen</strong> werden an KI-Dienste gesendet — nur inhaltliche Daten</li>
              <li><strong>Kein vollständiger Audit Trail</strong> wird an KI gesendet — nur die für die Analyse relevanten Felder</li>
              <li>Für Muster-Analysen werden Daten <strong>aggregiert und anonymisiert</strong> bevor sie gesendet werden</li>
            </ul>
          </section>

          {/* 5. Transparenz */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">5. KI-Transparenz und Erklärbarkeit</h2>
            <p>Decivio zeigt bei allen KI-generierten Inhalten einen <strong>Explainability-Badge</strong>, der erklärt, auf welcher Datenbasis die KI zu ihrer Einschätzung gekommen ist. Nutzer können jede KI-Ausgabe bewerten.</p>
            <p>KI-Scores und Empfehlungen sind immer als solche gekennzeichnet und ersetzen keine menschliche Entscheidung. Die Letztverantwortung für alle Entscheidungen liegt beim Nutzer.</p>
          </section>

          {/* 6. Deaktivieren */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">6. KI deaktivieren</h2>
            <p>Alle KI-Features können einzeln oder vollständig deaktiviert werden:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Pro Nutzer:</strong> In den Profil-Einstellungen unter "KI-Features"</li>
              <li><strong>Org-weit:</strong> Administratoren können alle KI-Features für die gesamte Organisation deaktivieren (Settings → Pilot Mode)</li>
              <li><strong>Enterprise:</strong> Auf Anfrage können KI-Features vertraglich ausgeschlossen werden</li>
            </ul>
          </section>

          {/* 7. EU AI Act */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">7. EU AI Act Konformität</h2>
            <p>Decivio ist nach aktuellem Stand kein "Hochrisiko-KI-System" im Sinne des EU AI Act, da die KI-Features lediglich als Unterstützungswerkzeug dienen und keine vollautomatisierten Entscheidungen über Personen treffen. Die finale Entscheidung liegt immer beim menschlichen Nutzer.</p>
            <p>Wir beobachten die Entwicklung des EU AI Act und passen diese Richtlinie bei Bedarf an.</p>
          </section>

          {/* 8. Haftungsausschluss */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">8. Haftungsausschluss für KI-Ausgaben</h2>
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="font-semibold text-foreground text-sm mb-2">Wichtiger Haftungsausschluss</p>
              <p className="text-sm">KI-generierte Inhalte in Decivio — einschließlich Risikoanalysen, Empfehlungen, Briefings und Szenario-Simulationen — stellen keine Rechts-, Finanz-, Personal- oder sonstige Fachberatung dar.</p>
              <p className="text-sm mt-2">Die KI-Ausgaben basieren auf Mustern in den eingegebenen Daten und können fehlerhaft, unvollständig oder irreführend sein. Der Nutzer ist allein verantwortlich für die Überprüfung und die daraus resultierenden Entscheidungen.</p>
              <p className="text-sm mt-2">Die Decivio GmbH übernimmt keine Haftung für Schäden, die aus der Nutzung oder dem Vertrauen auf KI-generierte Inhalte entstehen, soweit dies gesetzlich zulässig ist.</p>
            </div>
          </section>

          {/* 9. Änderungen */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">9. Änderungen dieser Richtlinie</h2>
            <p>Wir informieren über wesentliche Änderungen dieser Richtlinie per E-Mail und über eine In-App-Benachrichtigung mindestens 30 Tage vor Inkrafttreten der Änderungen.</p>
          </section>

          {/* 10. Kontakt */}
          <section>
            <h2 className="text-foreground text-lg font-semibold">10. Kontakt</h2>
            <p>Bei Fragen zu dieser KI-Datenverarbeitungsrichtlinie wenden Sie sich an:</p>
            <p>Decivio GmbH<br />E-Mail: datenschutz@decivio.com</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">Verwandte Dokumente: <Link to="/dpa" className="text-primary hover:underline">Auftragsverarbeitungsvertrag (AVV)</Link> · <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> · <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link></p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default AiDataPolicy;

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
          <p className="text-sm font-medium text-foreground">gemäß Art. 28 Datenschutz-Grundverordnung (DSGVO)</p>
          <p className="text-xs">Gilt für alle Decivio-Pläne (Starter, Professional, Enterprise)</p>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 1 Gegenstand und Dauer</h2>
            <p>(1) Dieser Auftragsverarbeitungsvertrag (nachfolgend "AVV") regelt die Rechte und Pflichten des Auftraggebers als Verantwortlicher und des Auftragnehmers als Auftragsverarbeiter im Sinne des Art. 28 DSGVO.</p>
            <p>(2) Gegenstand der Auftragsverarbeitung ist die Bereitstellung der Software-as-a-Service-Lösung "Decivio" — eine Decision Management Platform — gemäß dem zwischen den Parteien geschlossenen Hauptvertrag (Nutzungsvertrag / Subscription Agreement).</p>
            <p>(3) Dieser AVV gilt für die Dauer des Hauptvertrags. Er endet automatisch mit dem Ende des Hauptvertrags, unbeschadet etwaiger Pflichten zur Datenlöschung oder -rückgabe.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 2 Art und Zweck der Verarbeitung</h2>
            <p>(1) Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich im Rahmen der Bereitstellung der Decivio-Plattform und auf dokumentierte Weisung des Auftraggebers.</p>

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

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 3 Pflichten des Auftragnehmers</h2>
            <p>(1) Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich auf dokumentierte Weisung des Auftraggebers, es sei denn, er ist nach dem Recht der Europäischen Union oder der Mitgliedstaaten, dem er unterliegt, zur Verarbeitung verpflichtet.</p>
            <p>(2) Der Auftragnehmer stellt sicher, dass sich die zur Verarbeitung personenbezogener Daten befugten Personen zur Vertraulichkeit verpflichtet haben oder einer angemessenen gesetzlichen Verschwiegenheitspflicht unterliegen.</p>
            <p>(3) Der Auftragnehmer ergreift alle erforderlichen Maßnahmen gemäß Art. 32 DSGVO. Dies umfasst insbesondere:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verschlüsselung der Daten bei der Übertragung (TLS/HTTPS) und im Ruhezustand (AES-256)</li>
              <li>Pseudonymisierung wo technisch sinnvoll und möglich</li>
              <li>Maßnahmen zur Sicherstellung der dauerhaften Vertraulichkeit, Integrität und Verfügbarkeit</li>
              <li>Row-Level Security (RLS) zur mandantengetrennten Datenhaltung</li>
              <li>Multi-Faktor-Authentifizierung (MFA) als Option für alle Nutzer</li>
              <li>Regelmäßige Datensicherungen</li>
              <li>Zugriffsprotokollierung über den vollständigen Audit Trail</li>
            </ul>
            <p>(4) Der Auftragnehmer unterstützt den Auftraggeber bei der Einhaltung der in den Art. 32 bis 36 DSGVO genannten Pflichten.</p>
            <p>(5) Der Auftragnehmer löscht nach Wahl des Auftraggebers alle personenbezogenen Daten nach Abschluss der Erbringung der Verarbeitungsleistungen oder gibt sie zurück, sofern nicht nach dem Unionsrecht oder dem Recht der Mitgliedstaaten eine Verpflichtung zur Speicherung besteht.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 4 Weisungsrecht des Auftraggebers</h2>
            <p>(1) Der Auftraggeber hat das Recht, dem Auftragnehmer Weisungen bezüglich der Verarbeitung personenbezogener Daten zu erteilen. Weisungen sind schriftlich (einschließlich E-Mail) zu erteilen.</p>
            <p>(2) Hält der Auftragnehmer eine Weisung für rechtswidrig, teilt er dies dem Auftraggeber unverzüglich mit. Er ist berechtigt, die Ausführung der entsprechenden Weisung auszusetzen, bis der Auftraggeber die Weisung bestätigt oder ändert.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 5 Unterauftragsverarbeiter (Sub-Processor)</h2>
            <p>(1) Der Auftragnehmer ist berechtigt, Unterauftragsverarbeiter einzusetzen. Er informiert den Auftraggeber über beabsichtigte Änderungen hinsichtlich der Hinzuziehung oder des Austauschs von Unterauftragsverarbeitern, wobei dem Auftraggeber die Möglichkeit gegeben wird, diesen Änderungen zu widersprechen.</p>
            <p>(2) Die zum Zeitpunkt des Vertragsschlusses eingesetzten Unterauftragsverarbeiter sind in der <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> aufgeführt und vom Auftraggeber genehmigt.</p>
            <p>(3) Der Auftragnehmer schließt mit jedem Unterauftragsverarbeiter einen Vertrag, der diesem die gleichen Datenschutzpflichten auferlegt wie dieser AVV dem Auftragnehmer.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 6 KI-Verarbeitung — Besondere Regelungen</h2>
            <p>(1) Die Decivio-Plattform bietet optionale KI-gestützte Funktionen (nachfolgend "KI-Features"), die den Einsatz externer KI-Dienste von Drittanbietern erfordern. Eine vollständige Liste der eingesetzten KI-Dienste ist in der <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> enthalten.</p>
            <p>(2) Die Nutzung der KI-Features durch den Auftraggeber gilt als ausdrückliche Einwilligung zur Übermittlung der für die jeweilige Funktion erforderlichen Daten an die genannten KI-Drittanbieter. Der Auftraggeber kann KI-Features in den Einstellungen deaktivieren.</p>
            <p>(3) Der Auftragnehmer stellt sicher, dass:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nur die für die jeweilige KI-Funktion notwendigen Daten übermittelt werden (Datensparsamkeit)</li>
              <li>Die Übermittlung auf Basis der Standardvertragsklauseln (SCCs) der EU-Kommission erfolgt</li>
              <li>Die KI-Drittanbieter vertraglich verpflichtet sind, die Daten nicht für das Training ihrer Modelle zu verwenden</li>
              <li>Keine besonderen Kategorien personenbezogener Daten gemäß Art. 9 DSGVO an KI-Dienste übermittelt werden</li>
            </ul>
            <p>(4) Der Auftragnehmer empfiehlt dem Auftraggeber, keine besonders sensiblen Informationen (z.B. personenbezogene Gesundheitsdaten, politische Meinungen) in Entscheidungsbeschreibungen zu erfassen, die für KI-Analysen genutzt werden.</p>
            <p>Weitere Details finden Sie in unserer <Link to="/ai-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link>.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 7 Rechte betroffener Personen</h2>
            <p>(1) Der Auftragnehmer unterstützt den Auftraggeber soweit möglich durch geeignete technische und organisatorische Maßnahmen dabei, seiner Pflicht zur Beantwortung von Anfragen betroffener Personen zur Wahrnehmung ihrer Rechte gemäß Kapitel III DSGVO nachzukommen.</p>
            <p>(2) Soweit betroffene Personen ihre Rechte (Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch) direkt beim Auftragnehmer geltend machen, leitet dieser die Anfragen unverzüglich an den Auftraggeber weiter.</p>
            <p>(3) Der Auftragnehmer stellt technische Mittel bereit, die dem Auftraggeber die Wahrnehmung seiner Pflichten ermöglichen, insbesondere den vollständigen Daten-Export (JSON) sowie die Datenlöschung über die Plattform-Einstellungen.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 8 Meldung von Datenschutzverletzungen</h2>
            <p>(1) Der Auftragnehmer meldet dem Auftraggeber Verletzungen des Schutzes personenbezogener Daten unverzüglich, spätestens jedoch innerhalb von 48 Stunden nach Bekanntwerden.</p>
            <p>(2) Die Meldung enthält mindestens:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Art der Verletzung und betroffene Datenkategorien</li>
              <li>Ungefähre Anzahl betroffener Personen und Datensätze</li>
              <li>Wahrscheinliche Folgen der Verletzung</li>
              <li>Ergriffene oder vorgeschlagene Maßnahmen</li>
              <li>Kontaktdaten des Datenschutzbeauftragten oder Ansprechpartners</li>
            </ul>
            <p>(3) Meldungen erfolgen per E-Mail an die vom Auftraggeber benannte Kontaktadresse sowie über das Decivio-Support-System.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 9 Kontrollrechte des Auftraggebers</h2>
            <p>(1) Der Auftraggeber hat das Recht, die Einhaltung der Vorschriften über den Datenschutz und die vertraglichen Vereinbarungen beim Auftragnehmer zu kontrollieren.</p>
            <p>(2) Der Auftragnehmer stellt dem Auftraggeber auf Anfrage alle erforderlichen Informationen zum Nachweis der Einhaltung der in Art. 28 DSGVO niedergelegten Pflichten zur Verfügung.</p>
            <p>(3) Der Auftragnehmer ist berechtigt, anstelle einer direkten Prüfung durch den Auftraggeber, einen Nachweis durch Vorlage eines aktuellen Prüfberichts eines unabhängigen sachkundigen Prüfers zu erbringen.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 10 Datenlöschung und -rückgabe</h2>
            <p>(1) Nach Beendigung des Hauptvertrags löscht der Auftragnehmer alle personenbezogenen Daten des Auftraggebers innerhalb von 30 Tagen, sofern keine gesetzliche Aufbewahrungspflicht besteht.</p>
            <p>(2) Auf Anfrage stellt der Auftragnehmer vor der Löschung einen vollständigen Datenexport im JSON-Format bereit. Diese Möglichkeit besteht für 30 Tage nach Vertragsende.</p>
            <p>(3) Die erfolgte Löschung wird dem Auftraggeber schriftlich bestätigt.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">§ 11 Schlussbestimmungen</h2>
            <p>(1) Sollten einzelne Bestimmungen dieses AVV unwirksam sein oder werden, berührt dies die Gültigkeit des AVV im Übrigen nicht.</p>
            <p>(2) Änderungen und Ergänzungen dieses AVV bedürfen der Schriftform.</p>
            <p>(3) Es gilt das Recht der Bundesrepublik Deutschland.</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">Verwandte Dokumente: <Link to="/ai-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link> · <Link to="/sub-processors" className="text-primary hover:underline">Sub-Processor Liste</Link> · <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link> · <Link to="/terms" className="text-primary hover:underline">AGB</Link></p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default DataProcessingAgreement;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfService = () => (
  <>
    <Helmet>
      <title>AGB — Decivio</title>
      <meta name="description" content="Allgemeine Geschäftsbedingungen der Decivio Plattform." />
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
          <p className="text-xs">Zuletzt aktualisiert: 23. Februar 2026</p>

          <section>
            <h2 className="text-foreground text-lg font-semibold">1. Geltungsbereich</h2>
            <p>Diese AGB gelten für die Nutzung der Decivio-Plattform ("Service"), bereitgestellt durch die Decivio GmbH ("Anbieter").</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">2. Leistungsbeschreibung</h2>
            <p>Decivio bietet eine SaaS-Plattform für strukturiertes Entscheidungsmanagement, inklusive KI-gestützter Analysen, Team-Kollaboration und Governance-Workflows.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">3. Nutzungsbedingungen</h2>
            <p>Der Nutzer verpflichtet sich, den Service nur für rechtmäßige Zwecke zu nutzen, Zugangsdaten vertraulich zu behandeln und keine Störung des Services zu verursachen.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">4. Datenschutz</h2>
            <p>Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link> und der DSGVO.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">5. Verfügbarkeit</h2>
            <p>Wir streben eine Verfügbarkeit von 99,9% an. Geplante Wartungsfenster werden mindestens 48 Stunden im Voraus angekündigt.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">6. Haftung</h2>
            <p>Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt, soweit gesetzlich zulässig.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">7. Kündigung</h2>
            <p>Der Nutzer kann den Service jederzeit kündigen. Nach Kündigung werden Daten gemäß den Aufbewahrungsfristen gelöscht.</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">8. Schlussbestimmungen</h2>
            <p>Es gilt deutsches Recht. Gerichtsstand ist der Sitz des Anbieters. Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen bestehen.</p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default TermsOfService;

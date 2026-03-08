import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Link2 } from "lucide-react";

const subProcessors = [
  { name: "Lovable Technologies", purpose: "Plattform-Infrastruktur, Hosting, Datenbank, Authentifizierung & Edge Functions (via Lovable Cloud, EU-Region Frankfurt)", location: "EU", transfer: "Nein", legal: "DPA" },
  { name: "Stripe Inc.", purpose: "Zahlungsabwicklung (Kreditkarte, SEPA-Lastschrift)", location: "USA (EU-Entity vorhanden)", transfer: "Ja (EU→US)", legal: "SCCs + Stripe DPA" },
  { name: "Google LLC", purpose: "KI-Verarbeitung (Gemini) — nur bei Nutzung von KI-Features", location: "USA", transfer: "Ja (EU→US)", legal: "SCCs + Google API DPA" },
  { name: "OpenAI LLC", purpose: "KI-Verarbeitung (GPT) — optional, nur bei Nutzung", location: "USA", transfer: "Ja (EU→US)", legal: "SCCs + OpenAI DPA" },
];

const SubProcessors = () => (
  <>
    <Helmet>
      <title>Sub-Processor Liste — Decivio</title>
      <meta name="description" content="Vollständige Liste aller Unterauftragsverarbeiter der Decivio Plattform gemäß Art. 28 DSGVO." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Link2 className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Sub-Processor Liste</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Anlage 1 zum <Link to="/dpa" className="text-primary hover:underline">Auftragsverarbeitungsvertrag (AVV)</Link></p>
          <p>Gemäß Art. 28 Abs. 3 lit. d DSGVO informieren wir über alle eingesetzten Unterauftragsverarbeiter, die im Rahmen der Decivio-Plattform personenbezogene Daten verarbeiten können.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Anbieter</th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Zweck</th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Sitz</th>
                  <th className="text-left py-2 pr-3 font-semibold text-foreground">Übermittlung</th>
                  <th className="text-left py-2 font-semibold text-foreground">Rechtsgrundlage</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {subProcessors.map(sp => (
                  <tr key={sp.name} className="border-b border-border/40">
                    <td className="py-2.5 pr-3 font-medium text-foreground whitespace-nowrap">{sp.name}</td>
                    <td className="py-2.5 pr-3">{sp.purpose}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{sp.location}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{sp.transfer}</td>
                    <td className="py-2.5 whitespace-nowrap">{sp.legal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Änderungen der Sub-Processor Liste</h2>
            <p>Wir informieren über Änderungen der Sub-Processor Liste per E-Mail mit mindestens 30 Tagen Vorlauf. Auftraggeber können Änderungen widersprechen. Im Widerspruchsfall haben beide Parteien das Recht, den Vertrag außerordentlich zu kündigen.</p>
          </section>

          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground/60">Verwandte Dokumente: <Link to="/dpa" className="text-primary hover:underline">AVV</Link> · <Link to="/ai-data-policy" className="text-primary hover:underline">KI-Datenverarbeitungsrichtlinie</Link> · <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link></p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default SubProcessors;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";

const Imprint = () => (
  <>
    <Helmet>
      <title>Impressum — Decivio</title>
      <meta name="description" content="Impressum der Decivio GmbH." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Building2 className="w-8 h-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Impressum</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-foreground text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
            <p>
              Decivio GmbH<br />
              Musterstraße 42<br />
              10115 Berlin<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Vertreten durch</h2>
            <p>Geschäftsführer: [Name einfügen]</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Kontakt</h2>
            <p>
              Telefon: +49 (0) 30 12345678<br />
              E-Mail: info@decivio.com
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Registereintrag</h2>
            <p>
              Handelsregister: Amtsgericht Berlin-Charlottenburg<br />
              Registernummer: HRB [Nummer einfügen]
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Umsatzsteuer-ID</h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß §27a UStG: DE [Nummer einfügen]</p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Datenschutzbeauftragter</h2>
            <p>
              Kontakt: datenschutz@decivio.com<br />
              Weitere Informationen finden Sie in unserer <Link to="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Streitbeilegung</h2>
            <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default Imprint;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";

const Imprint = () => (
  <>
    <Helmet>
      <title>Impressum — Decivio</title>
      <meta name="description" content="Impressum von Decivio — Angaben gemäß § 5 TMG." />
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
          <p className="text-xs">Stand: März 2026</p>

          {/* ⚠️ TODO: Vor Go-Live alle ✏️-Platzhalter mit echten Angaben ersetzen! */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-warning">⚠️ Entwurf — Felder mit ✏️ müssen vor Veröffentlichung ausgefüllt werden</p>
          </div>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Angaben gemäß § 5 TMG</h2>
            <h3 className="text-foreground text-base font-semibold mt-4">Verantwortlich für den Inhalt</h3>
            <p>
              ✏️ Vollständiger Name des Inhabers<br />
              ✏️ Straße und Hausnummer<br />
              ✏️ PLZ und Ort<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Kontakt</h2>
            <p>
              E-Mail: hallo@decivio.com<br />
              Website: <a href="https://decivio.com" className="text-primary hover:underline">https://decivio.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
            <p>✏️ USt-IdNr. gemäß §27a UStG eintragen</p>
            <p className="text-xs text-muted-foreground/60">
              Hinweis: Kleinunternehmer gemäß § 19 UStG sind von der Angabe befreit, müssen dies aber entsprechend vermerken.
              Bitte klären ob Regelbesteuerung oder Kleinunternehmerregelung gilt.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              ✏️ Vollständiger Name<br />
              ✏️ Adresse
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen, da Decivio ausschließlich Leistungen an
              Unternehmer (B2B) erbringt.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach
              den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter
              jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu
              überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst
              ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
              von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich.
            </p>
            <p>
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße
              überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
              permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
              Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Urheberrecht</h2>
            <p>
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung
              des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den
              privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
              Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche
              gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden,
              bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden
              wir derartige Inhalte umgehend entfernen.
            </p>
          </section>
        </div>
      </div>
    </div>
  </>
);

export default Imprint;

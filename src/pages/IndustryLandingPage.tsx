import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Quote, ChevronDown, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { getIndustryLanding, industryLandings } from "@/lib/industryLandings";
import NotFound from "./NotFound";
import { Slider } from "@/components/ui/slider";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── ROI Calculator ─────────────────────────────────── */
const IndustryRoiCalculator = ({ preset }: { preset: { people: number; hourlyRate: number; delayDays: number; openDecisions: number } }) => {
  const [people, setPeople] = useState(preset.people);
  const [rate, setRate] = useState(preset.hourlyRate);
  const [days, setDays] = useState(preset.delayDays);
  const [decisions, setDecisions] = useState(preset.openDecisions);

  const monthlyCost = useMemo(() => Math.round(rate * 8 * people * decisions * days / 4.3), [rate, people, decisions, days]);
  const savings = useMemo(() => Math.round(monthlyCost * 0.55), [monthlyCost]);

  return (
    <div className="rounded-2xl border border-border/40 bg-background p-6 md:p-8">
      <h3 className="text-lg font-bold mb-6">ROI-Rechner für Ihre Branche</h3>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Betroffene Personen pro Entscheidung</span>
              <span className="font-semibold">{people}</span>
            </div>
            <Slider value={[people]} onValueChange={([v]) => setPeople(v)} min={1} max={10} step={1} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Ø Stundensatz (€)</span>
              <span className="font-semibold">€{rate}</span>
            </div>
            <Slider value={[rate]} onValueChange={([v]) => setRate(v)} min={40} max={200} step={5} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Verzögerung in Tagen</span>
              <span className="font-semibold">{days} Tage</span>
            </div>
            <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={20} step={1} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Offene Entscheidungen</span>
              <span className="font-semibold">{decisions}</span>
            </div>
            <Slider value={[decisions]} onValueChange={([v]) => setDecisions(v)} min={1} max={30} step={1} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground mb-2">Monatliche Verzögerungskosten</p>
          <p className="text-3xl md:text-4xl font-bold text-destructive mb-4">
            €{monthlyCost.toLocaleString("de-DE")}
          </p>
          <div className="w-full h-px bg-border my-4" />
          <p className="text-sm text-muted-foreground mb-2">Einsparung mit Decivio (55%)</p>
          <p className="text-2xl md:text-3xl font-bold text-primary">
            €{savings.toLocaleString("de-DE")}<span className="text-base font-normal text-muted-foreground">/Monat</span>
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            ROI: {Math.round(savings / 149)}x vs. Professional Plan (€149/Monat)
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── FAQ Accordion ──────────────────────────────────── */
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex items-center justify-between text-left"
      >
        <span className="font-medium text-sm pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-4 text-sm text-muted-foreground leading-relaxed"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────── */
const IndustryLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const industry = getIndustryLanding(slug || "");

  if (!industry) return <NotFound />;

  const Icon = industry.icon;
  const ctaUrl = `/auth?branche=${industry.slug}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": industry.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{industry.metaTitle}</title>
        <meta name="description" content={industry.metaDescription} />
        <meta property="og:title" content={industry.metaTitle} />
        <meta property="og:description" content={industry.metaDescription} />
        <meta property="og:image" content="https://decivio.com/og-image.png" />
        <meta property="og:url" content={`https://decivio.com/branchen/${industry.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={industry.metaTitle} />
        <meta name="twitter:description" content={industry.metaDescription} />
        <link rel="canonical" href={`https://decivio.com/branchen/${industry.slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-primary tracking-tight">DECIVIO</Link>
            <div className="flex items-center gap-3">
              <Link to="/#industries" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
                Alle Branchen
              </Link>
              <Link
                to={ctaUrl}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Kostenlos testen
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.04),transparent_60%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${industry.color.replace(")", " / 0.1)")}` }}
                >
                  <Icon className="w-6 h-6" style={{ color: industry.color }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {industry.compliance.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-primary/15 bg-primary/[0.04] text-primary">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
                {industry.headline}
              </h1>

              {/* Hero Pain — the big stat */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4 mb-6 max-w-2xl">
                <p className="text-base md:text-lg font-medium text-destructive flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                  {industry.heroPain}
                </p>
              </div>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
                {industry.subheadline}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={ctaUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  {industry.ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border font-medium hover:bg-muted/50 transition-colors"
                >
                  Live-Demo buchen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Logo Bar */}
        <section className="py-8 border-y border-border/30 bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-xs text-muted-foreground text-center mb-4">Vertrauen von Unternehmen wie</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {industry.logoBar.map(name => (
                <div key={name} className="flex items-center gap-2 text-muted-foreground/60">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              {industry.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease }}
                >
                  <div className="text-2xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm opacity-80">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Kennen Sie das?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {industry.painPoints.map((pain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease }}
                  className="p-5 rounded-xl border border-destructive/20 bg-destructive/[0.03]"
                >
                  <AlertTriangle className="w-5 h-5 text-destructive mb-3" />
                  <p className="text-sm leading-relaxed">{pain}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-semibold mb-3 tracking-[0.2em] uppercase text-primary">Use Cases</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              So nutzen {industry.name}-Unternehmen Decivio
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {industry.useCases.map((uc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  className="p-5 rounded-xl border border-border/40 bg-background"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{uc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-semibold mb-3 tracking-[0.2em] uppercase text-primary">ROI Berechnung</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              Was kosten verzögerte Entscheidungen in Ihrem {industry.name}-Unternehmen?
            </h2>
            <IndustryRoiCalculator preset={industry.roiPreset} />
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="p-8 rounded-2xl border border-border/40 bg-background relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-6 left-6" />
              <blockquote className="text-lg leading-relaxed mb-4 pl-6">
                "{industry.testimonial.quote}"
              </blockquote>
              <div className="pl-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {industry.testimonial.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{industry.testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{industry.testimonial.role}</div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-4 pl-6">Name und Details anonymisiert</p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Häufige Fragen — {industry.name}</h2>
            <div className="rounded-2xl border border-border/40 bg-background p-6">
              {industry.faqs.map((faq, i) => (
                <FaqItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Bereit für bessere Entscheidungen im {industry.name}?
            </h2>
            <p className="text-sm opacity-80 mb-8 max-w-lg mx-auto">
              In 3 Minuten zur ersten Entscheidung. Kostenlos starten, keine Kreditkarte nötig.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={ctaUrl}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-background text-foreground font-medium hover:bg-background/90 transition-colors"
              >
                {industry.ctaLabel} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary-foreground/30 font-medium hover:bg-primary-foreground/10 transition-colors"
              >
                Demo vereinbaren
              </Link>
            </div>
          </div>
        </section>

        {/* Other Industries */}
        <section className="py-12 border-t border-border/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <p className="text-sm font-semibold mb-4">Weitere Branchen</p>
            <div className="flex flex-wrap gap-2">
              {industryLandings.filter(il => il.slug !== industry.slug).map(il => (
                <Link
                  key={il.slug}
                  to={`/branchen/${il.slug}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 hover:border-primary/30 hover:bg-primary/[0.03] transition-all"
                >
                  {il.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="text-sm font-bold text-primary">DECIVIO</Link>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Datenschutz</Link>
              <Link to="/imprint" className="hover:text-foreground transition-colors">Impressum</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">AGB</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default IndustryLandingPage;

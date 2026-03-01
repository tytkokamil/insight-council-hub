import { motion } from "framer-motion";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "/Monat",
    desc: "Für Einzelpersonen und erste Tests.",
    highlighted: false,
    cta: "Kostenlos starten",
    ctaLink: "/auth",
    features: [
      { label: "1 Nutzer", included: true },
      { label: "10 Entscheidungen", included: true },
      { label: "30 Tage Audit Trail", included: true },
      { label: "Basis-Vorlagen", included: true },
      { label: "Kein Team", included: false },
      { label: "Kein KI Daily Brief", included: false },
      { label: "Kein SLA-System", included: false },
    ],
  },
  {
    name: "Professional",
    price: "€149",
    period: "/Monat",
    desc: "Für Teams die Entscheidungen professionell managen.",
    highlighted: true,
    cta: "14 Tage kostenlos testen",
    ctaLink: "/auth",
    hint: "= weniger als 1,5 Stunden vermiedene Verzögerung/Monat",
    features: [
      { label: "Bis 25 Nutzer", included: true },
      { label: "Unbegrenzte Entscheidungen", included: true },
      { label: "Vollständiger Audit Trail", included: true },
      { label: "KI Daily Brief täglich", included: true },
      { label: "SLA & Eskalationen", included: true },
      { label: "Branchen-Templates", included: true },
      { label: "One-Click Approval", included: true },
      { label: "Predictive SLA", included: true },
      { label: "Compliance-Kalender", included: true },
      { label: "Anomalie-Erkennung", included: true },
      { label: "Webhooks & Teams", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Individuell",
    period: "",
    desc: "Für Unternehmen mit besonderen Anforderungen.",
    highlighted: false,
    cta: "Kontakt aufnehmen",
    ctaLink: "mailto:sales@decivio.com",
    features: [
      { label: "Unbegrenzte Nutzer", included: true },
      { label: "Alles aus Professional", included: true },
      { label: "SSO/SAML", included: true },
      { label: "Custom Branding", included: true },
      { label: "Dedicated Success Manager", included: true },
      { label: "SLA-Garantie 99,9%", included: true },
      { label: "On-Premise Option", included: true },
    ],
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Preise</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Transparente Preise. Kein Versteckspiel.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Alle Pläne mit 14 Tagen kostenloser Testphase. Keine Kreditkarte nötig.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
        {plans.map((plan, i) => {
          const isMailto = plan.ctaLink.startsWith("mailto:");
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7, ease }}
              whileHover={{ y: -4 }}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-300 ${
                plan.highlighted
                  ? "border-primary/30 bg-card shadow-lg scale-[1.03] hover:shadow-xl"
                  : "border-border bg-card hover:shadow-md hover:border-primary/15"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[10px] font-bold bg-primary text-primary-foreground mb-4 tracking-wide">
                  <Sparkles className="w-3 h-3" /> Empfohlen
                </span>
              )}

              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-3xl font-bold text-foreground tabular-nums">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

              {isMailto ? (
                <a href={plan.ctaLink} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors mb-6">
                  {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link to={plan.ctaLink} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : "border border-border text-foreground hover:bg-muted"
                }`}>
                  {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {plan.hint && (
                <p className="text-[11px] text-muted-foreground text-center -mt-4 mb-5 italic">{plan.hint}</p>
              )}

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-[13px]">
                    {f.included ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? "text-muted-foreground" : "text-muted-foreground/40 line-through"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default PricingSection;

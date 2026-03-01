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
        <p className="text-xs font-semibold text-[hsl(217,91%,60%)] mb-4 tracking-[0.2em] uppercase">Preise</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Transparente Preise. Kein Versteckspiel.
        </h2>
        <p className="text-[hsl(215,20%,65%)] leading-relaxed">
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
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlighted
                  ? "border-[hsl(217,91%,60%)]/30 bg-[hsl(216,40%,11%)] shadow-[0_0_40px_-10px_hsl(217,91%,60%/0.2)] scale-[1.03]"
                  : "border-white/[0.06] bg-[hsl(216,40%,11%)]"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[10px] font-bold bg-[hsl(217,91%,60%)] text-white mb-4 tracking-wide">
                  <Sparkles className="w-3 h-3" /> Empfohlen
                </span>
              )}

              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-1">
                <span className="text-3xl font-bold text-white tabular-nums">{plan.price}</span>
                {plan.period && <span className="text-sm text-[hsl(215,16%,47%)]">{plan.period}</span>}
              </div>
              <p className="text-sm text-[hsl(215,20%,65%)] mb-6">{plan.desc}</p>

              {isMailto ? (
                <a href={plan.ctaLink} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/[0.1] text-white text-sm font-semibold hover:bg-white/[0.04] transition-colors mb-6">
                  {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <Link to={plan.ctaLink} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all mb-6 ${
                  plan.highlighted
                    ? "bg-[hsl(217,91%,60%)] text-white hover:bg-[hsl(217,91%,55%)] shadow-[0_0_20px_-4px_hsl(217,91%,60%/0.4)]"
                    : "border border-white/[0.1] text-white hover:bg-white/[0.04]"
                }`}>
                  {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {plan.hint && (
                <p className="text-[11px] text-[hsl(215,16%,47%)] text-center -mt-4 mb-5 italic">{plan.hint}</p>
              )}

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-[13px]">
                    {f.included ? (
                      <Check className="w-3.5 h-3.5 text-[hsl(175,84%,32%)] shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[hsl(215,16%,47%)]/40 shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? "text-[hsl(215,20%,65%)]" : "text-[hsl(215,16%,47%)]/40 line-through"}>
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

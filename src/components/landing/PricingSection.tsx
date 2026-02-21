import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "für immer kostenlos",
    description: "Für kleine Teams, die Struktur in ihre Entscheidungen bringen wollen.",
    features: [
      "Bis zu 5 Nutzer",
      "50 Entscheidungen / Monat",
      "Basis-Dashboard",
      "Audit Trail",
      "E-Mail-Support",
    ],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Business",
    price: "49",
    period: "pro Nutzer / Monat",
    description: "Für wachsende Teams mit Bedarf an KI-Analysen und Automatisierung.",
    features: [
      "Unbegrenzte Nutzer",
      "Unbegrenzte Entscheidungen",
      "KI Co-Pilot & Risiko-Scoring",
      "Szenario-Engine",
      "Auto-Eskalation",
      "Decision Graph",
      "CEO Briefing",
      "Prioritäts-Support",
    ],
    cta: "14 Tage kostenlos testen",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Individuell",
    period: "",
    description: "Maßgeschneidert für Konzerne mit höchsten Anforderungen.",
    features: [
      "Alles aus Business",
      "SSO & SAML",
      "Dedizierte Instanz",
      "Custom Integrationen",
      "SLA-Garantie 99,9%",
      "Onboarding & Training",
      "Dedicated Success Manager",
    ],
    cta: "Demo vereinbaren",
    highlighted: false,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const PricingSection = () => (
  <section id="pricing" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Preise</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Transparent und fair kalkuliert
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Starte kostenlos und skaliere mit deinem Team. Keine versteckten Kosten.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start pt-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease }}
            className={`group relative rounded-2xl border p-7 transition-all duration-300 ${
              plan.highlighted
                ? "border-foreground/20 bg-card"
                : "border-border bg-card hover:border-foreground/10"
            }`}
          >
            {plan.highlighted && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-foreground text-background tracking-wide">
                  Beliebteste Wahl
                </span>
              </div>
            )}

            <div className="relative">
              <h3 className="text-lg font-bold mb-4">{plan.name}</h3>
              <div className="mb-3">
                {plan.price === "Individuell" ? (
                  <span className="text-3xl font-bold">Individuell</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight tabular-nums">€{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                    )}
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-7">
                {plan.description}
              </p>
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full rounded-xl mb-8 group/btn"
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <ul className="space-y-3">
                {plan.features.map((feature, fi) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + fi * 0.04, duration: 0.4 }}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-foreground/40 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;

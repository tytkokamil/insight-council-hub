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

const PricingSection = () => (
  <section id="pricing" className="py-32 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-20"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-widest uppercase">Preise</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Transparent und
          <span className="gradient-text"> fair kalkuliert</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Starte kostenlos und skaliere mit deinem Team. Keine versteckten Kosten.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`relative rounded-2xl border p-8 transition-all duration-300 ${
              plan.highlighted
                ? "border-primary/30 bg-card shadow-lg shadow-primary/[0.04]"
                : "border-border/50 bg-card hover:border-border"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide">
                  Beliebteste Wahl
                </span>
              </div>
            )}

            <h3 className="font-display text-lg font-bold mb-4">{plan.name}</h3>

            <div className="mb-3">
              {plan.price === "Individuell" ? (
                <span className="font-display text-3xl font-bold">Individuell</span>
              ) : (
                <>
                  <span className="font-display text-4xl font-bold tracking-tight">€{plan.price}</span>
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
              variant={plan.highlighted ? "hero" : "outline"}
              className="w-full rounded-xl mb-8"
              size="lg"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;

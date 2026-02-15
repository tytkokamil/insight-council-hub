import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Building2, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    icon: Rocket,
    price: "0",
    period: "für immer kostenlos",
    description: "Ideal für kleine Teams, die ihre Entscheidungen strukturieren wollen.",
    features: [
      "Bis zu 5 Nutzer",
      "50 Entscheidungen / Monat",
      "Basis-Dashboard",
      "Audit Trail",
      "E-Mail-Support",
    ],
    cta: "Kostenlos starten",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Business",
    icon: Sparkles,
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
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Individuell",
    period: "",
    description: "Maßgeschneidert für Konzerne mit höchsten Sicherheits- und Compliance-Anforderungen.",
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
    variant: "outline" as const,
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">Preise</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Transparent und
            <span className="gradient-text block mt-1">fair kalkuliert</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Starte kostenlos und skaliere mit deinem Team. Keine versteckten Kosten.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`relative rounded-2xl border bg-card p-7 transition-all duration-300 ${
                plan.popular
                  ? "border-primary/40 shadow-lg shadow-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/20 hover:shadow-md"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20">
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.popular ? "bg-primary/15" : "bg-primary/8"
                }`}>
                  <plan.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">{plan.name}</h3>
              </div>

              <div className="mb-4">
                {plan.price === "Individuell" ? (
                  <span className="font-display text-3xl font-bold">Individuell</span>
                ) : (
                  <>
                    <span className="font-display text-4xl font-bold">€{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground ml-1.5">{plan.period}</span>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {plan.description}
              </p>

              <Button
                variant={plan.variant === "hero" ? "hero" : "outline"}
                className="w-full rounded-xl mb-7"
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
};

export default PricingSection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";

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
  <section id="pricing" className="py-32 relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.02] blur-[100px] pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-20"
      >
        <p className="text-xs font-medium text-primary mb-4 tracking-widest uppercase">Preise</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-5">
          {"Transparent und".split(" ").map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6, ease }}
            className="gradient-text inline-block"
          >
            fair kalkuliert
          </motion.span>
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-muted-foreground leading-relaxed"
        >
          Starte kostenlos und skaliere mit deinem Team. Keine versteckten Kosten.
        </motion.p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease }}
            className={`group relative rounded-2xl border p-8 transition-all duration-500 overflow-hidden ${
              plan.highlighted
                ? "border-primary/30 bg-card"
                : "border-border/40 bg-card hover:border-border"
            }`}
            style={{ boxShadow: plan.highlighted ? 'var(--shadow-elevated), 0 0 40px -10px hsl(var(--primary) / 0.08)' : 'var(--shadow-card)' }}
          >
            {plan.highlighted && (
              <>
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    Beliebteste Wahl
                  </span>
                </div>
              </>
            )}

            <div className="relative">
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
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
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

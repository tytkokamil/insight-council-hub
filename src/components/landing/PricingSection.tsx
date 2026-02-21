import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Shield, Globe, TrendingUp, Brain } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "pro Nutzer / Monat",
    description: "Für kleine Teams, die strukturierte Entscheidungen entdecken.",
    bestFor: "Startups und kleine Teams, die strukturierte Entscheidungs-Workflows testen.",
    features: [
      "1 Team",
      "Bis zu 5 Nutzer",
      "Core Decision Management",
      "6 Standard-Templates",
      "Basis Review-Flow (max. 2 Stufen)",
      "Dashboard (Kern-KPIs)",
      "Tasks + Kanban",
      "Kalender-Ansicht",
      "Knowledge Base (nur Lesen)",
      "Bis zu 30 Entscheidungen",
    ],
    cta: "Kostenlos starten",
    highlighted: false,
    checkColor: "text-accent-teal",
    borderColor: "border-border",
  },
  {
    name: "Pro",
    price: "39",
    period: "pro Nutzer / Monat",
    description: "Für Teams, die Geschwindigkeit, Governance und KI-Insights wollen.",
    bestFor: "Wachsende Teams, die messbare Entscheidungsqualität wollen.",
    features: [
      "Alles aus Starter, plus:",
      { label: "KI Risiko- & Impact-Analyse", ai: true },
      { label: "Decision Co-Pilot", ai: true },
      { label: "What-If Simulator", ai: true },
      "Decision Health Score",
      "Automation Rules",
      "Escalation Engine",
      "Bedingte Templates & Versionierung",
      "Cross-Team Sharing (read-only)",
      "Risk Register",
      "Template Analytics",
      "SLA-Konfiguration",
      "Decision Graph",
      "Saved Views & Global Search",
      "Knowledge Base (erstellen & bearbeiten)",
    ],
    cta: "Pro Trial starten",
    highlighted: true,
    checkColor: "text-primary",
    borderColor: "border-primary/30",
  },
  {
    name: "Business",
    price: "69",
    period: "pro Nutzer / Monat",
    description: "Für Unternehmen, die Governance über Abteilungen skalieren.",
    bestFor: "Organisationen, die Governance und strategisches Alignment formalisieren.",
    features: [
      "Alles aus Pro, plus:",
      "Executive Dashboard",
      "CEO Briefing",
      "Predictive Timeline",
      "Pattern Engine & Decision DNA",
      "Team Performance Benchmarking",
      "Health Heatmap",
      "Advanced Automation Rules",
      "Custom Review Flows",
      "Advanced Permissions",
      "Vertrauliche Entscheidungen",
      "Board & Executive Reports",
      "Vollständiger Datenexport",
    ],
    cta: "Auf Business upgraden",
    highlighted: false,
    checkColor: "text-accent-violet",
    borderColor: "border-accent-violet/20",
  },
  {
    name: "Enterprise",
    price: "Individuell",
    period: "",
    description: "Für Enterprise-Grade Governance und Compliance.",
    bestFor: "Enterprises, die sichere, konforme und skalierbare Decision Governance benötigen.",
    features: [
      "Alles aus Business, plus:",
      "SSO (SAML / Azure AD / Okta)",
      "SCIM Provisioning",
      "API Access",
      "BYOK (Bring Your Own AI Key)",
      "Data Residency Options",
      "Advanced Audit Export",
      "Custom Role Definitions",
      "SLA-Garantien",
      "Dediziertes Onboarding & Support",
      "Security & Compliance Review",
    ],
    cta: "Sales kontaktieren",
    highlighted: false,
    checkColor: "text-accent-rose",
    borderColor: "border-accent-rose/20",
  },
];

const trustBadges = [
  { icon: Shield, text: "Enterprise-Sicherheit (RLS, Audit Trail, Encryption)", color: "text-accent-teal" },
  { icon: Globe, text: "DSGVO-konform", color: "text-accent-blue" },
  { icon: TrendingUp, text: "Skaliert von 5 bis 5.000+ Nutzer", color: "text-accent-violet" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const PricingSection = () => (
  <section id="pricing" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Preise</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Flexible Preise für <span className="gradient-text">strukturierte Entscheidungen</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Von wachsenden Teams bis Enterprise-Governance — skalieren Sie Ihren Entscheidungsprozess mit Sicherheit.
        </p>
      </motion.div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.7, ease }}
            className={`group relative rounded-2xl border p-6 transition-all duration-300 flex flex-col ${
              plan.highlighted
                ? `${plan.borderColor} bg-card shadow-glow`
                : `${plan.borderColor} bg-card hover:border-foreground/10`
            }`}
          >
            {plan.highlighted && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide">
                  <Sparkles className="w-3 h-3" />
                  Beliebteste Wahl
                </span>
              </div>
            )}

            {/* Plan Name & Price */}
            <h3 className="text-lg font-bold mb-3">{plan.name}</h3>
            <div className="mb-2">
              {plan.price === "Individuell" ? (
                <span className="text-2xl font-bold gradient-text">Individuell</span>
              ) : (
                <>
                  <span className="text-3xl font-bold tracking-tight tabular-nums">€{plan.price}</span>
                  {plan.period && (
                    <span className="text-xs text-muted-foreground ml-1.5">{plan.period}</span>
                  )}
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {plan.description}
            </p>

            {/* CTA */}
            <Button
              variant={plan.highlighted ? "default" : "outline"}
              className="w-full rounded-xl mb-6 group/btn"
              size="lg"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>

            {/* Features */}
            <ul className="space-y-2.5 flex-1">
              {plan.features.map((feature, fi) => {
                const isObj = typeof feature === "object";
                const label = isObj ? feature.label : feature;
                const isAi = isObj && feature.ai;
                return (
                  <li key={fi} className="flex items-start gap-2 text-[13px]">
                    {isAi ? (
                      <Brain className="w-3.5 h-3.5 text-accent-violet shrink-0 mt-0.5" />
                    ) : (
                      <Check className={`w-3.5 h-3.5 ${plan.checkColor} shrink-0 mt-0.5`} />
                    )}
                    <span className={`${isAi ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Best For */}
            <div className="mt-6 pt-4 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground/70">
                <span className="font-semibold text-muted-foreground">Best for: </span>
                {plan.bestFor}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.7, ease }}
        className="mt-14 flex flex-wrap items-center justify-center gap-8 max-w-3xl mx-auto"
      >
        {trustBadges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2.5 text-muted-foreground">
            <badge.icon className={`w-4 h-4 ${badge.color} shrink-0`} />
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default PricingSection;

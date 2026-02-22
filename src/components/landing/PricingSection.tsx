import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Shield, Globe, TrendingUp, Brain } from "lucide-react";

const ANNUAL_DISCOUNT = 0.2; // 20% off

const plans = [
  {
    name: "Starter",
    monthlyPrice: 0,
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
    ctaLink: "/auth",
    highlighted: false,
    checkColor: "text-accent-teal",
    borderColor: "border-border",
  },
  {
    name: "Pro",
    monthlyPrice: 39,
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
    ctaLink: "/auth",
    highlighted: true,
    checkColor: "text-primary",
    borderColor: "border-primary/30",
  },
  {
    name: "Business",
    monthlyPrice: 69,
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
    ctaLink: "/auth",
    highlighted: false,
    checkColor: "text-accent-violet",
    borderColor: "border-accent-violet/20",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
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
    ctaLink: "mailto:sales@decivio.com",
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

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  const getPrice = (monthlyPrice: number | null) => {
    if (monthlyPrice === null) return null;
    if (monthlyPrice === 0) return 0;
    if (annual) return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT));
    return monthlyPrice;
  };

  return (
    <section id="pricing" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">Preise</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
            Flexible Preise für <span className="gradient-text">strukturierte Entscheidungen</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Von wachsenden Teams bis Enterprise-Governance — skalieren Sie Ihren Entscheidungsprozess mit Sicherheit.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
            Monatlich
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              annual ? "bg-primary" : "bg-muted"
            }`}
            aria-label="Abrechnungszeitraum wechseln"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ x: annual ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Jährlich
          </span>
          {annual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent-teal/10 text-accent-teal border border-accent-teal/20"
            >
              20% sparen
            </motion.span>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto items-start">
          {plans.map((plan, i) => {
            const price = getPrice(plan.monthlyPrice);
            return (
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
                <div className="mb-2 min-h-[40px]">
                  {price === null ? (
                    <span className="text-2xl font-bold gradient-text">Individuell</span>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold tracking-tight tabular-nums"
                      >
                        €{price}
                      </motion.span>
                      <span className="text-xs text-muted-foreground">
                        pro Nutzer / Monat
                      </span>
                      {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-muted-foreground/50 line-through tabular-nums ml-1"
                        >
                          €{plan.monthlyPrice}
                        </motion.span>
                      )}
                    </div>
                  )}
                </div>
                {annual && price !== null && price > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[11px] text-accent-teal font-medium mb-3"
                  >
                    €{price * 12}/Jahr (statt €{plan.monthlyPrice! * 12})
                  </motion.p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {plan.description}
                </p>

                {/* CTA */}
                {plan.ctaLink?.startsWith("mailto:") ? (
                  <a href={plan.ctaLink}>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl mb-6 group/btn"
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                ) : (
                  <Link to={plan.ctaLink!}>
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      className="w-full rounded-xl mb-6 group/btn"
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}

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
            );
          })}
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
};

export default PricingSection;

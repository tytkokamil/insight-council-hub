import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ArrowRight, Sparkles, ChevronDown, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

interface PlanFeature {
  label: string;
  included: boolean;
  divider?: string;
}

interface Plan {
  name: string;
  monthly: number | null;
  annual: number | null;
  desc: string;
  highlighted: boolean;
  cta: string;
  ctaLink: string;
  hint?: string;
  features: PlanFeature[];
  badge?: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Zum Kennenlernen. Keine Kreditkarte.",
    highlighted: false,
    cta: "Kostenlos starten",
    ctaLink: "/auth",
    features: [
      { label: "1 Nutzer", included: true },
      { label: "10 Entscheidungen", included: true },
      { label: "30 Tage Audit Trail", included: true },
      { label: "3 Standard-Templates", included: true },
      { label: "Basis-Benachrichtigungen", included: true },
      { label: "Kein Team", included: false },
      { label: "Kein KI Daily Brief", included: false },
      { label: "Keine Branchen-Templates", included: false },
      { label: "Keine Compliance", included: false },
    ],
  },
  {
    name: "Starter",
    monthly: 59,
    annual: 588,
    desc: "Für kleine Teams die strukturiert arbeiten wollen.",
    highlighted: false,
    cta: "14 Tage kostenlos testen",
    ctaLink: "/auth",
    features: [
      { label: "Bis 8 Nutzer", included: true },
      { label: "Unbegrenzte Entscheidungen", included: true },
      { label: "1 Jahr Audit Trail", included: true },
      { label: "Alle 15 Branchen-Templates", included: true },
      { label: "SLA-System & Eskalationen", included: true },
      { label: "One-Click Approval via E-Mail", included: true },
      { label: "Externe Reviewer", included: true },
      { label: "Risk Register", included: true },
      { label: "Meeting Mode", included: true },
      { label: "5 Automation Rules", included: true },
      { label: "1 Compliance Framework", included: true },
      { label: "Kein KI Daily Brief", included: false },
      { label: "Keine Analytics", included: false },
      { label: "Kein CoD Echtzeitzähler", included: false },
    ],
  },
  {
    name: "Professional",
    monthly: 149,
    annual: 1488,
    desc: "Vollständige Decision Intelligence für den Mittelstand.",
    highlighted: true,
    cta: "14 Tage kostenlos testen →",
    ctaLink: "/auth",
    hint: "ROI nach weniger als 2 Stunden vermiedener Verzögerung",
    badge: "Empfohlen",
    features: [
      { label: "Bis 25 Nutzer", included: true },
      { label: "Unlimitierter Audit Trail (SHA-256 gesichert)", included: true },
      { label: "", included: true, divider: "Alles aus Starter, plus:" },
      { label: "KI Daily Brief täglich 07:30 Uhr", included: true },
      { label: "Echtzeit Cost-of-Delay Zähler (live)", included: true },
      { label: "KI-Analyse & CoPilot pro Entscheidung", included: true },
      { label: "Anomalie-Erkennung (KI)", included: true },
      { label: "Alle Analytics-Module (9 Module)", included: true },
      { label: "Executive Hub & Board Reports", included: true },
      { label: "Alle Compliance Frameworks (NIS2, ISO, IATF, GMP, MaRisk)", included: true },
      { label: "Strategy Layer", included: true },
      { label: "Knowledge Base & Lessons Learned", included: true },
      { label: "War Room & What-If Simulator", included: true },
      { label: "Webhooks & MS Teams", included: true },
      { label: "Unbegrenzte Automation Rules", included: true },
      { label: "PDF-Export ohne Branding", included: true },
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    desc: "Für Unternehmen mit komplexen Anforderungen und 25+ Nutzern.",
    highlighted: false,
    cta: "Gespräch vereinbaren",
    ctaLink: "mailto:hallo@decivio.com",
    features: [
      { label: "Unbegrenzte Nutzer", included: true },
      { label: "Alles aus Professional", included: true },
      { label: "SSO / SAML", included: true },
      { label: "Custom Branding", included: true },
      { label: "On-Premise Option", included: true },
      { label: "Dedicated Success Manager", included: true },
      { label: "SLA-Garantie 99,9%", included: true },
      { label: "Admin-Konsole & Feature Flags", included: true },
      { label: "Onboarding-Workshop (remote)", included: true },
      { label: "Prioritäts-Support (< 4h)", included: true },
    ],
  },
];

const comparisonCategories = [
  {
    category: "Entscheidungen",
    rows: [
      { label: "Nutzer", values: ["1", "8", "25", "Unbegrenzt"] },
      { label: "Entscheidungen", values: ["10", "∞", "∞", "∞"] },
      { label: "Teams", values: ["—", "3", "∞", "∞"] },
      { label: "Aufgaben", values: ["20", "∞", "∞", "∞"] },
      { label: "Branchen-Templates", values: ["3 Basis", "Alle (15)", "Alle (15)", "Alle (15)"] },
    ],
  },
  {
    category: "Teams & Zusammenarbeit",
    rows: [
      { label: "Rollen & Berechtigungen", values: [false, true, true, true] },
      { label: "Meeting Mode / Decision Room", values: [false, true, true, true] },
      { label: "Team Chat", values: [false, true, true, true] },
      { label: "Externe Reviewer", values: [false, true, true, true] },
      { label: "One-Click Approval (E-Mail)", values: [false, true, true, true] },
    ],
  },
  {
    category: "Compliance & Audit",
    rows: [
      { label: "Audit Trail", values: ["30 Tage", "1 Jahr", "Unbegrenzt", "Unbegrenzt"] },
      { label: "Kryptographisch (SHA-256)", values: [false, false, true, true] },
      { label: "SLA-System & Eskalationen", values: [false, true, true, true] },
      { label: "Compliance Frameworks", values: ["—", "1", "Alle", "Alle"] },
      { label: "Risk Register", values: [false, true, true, true] },
      { label: "Automation Rules", values: ["—", "5", "∞", "∞"] },
    ],
  },
  {
    category: "KI & Analytics",
    rows: [
      { label: "KI Daily Brief", values: [false, false, true, true] },
      { label: "KI-Analyse & CoPilot", values: [false, false, true, true] },
      { label: "Cost-of-Delay Zähler (live)", values: [false, false, true, true] },
      { label: "Anomalie-Erkennung", values: [false, false, true, true] },
      { label: "Analytics Hub (9 Module)", values: [false, false, true, true] },
      { label: "Executive Hub & Board Reports", values: [false, false, true, true] },
      { label: "Strategy Layer", values: [false, false, true, true] },
      { label: "What-If Simulator", values: [false, false, true, true] },
      { label: "Predictive Timeline", values: [false, false, true, true] },
    ],
  },
  {
    category: "Integrationen",
    rows: [
      { label: "E-Mail Benachrichtigungen", values: [true, true, true, true] },
      { label: "WhatsApp", values: [false, true, true, true] },
      { label: "Webhooks", values: [false, false, true, true] },
      { label: "Microsoft Teams", values: [false, false, true, true] },
      { label: "Inbound E-Mail", values: [false, false, true, true] },
      { label: "Individuelle Integrationen", values: [false, false, false, true] },
    ],
  },
  {
    category: "Support & Sicherheit",
    rows: [
      { label: "SSO / SAML", values: [false, false, false, true] },
      { label: "Custom Branding", values: [false, false, false, true] },
      { label: "Dedicated Success Manager", values: [false, false, false, true] },
      { label: "On-Premise Option", values: [false, false, false, true] },
      { label: "Prioritäts-Support (< 4h)", values: [false, false, false, true] },
      { label: "PDF ohne Branding", values: [false, false, true, true] },
    ],
  },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Preise</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Transparent. Fair. Skalierbar.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Alle Pläne mit 14 Tagen kostenloser Testphase. Keine Kreditkarte nötig.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="relative inline-flex items-center rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                annual ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Jährlich
            </button>
            {/* Savings badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-success text-success-foreground shadow-sm"
            >
              −17%
            </motion.span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, i) => {
            const isMailto = plan.ctaLink.startsWith("mailto:");
            const perMonth =
              plan.monthly === null
                ? null
                : annual && plan.annual !== null
                ? Math.round(plan.annual / 12)
                : plan.monthly;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6, ease }}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-primary/30 bg-card shadow-elevated scale-[1.02] z-10 ring-1 ring-primary/10"
                    : "border-border/60 bg-card/80 hover:border-border hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide">
                    <Sparkles className="w-3 h-3" /> {plan.badge}
                  </span>
                )}

                {plan.monthly === null && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/20 tracking-wide w-fit mb-2">
                    <Crown className="w-3 h-3" /> Enterprise
                  </span>
                )}

                <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-3">
                  {plan.name}
                </p>

                <div className="flex items-baseline gap-1 mb-1 min-h-[44px]">
                  {perMonth === null ? (
                    <span className="text-2xl font-bold text-foreground">Ab €499</span>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${perMonth}-${annual}`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.25, ease }}
                          className="text-3xl font-bold text-foreground tabular-nums"
                        >
                          €{perMonth}
                        </motion.span>
                      </AnimatePresence>
                      {perMonth > 0 && <span className="text-sm text-muted-foreground">/Monat</span>}
                    </>
                  )}
                </div>

                {annual && plan.annual !== null && plan.annual > 0 && (
                  <p className="text-[11px] text-muted-foreground mb-1">
                    €{plan.annual} / Jahr abgerechnet
                  </p>
                )}
                {!annual && plan.monthly !== null && plan.monthly > 0 && annual === false && plan.annual !== null && (
                  <p className="text-[11px] text-success/80 mb-1">
                    Spare €{(plan.monthly * 12) - plan.annual} / Jahr mit jährlicher Zahlung
                  </p>
                )}

                <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">{plan.desc}</p>

                {isMailto ? (
                  <a
                    href={plan.ctaLink}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-muted/50 transition-colors mb-2"
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to={plan.ctaLink}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all mb-2 ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]"
                        : "border border-border/60 text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {plan.cta} {!plan.cta.includes("→") && <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                )}

                {plan.hint && (
                  <p className="text-[10px] text-muted-foreground text-center mb-4 italic">{plan.hint}</p>
                )}
                {!plan.hint && <div className="mb-4" />}

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f, fi) => {
                    if (f.divider) {
                      return (
                        <li key={fi} className="pt-2 pb-1">
                          <div className="border-t border-border/40 pt-2">
                            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                              {f.divider}
                            </span>
                          </div>
                        </li>
                      );
                    }
                    return (
                      <li key={fi} className="flex items-start gap-2.5 text-[13px]">
                        {f.included ? (
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                        )}
                        <span className={f.included ? "text-muted-foreground" : "text-muted-foreground/60"}>
                          {f.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 mb-6">
          {["🔒 Keine versteckten Kosten", "↕ Jederzeit kündigen", "🇩🇪 Server in Deutschland"].map(
            (t, i) => (
              <span key={i} className="text-[12px] text-muted-foreground">
                {t}
              </span>
            )
          )}
        </div>

        {/* Comparison toggle */}
        <div className="text-center mt-4">
          <button
            onClick={() => setTableOpen(!tableOpen)}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Alle Features vergleichen
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${tableOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        <AnimatePresence>
          {tableOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-hidden"
            >
              <div className="max-w-6xl mx-auto mt-8 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium text-[13px]">
                        Feature
                      </th>
                      {plans.map((p) => (
                        <th
                          key={p.name}
                          className={`text-center py-3 px-4 font-semibold text-[13px] ${
                            p.highlighted ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonCategories.map((cat) => (
                      <React.Fragment key={`cat-${cat.category}`}>
                        <tr>
                          <td
                            colSpan={5}
                            className="pt-4 pb-2 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {cat.category}
                          </td>
                        </tr>
                        {cat.rows.map((row, ri) => (
                          <tr key={`${cat.category}-${ri}`} className="border-b border-border/30">
                            <td className="py-2.5 px-4 text-muted-foreground text-[13px]">
                              {row.label}
                            </td>
                            {row.values.map((val, vi) => (
                              <td key={vi} className="text-center py-2.5 px-4">
                                {val === true ? (
                                  <Check className="w-4 h-4 text-success mx-auto" />
                                ) : val === false ? (
                                  <Minus className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                                ) : (
                                  <span className="text-[13px] text-foreground">{val}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PricingSection;

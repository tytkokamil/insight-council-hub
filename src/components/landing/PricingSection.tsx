import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

interface PlanFeature {
  label: string;
  included: boolean;
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
}

const plans: Plan[] = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Für Einzelpersonen die Decivio kennenlernen wollen. Keine Kreditkarte.",
    highlighted: false,
    cta: "Kostenlos starten",
    ctaLink: "/auth",
    features: [
      { label: "1 Nutzer", included: true },
      { label: "10 Entscheidungen", included: true },
      { label: "30 Tage Audit Trail", included: true },
      { label: "Basis-Templates", included: true },
      { label: "Basis-Benachrichtigungen", included: true },
      { label: "Kein Team", included: false },
      { label: "Kein KI Daily Brief", included: false },
      { label: "Kein SLA-System", included: false },
      { label: "Decivio Branding auf Exports", included: false },
    ],
  },
  {
    name: "Starter",
    monthly: 49,
    annual: 490,
    desc: "Für kleine Teams die Entscheidungen strukturiert dokumentieren wollen.",
    highlighted: false,
    cta: "14 Tage kostenlos testen",
    ctaLink: "/auth",
    features: [
      { label: "Bis 5 Nutzer", included: true },
      { label: "Unbegrenzte Entscheidungen", included: true },
      { label: "1 Jahr Audit Trail", included: true },
      { label: "Alle Branchen-Templates (15 Branchen)", included: true },
      { label: "SLA-System & Eskalationen", included: true },
      { label: "E-Mail Benachrichtigungen", included: true },
      { label: "Rollen & Berechtigungen", included: true },
      { label: "Kein KI Daily Brief", included: false },
      { label: "Kein Analytics Hub", included: false },
      { label: "Kein Predictive SLA", included: false },
      { label: "Kein Webhook", included: false },
    ],
  },
  {
    name: "Professional",
    monthly: 149,
    annual: 1490,
    desc: "Für Teams die Entscheidungen beschleunigen und Compliance nachweisen müssen.",
    highlighted: true,
    cta: "14 Tage kostenlos testen",
    ctaLink: "/auth",
    hint: "= weniger als 2 Stunden vermiedene Verzögerung pro Monat",
    features: [
      { label: "Bis 25 Nutzer", included: true },
      { label: "Alles aus Starter", included: true },
      { label: "KI Daily Brief täglich 07:30 Uhr", included: true },
      { label: "Echtzeit Cost-of-Delay Zähler", included: true },
      { label: "Predictive SLA Warnings", included: true },
      { label: "Anomalie-Erkennung (KI)", included: true },
      { label: "Analytics Hub", included: true },
      { label: "One-Click Approval via E-Mail", included: true },
      { label: "Compliance-Kalender (NIS2, ISO, IATF)", included: true },
      { label: "Webhooks & Microsoft Teams", included: true },
      { label: "PDF-Export ohne Decivio Branding", included: true },
      { label: "Unlimitierter Audit Trail", included: true },
    ],
  },
  {
    name: "Enterprise",
    monthly: 499,
    annual: null,
    desc: "Für Unternehmen mit komplexen Compliance-Anforderungen und mehr als 25 Nutzern.",
    highlighted: false,
    cta: "Gespräch vereinbaren",
    ctaLink: "mailto:sales@decivio.com",
    features: [
      { label: "Unbegrenzte Nutzer", included: true },
      { label: "Alles aus Professional", included: true },
      { label: "SSO / SAML", included: true },
      { label: "Custom Branding (eigenes Logo)", included: true },
      { label: "Dedicated Success Manager", included: true },
      { label: "SLA-Garantie 99,9% Uptime", included: true },
      { label: "On-Premise Option", included: true },
      { label: "Individuelle Integrationen", included: true },
      { label: "Kryptographischer Audit Trail", included: true },
      { label: "Prioritäts-Support", included: true },
    ],
  },
];

/* ── Comparison table data ── */
const comparisonFeatures = [
  { label: "Nutzer", values: ["1", "5", "25", "Unbegrenzt"] },
  { label: "Entscheidungen", values: ["10", "∞", "∞", "∞"] },
  { label: "Audit Trail", values: ["30 Tage", "1 Jahr", "Unbegrenzt", "Unbegrenzt"] },
  { label: "Branchen-Templates", values: ["Basis", "Alle (15)", "Alle (15)", "Alle (15)"] },
  { label: "SLA-System & Eskalationen", values: [false, true, true, true] },
  { label: "Rollen & Berechtigungen", values: [false, true, true, true] },
  { label: "E-Mail Benachrichtigungen", values: [false, true, true, true] },
  { label: "KI Daily Brief", values: [false, false, true, true] },
  { label: "Cost-of-Delay Zähler", values: [false, false, true, true] },
  { label: "Predictive SLA", values: [false, false, true, true] },
  { label: "Anomalie-Erkennung (KI)", values: [false, false, true, true] },
  { label: "Analytics Hub", values: [false, false, true, true] },
  { label: "One-Click Approval", values: [false, false, true, true] },
  { label: "Compliance-Kalender", values: [false, false, true, true] },
  { label: "Webhooks & Teams", values: [false, false, true, true] },
  { label: "PDF ohne Branding", values: [false, false, true, true] },
  { label: "SSO / SAML", values: [false, false, false, true] },
  { label: "Custom Branding", values: [false, false, false, true] },
  { label: "Dedicated Success Manager", values: [false, false, false, true] },
  { label: "On-Premise Option", values: [false, false, false, true] },
  { label: "Prioritäts-Support", values: [false, false, false, true] },
];

const trustPoints = [
  "🔒 Keine versteckten Kosten",
  "↕ Jederzeit upgraden oder kündigen",
  "🇩🇪 Server in Deutschland",
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  return (
    <section id="pricing" className="py-24 relative" style={{ background: "#060D1A" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <p className="text-[11px] font-semibold text-[#2563EB] mb-4 tracking-[0.2em] uppercase">
            Preise
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Transparente Preise. Kein Versteckspiel.
          </h2>
          <p className="text-[#94A3B8] leading-relaxed">
            Alle Pläne mit 14 Tagen kostenloser Testphase. Keine Kreditkarte nötig.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !annual ? "bg-[#2563EB] text-white" : "text-[#94A3B8] hover:text-white"
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              annual ? "bg-[#2563EB] text-white" : "text-[#94A3B8] hover:text-white"
            }`}
          >
            Jährlich <span className="text-[11px] opacity-80">(2 Monate gratis)</span>
          </button>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, i) => {
            const isMailto = plan.ctaLink.startsWith("mailto:");
            const price = annual
              ? plan.annual !== null ? plan.annual : null
              : plan.monthly;
            const perMonth = annual && plan.annual !== null
              ? Math.round(plan.annual / 12)
              : plan.monthly;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7, ease }}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  plan.highlighted
                    ? "border-[#2563EB] bg-[#0D1B2E] shadow-[0_0_30px_-8px_rgba(37,99,235,0.25)] scale-[1.02] z-10"
                    : "border-[rgba(255,255,255,0.07)] bg-[#0D1B2E] hover:border-[rgba(255,255,255,0.15)]"
                }`}
              >
                {/* Badge */}
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#2563EB] text-white tracking-wide">
                    <Sparkles className="w-3 h-3" /> Empfohlen
                  </span>
                )}

                {/* Plan label */}
                <p className="text-[11px] font-semibold text-[#94A3B8] tracking-[0.2em] uppercase mb-3">
                  {plan.name}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1 min-h-[48px]">
                  {price === null ? (
                    <span className="text-[28px] font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Ab €499
                    </span>
                  ) : price === 0 ? (
                    <span className="text-[40px] font-bold text-white tabular-nums" style={{ fontFamily: "'Syne', sans-serif" }}>
                      €0
                    </span>
                  ) : (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`${perMonth}-${annual}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.3, ease }}
                          className="text-[40px] font-bold text-white tabular-nums"
                          style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                          €{perMonth}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-sm text-[#64748B]">/Monat</span>
                    </>
                  )}
                </div>

                {/* Annual total hint */}
                {annual && price !== null && price > 0 && (
                  <p className="text-[11px] text-[#475569] mb-2">
                    €{price} / Jahr
                  </p>
                )}

                <p className="text-sm text-[#94A3B8] mb-5 leading-relaxed">{plan.desc}</p>

                {/* CTA */}
                {isMailto ? (
                  <a
                    href={plan.ctaLink}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-white text-sm font-semibold hover:bg-[rgba(255,255,255,0.05)] transition-colors mb-2"
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to={plan.ctaLink}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all mb-2 ${
                      plan.highlighted
                        ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_4px_20px_-4px_rgba(37,99,235,0.5)]"
                        : "border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {plan.hint && (
                  <p className="text-[11px] text-[#64748B] text-center mb-4 italic">{plan.hint}</p>
                )}

                {!plan.hint && <div className="mb-4" />}

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-[13px]">
                      {f.included ? (
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-[#334155] shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? "text-[#CBD5E1]" : "text-[#334155]"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 mb-8">
          {trustPoints.map((t, i) => (
            <span key={i} className="text-[13px] text-[#94A3B8]">{t}</span>
          ))}
        </div>

        {/* Comparison table toggle */}
        <div className="text-center mt-4">
          <button
            onClick={() => setTableOpen(!tableOpen)}
            className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:text-[#3B82F6] font-medium transition-colors"
          >
            Alle Features vergleichen
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${tableOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Comparison table */}
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
                    <tr className="border-b border-[rgba(255,255,255,0.07)]">
                      <th className="text-left py-3 px-4 text-[#94A3B8] font-medium">Feature</th>
                      {plans.map((p) => (
                        <th
                          key={p.name}
                          className={`text-center py-3 px-4 font-semibold ${
                            p.highlighted ? "text-[#2563EB]" : "text-white"
                          }`}
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, ri) => (
                      <tr key={ri} className="border-b border-[rgba(255,255,255,0.04)]">
                        <td className="py-2.5 px-4 text-[#CBD5E1] text-[13px]">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className="text-center py-2.5 px-4">
                            {val === true ? (
                              <Check className="w-4 h-4 text-[#10B981] mx-auto" />
                            ) : val === false ? (
                              <Minus className="w-4 h-4 text-[#334155] mx-auto" />
                            ) : (
                              <span className="text-[13px] text-[#CBD5E1]">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
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

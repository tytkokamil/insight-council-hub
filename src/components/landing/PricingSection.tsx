import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const TOTAL_SLOTS = 20;

const plans = [
  { name: "Free", price: 0, priceY: 0, sub: "Zum Kennenlernen", cta: "Kostenlos starten", primary: false, to: "/auth",
    features: ["1 Nutzer", "Bis 10 Entscheidungen", "30 Tage Audit Log", "3 Standard-Templates", "Basis-Dashboard (4 KPIs)", "DSGVO + AVV inklusive"] },
  { name: "Starter", price: 59, priceY: 49, sub: "Für kleine Teams", cta: "Kostenlos starten", primary: false, to: "/auth",
    features: ["Bis 8 Nutzer", "Unbegrenzte Entscheidungen", "Bis 3 Teams", "1 Jahr Audit Log", "15 Branchen-Templates", "1 Compliance-Framework", "SLA-Management", "One-Click Approval", "Externe Reviewer", "5 Automatisierungsregeln", "CSV/JSON Export"] },
  { name: "Professional", price: 149, priceY: 124, sub: "Für wachsende Mittelständler", cta: "14 Tage kostenlos testen →", primary: true, recommended: true, to: "/auth",
    features: ["Alles aus Starter, plus:", "Bis 25 Nutzer, 15 Teams", "SHA-256 Hash-Chain Audit Trail", "9 Compliance-Frameworks", "Echtzeit Cost-of-Delay Ticker", "KI Daily Brief (Gemini 2.5 Pro)", "KI Risiko-Scoring + Co-Pilot", "Predictive SLA Warning", "10 Analytics-Module", "Executive Hub + Board Report", "Meeting-Modus", "Webhook + Teams + Slack + API", "Prioritäts-Support (< 24h)"] },
  { name: "Enterprise", price: 499, priceY: 499, sub: "Für Konzerne", cta: "Kontakt aufnehmen →", primary: false, mail: true,
    features: ["Alles aus Professional, plus:", "Unbegrenzte Nutzer/Teams", "SSO / SAML", "Custom Branding", "IP Allowlisting", "Digitale Signatur", "Dedizierter Success Manager", "99,9% SLA-Garantie", "On-Premise (auf Anfrage)", "Support < 4h"] },
];

const PricingSection = memo(() => {
  const [yearly, setYearly] = useState(false);
  const [claimed, setClaimed] = useState(TOTAL_SLOTS);

  useEffect(() => {
    (async () => { try { const { data } = await supabase.from("founding_customer_slots").select("claimed_slots").limit(1).single(); if (data) setClaimed(data.claimed_slots ?? TOTAL_SLOTS); } catch {} })();
  }, []);

  const remaining = TOTAL_SLOTS - claimed;

  return (
    <section id="preise" className="py-24" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Transparent. Fair. Skalierbar.</h2>
          <p className="text-lg mb-8" style={{ color: "#64748B" }}>14 Tage kostenlos — ohne Kreditkarte. Jederzeit kündbar.</p>
          <div className="inline-flex items-center gap-3 p-1 rounded-lg" style={{ background: "#F1F5F9" }}>
            <button onClick={() => setYearly(false)} className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={!yearly ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748B" }}>Monatlich</button>
            <button onClick={() => setYearly(true)} className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
              style={yearly ? { background: "#FFFFFF", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#64748B" }}>
              Jährlich <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#16A34A" }}>-17%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
              className="rounded-xl p-6 flex flex-col relative"
              style={{ background: "#FFFFFF", border: p.recommended ? "2px solid #EF4444" : "1px solid #E2E8F0", boxShadow: p.recommended ? "0 8px 30px rgba(239,68,68,0.1)" : undefined }}>
              {p.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#EF4444" }}>EMPFOHLEN</span>}
              <h3 className="text-lg font-semibold mb-1" style={{ color: "#0F172A" }}>{p.name}</h3>
              <p className="text-xs mb-4" style={{ color: "#64748B" }}>{p.sub}</p>
              <AnimatePresence mode="wait">
                <motion.div key={yearly ? "y" : "m"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                  <span className="text-3xl font-bold" style={{ color: "#0F172A" }}>{p.name === "Enterprise" ? "ab €499" : `€${yearly ? p.priceY : p.price}`}</span>
                  {p.price > 0 && p.name !== "Enterprise" && <span className="text-sm" style={{ color: "#64748B" }}>/Mo</span>}
                </motion.div>
              </AnimatePresence>
              {p.mail ? (
                <a href="mailto:hallo@decivio.com" className="w-full text-center py-3 rounded-lg text-sm font-semibold min-h-[48px] flex items-center justify-center mb-6"
                  style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}>{p.cta}</a>
              ) : (
                <Link to={p.to!} className="w-full text-center py-3 rounded-lg text-sm font-semibold min-h-[48px] flex items-center justify-center mb-6 transition-all"
                  style={p.primary ? { background: "#EF4444", color: "#FFFFFF" } : { border: "1px solid #E2E8F0", color: "#0F172A" }}>{p.cta}</Link>
              )}
              <ul className="space-y-2 flex-1">
                {p.features.map((f, j) => <li key={j} className="flex items-start gap-2 text-xs" style={{ color: "#64748B" }}><Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />{f}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>

        {remaining > 0 && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 rounded-xl p-6 text-center" style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "#0F172A" }}>🏆 Founding Customer Program</p>
            <p className="text-sm mb-4" style={{ color: "#64748B" }}>Professional für €89/Mo statt €149 — lebenslang fixiert. Noch <strong>{remaining} von {TOTAL_SLOTS}</strong> Plätzen.</p>
            <Link to="/auth?founding=true" className="inline-flex text-sm font-semibold text-white px-6 py-3 rounded-lg" style={{ background: "#EF4444" }}>Platz sichern →</Link>
          </motion.div>
        )}

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10">
          {["Keine versteckten Kosten", "Jederzeit kündbar", "AVV inklusive", "Server in Deutschland"].map(t => <span key={t} className="text-xs" style={{ color: "#64748B" }}>✓ {t}</span>)}
        </div>
      </div>
    </section>
  );
});
PricingSection.displayName = "PricingSection";
export default PricingSection;

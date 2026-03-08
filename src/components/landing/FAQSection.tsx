import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(3);

  useEffect(() => { (async () => { try { const { data } = await supabase.from("founding_customer_slots").select("claimed_slots").limit(1).maybeSingle(); if (data) setRemaining(20 - (data.claimed_slots ?? 17)); } catch {} })(); }, []);

  const faqs = [
    { q: "Was ist Decivio — und was unterscheidet es von Monday oder Jira?", a: "Monday.com und Jira sind Projektmanagement-Tools. Decivio löst ein anderes Problem: Wer entscheidet was, wann, warum — und was kostet es wenn die Entscheidung nicht fällt?" },
    { q: "Für welche Unternehmensgrößen ist Decivio geeignet?", a: "Starter ist ab 2 Personen sinnvoll. Professional für 5–25 Beteiligte. Enterprise für Konzerne mit SSO-Pflicht." },
    { q: "Wie lange dauert der Einstieg wirklich?", a: "Branche auswählen → erste Entscheidung anlegen → Reviewer einladen. Innerhalb von 5 Minuten. Keine IT-Abteilung nötig." },
    { q: "Ist Decivio DSGVO-konform?", a: "Ja. Server in Deutschland (Frankfurt). AVV in allen Plänen inklusive. Datenexport nach Art. 20 und Löschung nach Art. 17 direkt verfügbar." },
    { q: "Können externe Partner ohne Account genehmigen?", a: "Ja. Externe Reviewer erhalten einen sicheren Token-Link per E-Mail. Keine Registrierung nötig. Alle Aktionen im Audit Trail." },
    { q: "Was ist der SHA-256 Audit Trail?", a: "Jede Änderung wird als Hash-verketteter Eintrag gespeichert. Nachträgliche Änderungen sind mathematisch erkennbar. ISO-Auditoren können die Kette verifizieren." },
    { q: "Was kostet das Founding Program?", a: `Professional für €89/Mo statt €149 — lebenslang fixiert. Nur für die ersten 20 Kunden. Noch ${remaining} Plätze verfügbar.` },
    { q: "Gibt es eine Mindestlaufzeit?", a: "Nein. Monatlich jederzeit kündbar. Jährlich spart 17%. Datenlöschung auf Wunsch sofort via DSGVO Art. 17." },
  ];

  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-foreground">Häufige Fragen.</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
              className="rounded-xl overflow-hidden bg-card border border-border magnetic-card">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="text-sm font-semibold pr-4 text-foreground">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-muted-foreground ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

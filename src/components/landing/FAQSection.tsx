import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ease = [0.16, 1, 0.3, 1] as const;

const FAQSection = () => {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(17);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const { data } = await supabase
          .from("founding_customer_slots")
          .select("claimed_slots, total_slots")
          .limit(1)
          .single();
        if (data) setRemaining((data.total_slots ?? 20) - (data.claimed_slots ?? 3));
      } catch { /* fallback */ }
    };
    fetchSlots();
  }, []);

  const faqs = [
    {
      q: "Was ist Decivio — und was unterscheidet es von Monday oder Jira?",
      a: "Monday.com und Jira sind Projektmanagement-Tools — sie verwalten Tasks, Projekte und Sprints. Decivio löst ein anderes Problem: Wer entscheidet was, wann, warum — und was kostet es wenn die Entscheidung nicht fällt? Der Fokus liegt auf Entscheidungskosten sichtbar machen, Compliance-Dokumentation automatisieren und Freigabeprozesse beschleunigen. Beides kann sich ergänzen.",
    },
    {
      q: "Für welche Unternehmensgrößen ist Decivio geeignet?",
      a: "Starter ist ab 2 Personen sinnvoll. Professional ist optimiert für Teams von 5–25 Personen die an Entscheidungsprozessen beteiligt sind — nicht die Gesamtmitarbeiterzahl. Enterprise für Konzerne mit SSO-Pflicht, Custom Branding oder On-Premise-Bedarf.",
    },
    {
      q: "Wie lange dauert der Einstieg wirklich?",
      a: "Branche auswählen → erste Entscheidung anlegen → Reviewer einladen. Das Onboarding ist auf unter 5 Minuten ausgelegt. Keine IT-Abteilung, keine Installation, kein Projekt.",
    },
    {
      q: "Ist Decivio DSGVO-konform? Wo liegen die Daten?",
      a: "Ja. Server in Deutschland (EU-Region Frankfurt). Auftragsverarbeitungsvertrag (AVV) ist in allen Plänen inklusive — kein Zusatzvertrag nötig. Datenexport nach Art. 20 und vollständige Datenlöschung nach Art. 17 sind direkt in der Plattform verfügbar.",
    },
    {
      q: "Können externe Partner ohne Account genehmigen?",
      a: "Ja. Externe Reviewer — Lieferanten, Rechtsanwälte, Wirtschaftsprüfer — erhalten einen sicheren Token-Link per E-Mail. Sie öffnen die Entscheidung im Browser, geben Feedback und genehmigen oder lehnen ab. Keine Registrierung, kein Passwort. Alle Aktionen landen im Audit Trail.",
    },
    {
      q: "Was genau ist der SHA-256 Audit Trail — und warum ist das wichtig?",
      a: "Jede Änderung, Genehmigung und Ablehnung wird als Hash-verketteter Audit-Log-Eintrag gespeichert. Jeder neue Eintrag enthält den Hash des vorherigen — vergleichbar mit einer Blockchain. Nachträgliche Änderungen sind mathematisch erkennbar. ISO 9001-, IATF- und NIS2-Auditoren können die Kette verifizieren und als PDF exportieren.",
    },
    {
      q: "Was kostet das Founding Program und wann endet es?",
      a: `Professional für €89/Mo statt €149 — lebenslang fixiert, solange Sie Kunde sind. Kein Ablaufdatum, kein automatischer Preisanstieg. Nur für die ersten 20 Founding Customers. Aktuell noch ${remaining} Plätze verfügbar — live aus der Datenbank gelesen.`,
    },
    {
      q: "Gibt es eine Mindestlaufzeit oder Kündigungsfrist?",
      a: "Nein. Monatliche Zahlung ist jederzeit zum Monatsende kündbar. Jährliche Zahlung spart 17% (2 Monate gratis) und ist nach 12 Monaten kündbar. Datenlöschung auf Wunsch sofort nach Kündigung via DSGVO Art. 17.",
    },
  ];

  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/10 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-muted/30 mb-6">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-widest uppercase">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Häufige Fragen.
          </h2>
        </motion.div>

        <div className="space-y-2.5">
          {faqs.map((faq, i) => {
            const isOpen = openItem === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.4, ease }}
              >
                <div
                  className={`rounded-xl border px-6 transition-all duration-300 ${
                    isOpen
                      ? "bg-card border-primary/20 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.08)]"
                      : "bg-card/70 border-border/30 hover:border-border/60"
                  }`}
                >
                  <button
                    onClick={() => setOpenItem(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 py-5 text-left"
                  >
                    <span className="text-[14px] font-semibold text-foreground/90 flex-1">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="overflow-hidden"
                      >
                        <div className="text-[13px] text-muted-foreground leading-[1.75] pb-5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

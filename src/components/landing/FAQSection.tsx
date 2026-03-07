import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Shield, Clock, CreditCard, Brain, Plug, Building2, Scale } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type Category = "all" | "product" | "security" | "pricing";

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "product", label: "Produkt" },
  { key: "security", label: "Sicherheit & Compliance" },
  { key: "pricing", label: "Preise & Start" },
];

const faqs: { q: string; a: string; icon: typeof Zap; cat: Category }[] = [
  {
    q: "Was genau ist Decivio?",
    a: "Decivio ist eine Decision Governance Platform, die alle offenen Entscheidungen in Ihrem Unternehmen sichtbar macht, Verzögerungskosten in Echtzeit berechnet und Compliance-Anforderungen automatisch dokumentiert — mit kryptographischem Audit Trail.",
    icon: Building2, cat: "product",
  },
  {
    q: "Für welche Unternehmensgröße ist Decivio geeignet?",
    a: "Decivio richtet sich an Unternehmen mit 20 bis 500 Mitarbeitern. Besonders geeignet für Mittelständler aus Maschinenbau, Automotive, Pharma, Finanzdienstleistungen und IT-Dienstleistungen, die regulatorische Anforderungen erfüllen müssen.",
    icon: Building2, cat: "product",
  },
  {
    q: "Wie schnell kann ich starten?",
    a: "In unter 3 Minuten. Registrieren, Branche wählen, erste Entscheidung anlegen. Kein IT-Projekt, keine Installation, keine Kreditkarte. Ihre branchenspezifischen Templates sind sofort verfügbar.",
    icon: Clock, cat: "pricing",
  },
  {
    q: "Ist Decivio DSGVO-konform?",
    a: "Ja. Alle Daten werden auf ISO 27001-zertifizierten Servern in Deutschland gehostet. Ein Auftragsverarbeitungsvertrag (AVV) ist in jedem Plan inklusive. Wir verarbeiten keine Daten außerhalb der EU.",
    icon: Shield, cat: "security",
  },
  {
    q: "Welche Compliance-Frameworks werden unterstützt?",
    a: "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP/FDA 21 CFR Part 11, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act — mit branchenspezifischen Vorlagen und automatischer Dokumentation.",
    icon: Scale, cat: "security",
  },
  {
    q: "Was kostet Decivio?",
    a: "Es gibt einen kostenlosen Plan für Einzelpersonen (1 Nutzer, 10 Entscheidungen). Professional kostet €149/Monat für bis zu 25 Nutzer. Enterprise-Pläne sind individuell. Alle Pläne mit 14 Tagen kostenloser Testphase — keine Kreditkarte nötig.",
    icon: CreditCard, cat: "pricing",
  },
  {
    q: "Wie funktioniert der KI Daily Brief?",
    a: "Jeden Morgen analysiert unsere KI Ihre offenen Entscheidungen und erstellt ein Executive Briefing: Die 3 kritischsten Entscheidungen, SLA-Warnungen, Economic Exposure und empfohlene Sofort-Maßnahmen — in 30 Sekunden erfassbar.",
    icon: Brain, cat: "product",
  },
  {
    q: "Kann ich Decivio mit meinen bestehenden Tools verbinden?",
    a: "Ja. Decivio bietet Webhooks, Microsoft Teams-Integration, E-Mail-basierte Workflows (One-Click Approval) und eine API für individuelle Anbindungen. Entscheidungen können auch per E-Mail erstellt werden.",
    icon: Plug, cat: "product",
  },
];

const FAQSection = () => {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = activeCategory === "all" ? faqs : faqs.filter(f => f.cat === activeCategory);

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
            Häufig gestellte Fragen
          </h2>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setOpenItem(null); }}
              className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 border ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((faq, i) => {
              const globalIndex = faqs.indexOf(faq);
              const isOpen = openItem === globalIndex;
              const Icon = faq.icon;

              return (
                <motion.div
                  key={faq.q}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
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
                      onClick={() => setOpenItem(isOpen ? null : globalIndex)}
                      className="w-full flex items-center gap-3 py-5 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                        isOpen ? "bg-primary/10" : "bg-muted/50"
                      }`}>
                        <Icon className={`w-4 h-4 transition-colors duration-300 ${
                          isOpen ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
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
                          <div className="text-[13px] text-muted-foreground leading-[1.75] pb-5 pl-11">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

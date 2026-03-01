import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ease = [0.16, 1, 0.3, 1] as const;

const faqs = [
  {
    q: "Was genau ist Decivio?",
    a: "Decivio ist eine Decision Governance Platform, die alle offenen Entscheidungen in Ihrem Unternehmen sichtbar macht, Verzögerungskosten in Echtzeit berechnet und Compliance-Anforderungen automatisch dokumentiert — mit kryptographischem Audit Trail.",
  },
  {
    q: "Für welche Unternehmensgröße ist Decivio geeignet?",
    a: "Decivio richtet sich an Unternehmen mit 20 bis 500 Mitarbeitern. Besonders geeignet für Mittelständler aus Maschinenbau, Automotive, Pharma, Finanzdienstleistungen und IT-Dienstleistungen, die regulatorische Anforderungen erfüllen müssen.",
  },
  {
    q: "Wie schnell kann ich starten?",
    a: "In unter 3 Minuten. Registrieren, Branche wählen, erste Entscheidung anlegen. Kein IT-Projekt, keine Installation, keine Kreditkarte. Ihre branchenspezifischen Templates sind sofort verfügbar.",
  },
  {
    q: "Ist Decivio DSGVO-konform?",
    a: "Ja. Alle Daten werden auf ISO 27001-zertifizierten Servern in Deutschland gehostet. Ein Auftragsverarbeitungsvertrag (AVV) ist in jedem Plan inklusive. Wir verarbeiten keine Daten außerhalb der EU.",
  },
  {
    q: "Welche Compliance-Frameworks werden unterstützt?",
    a: "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP/FDA 21 CFR Part 11, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act — mit branchenspezifischen Vorlagen und automatischer Dokumentation.",
  },
  {
    q: "Was kostet Decivio?",
    a: "Es gibt einen kostenlosen Plan für Einzelpersonen (1 Nutzer, 10 Entscheidungen). Professional kostet €149/Monat für bis zu 25 Nutzer. Enterprise-Pläne sind individuell. Alle Pläne mit 14 Tagen kostenloser Testphase — keine Kreditkarte nötig.",
  },
  {
    q: "Wie funktioniert der KI Daily Brief?",
    a: "Jeden Morgen analysiert unsere KI Ihre offenen Entscheidungen und erstellt ein Executive Briefing: Die 3 kritischsten Entscheidungen, SLA-Warnungen, Economic Exposure und empfohlene Sofort-Maßnahmen — in 30 Sekunden erfassbar.",
  },
  {
    q: "Kann ich Decivio mit meinen bestehenden Tools verbinden?",
    a: "Ja. Decivio bietet Webhooks, Microsoft Teams-Integration, E-Mail-basierte Workflows (One-Click Approval) und eine API für individuelle Anbindungen. Entscheidungen können auch per E-Mail erstellt werden.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-24 relative">
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center mb-12"
      >
        <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase" style={{ color: 'hsl(220 45% 50%)' }}>
          FAQ
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Häufig gestellte Fragen
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6, ease }}
      >
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-sm transition-shadow"
            >
              <AccordionTrigger className="text-sm font-semibold text-foreground text-left hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;

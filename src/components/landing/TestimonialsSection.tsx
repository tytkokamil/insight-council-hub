import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const testimonials = [
  {
    quote: "Wir wussten nicht wie viele Entscheidungen wirklich offen sind. Nach einer Woche mit Decivio: 23 Entscheidungen, €48.000 Economic Exposure. Das hat alles verändert.",
    name: "Markus H.",
    role: "Geschäftsführer · Maschinenbau · 85 Mitarbeiter",
    initials: "MH",
  },
  {
    quote: "Unser nächster ISO-9001-Audit war der erste ohne Nachbesserungen. Der Auditor fragte nach unserem Entscheidungssystem — wir haben ihm Decivio gezeigt. Beeindruckt.",
    name: "Sabine K.",
    role: "Qualitätsmanagement · Automobilzulieferer",
    initials: "SK",
  },
  {
    quote: "Der KI Daily Brief ist das erste was ich morgens öffne — noch vor E-Mails. In 30 Sekunden weiß ich was heute kritisch ist.",
    name: "Thomas B.",
    role: "CEO · IT-Dienstleister · NIS2-pflichtig",
    initials: "TB",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 relative">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-14"
      >
        <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Stimmen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Was unsere Kunden sagen</h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            whileHover={{ y: -4 }}
            className="relative p-7 rounded-2xl border border-border bg-card flex flex-col hover:shadow-lg hover:border-primary/15 transition-all duration-300"
          >
            <Quote className="w-6 h-6 text-primary/15 mb-3 shrink-0" />
            <p className="text-sm text-muted-foreground leading-[1.8] mb-6 flex-1">„{t.quote}"</p>
            <div className="pt-5 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                {t.initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground/60 mt-8 italic">
        * Repräsentative Nutzungsszenarien basierend auf Produkttests
      </p>
    </div>
  </section>
);

export default TestimonialsSection;

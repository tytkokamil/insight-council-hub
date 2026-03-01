import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const testimonials = [
  {
    quote: "Wir wussten nicht wie viele Entscheidungen wirklich offen sind. Nach einer Woche mit Decivio: 23 Entscheidungen, €48.000 Economic Exposure.",
    name: "Markus H.",
    role: "Geschäftsführer · Maschinenbau · 85 MA",
    initials: "MH",
  },
  {
    quote: "Unser nächster ISO-9001-Audit war der erste ohne Nachbesserungen. Der Auditor fragte nach unserem Entscheidungssystem.",
    name: "Sabine K.",
    role: "Qualitätsmanagement · Automotive",
    initials: "SK",
  },
  {
    quote: "Der KI Daily Brief ist das erste was ich morgens öffne. In 30 Sekunden weiß ich was heute kritisch ist.",
    name: "Thomas B.",
    role: "CEO · IT-Dienstleister · NIS2-pflichtig",
    initials: "TB",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 relative">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
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

      <div className="grid md:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="p-6 rounded-2xl border border-border/50 bg-white/60 backdrop-blur-sm flex flex-col"
          >
            <Quote className="w-5 h-5 text-primary/12 mb-3" />
            <p className="text-[13px] text-muted-foreground leading-[1.7] mb-5 flex-1">„{t.quote}"</p>
            <div className="pt-4 border-t border-border/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                {t.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">{t.name}</div>
                <div className="text-[11px] text-muted-foreground/60">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/40 mt-6 italic">
        * Repräsentative Nutzungsszenarien basierend auf Produkttests
      </p>
    </div>
  </section>
);

export default TestimonialsSection;

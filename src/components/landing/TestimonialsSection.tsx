import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const testimonials = [
  {
    quote: "Wir wussten nicht wie viele Entscheidungen wirklich offen sind. Nach einer Woche mit Decivio: 23 Entscheidungen, €48.000 Economic Exposure.",
    name: "Markus H.",
    role: "Geschäftsführer · Maschinenbau · 85 MA",
    initials: "MH",
    metric: "€48K",
    metricLabel: "Exposure sichtbar gemacht",
  },
  {
    quote: "Unser nächster ISO-9001-Audit war der erste ohne Nachbesserungen. Der Auditor fragte nach unserem Entscheidungssystem.",
    name: "Sabine K.",
    role: "Qualitätsmanagement · Automotive",
    initials: "SK",
    metric: "0",
    metricLabel: "Audit-Nachbesserungen",
  },
  {
    quote: "Der KI Daily Brief ist das erste was ich morgens öffne. In 30 Sekunden weiß ich was heute kritisch ist.",
    name: "Thomas B.",
    role: "CEO · IT-Dienstleister · NIS2-pflichtig",
    initials: "TB",
    metric: "30s",
    metricLabel: "für den Tagesüberblick",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 relative overflow-hidden">
    {/* Subtle background accent */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/15 to-transparent" />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-14"
      >
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4" style={{ color: 'hsl(220 45% 50%)' }}>
          Kundenstimmen
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Was unsere Kunden sagen
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            className="group relative flex flex-col rounded-2xl border border-border/40 bg-white/70 backdrop-blur-sm p-6 hover:bg-white hover:border-border/60 hover:shadow-[0_8px_30px_-12px_hsl(220,20%,50%,0.08)] transition-all duration-500"
          >
            {/* Metric eye-catcher */}
            <div className="mb-5 pb-4 border-b border-border/30">
              <div className="text-2xl font-bold tabular-nums font-mono" style={{ color: 'hsl(220 45% 50%)' }}>
                {t.metric}
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{t.metricLabel}</div>
            </div>

            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, si) => (
                <Star key={si} className="w-3 h-3 fill-[hsl(40,60%,55%)] text-[hsl(40,60%,55%)]" />
              ))}
            </div>

            <Quote className="w-4 h-4 text-border mb-2" />
            <p className="text-[13px] text-muted-foreground leading-[1.75] mb-5 flex-1">
              „{t.quote}"
            </p>

            <div className="pt-4 border-t border-border/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'hsl(220 40% 95%)', color: 'hsl(220 40% 50%)' }}>
                {t.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{t.name}</div>
                <div className="text-[11px] text-muted-foreground/50">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/35 mt-8 italic">
        * Repräsentative Nutzungsszenarien basierend auf Produkttests
      </p>
    </div>
  </section>
);

export default TestimonialsSection;

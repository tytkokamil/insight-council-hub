import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const testimonials = [
  {
    quote: "Wir wussten nicht wie viele Entscheidungen wirklich offen sind. Nach einer Woche mit Decivio: 23 Entscheidungen, €48.000 Economic Exposure.",
    name: "Markus H.",
    role: "Geschäftsführer",
    company: "Maschinenbau · 85 MA",
    initials: "MH",
    metric: "€48K",
    metricLabel: "Exposure sichtbar gemacht",
    accentClass: "text-accent-blue",
    accentBg: "bg-accent-blue/12",
  },
  {
    quote: "Unser nächster ISO-9001-Audit war der erste ohne Nachbesserungen. Der Auditor fragte nach unserem Entscheidungssystem.",
    name: "Sabine K.",
    role: "Qualitätsmanagement",
    company: "Automotive-Zulieferer",
    initials: "SK",
    metric: "0",
    metricLabel: "Audit-Nachbesserungen",
    accentClass: "text-accent-teal",
    accentBg: "bg-accent-teal/12",
  },
  {
    quote: "Der KI Daily Brief ist das erste was ich morgens öffne. In 30 Sekunden weiß ich was heute kritisch ist.",
    name: "Thomas B.",
    role: "CEO",
    company: "IT-Dienstleister · NIS2-pflichtig",
    initials: "TB",
    metric: "30s",
    metricLabel: "für den Tagesüberblick",
    accentClass: "text-accent-violet",
    accentBg: "bg-accent-violet/12",
  },
  {
    quote: "Decivio hat unsere Entscheidungsprozesse komplett transparent gemacht. Die Compliance-Dokumentation läuft jetzt automatisch.",
    name: "Andrea L.",
    role: "Head of Operations",
    company: "Pharma · GMP-reguliert",
    initials: "AL",
    metric: "87%",
    metricLabel: "weniger Dokumentationsaufwand",
    accentClass: "text-primary",
    accentBg: "bg-primary/12",
  },
];

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((next: number) => {
    setDirection(next > active ? 1 : -1);
    setActive(next);
  }, [active]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setActive(i => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const t = testimonials[active];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/15 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-primary">
            Kundenstimmen
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Was unsere Kunden sagen
          </h2>
        </motion.div>

        {/* Featured testimonial carousel */}
        <div className="relative max-w-3xl mx-auto mb-12">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.45, ease }}
              className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-8 md:p-10"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Metric highlight */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div
                    className={`text-4xl md:text-5xl font-bold tabular-nums font-mono ${t.accentClass}`}
                  >
                    {t.metric}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{t.metricLabel}</div>
                </div>

                <div className="flex-1">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 fill-accent-amber text-accent-amber" />
                    ))}
                  </div>

                  <Quote className="w-5 h-5 text-border mb-3" />
                  <p className="text-[15px] text-muted-foreground leading-[1.8] mb-6">
                    „{t.quote}"
                  </p>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold ${t.accentBg} ${t.accentClass}`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{t.name}</div>
                      <div className="text-[12px] text-muted-foreground">{t.role} · {t.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            onClick={() => go((active - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-9 h-9 rounded-full border border-border/40 bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all shadow-sm"
            aria-label="Vorherige Bewertung"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => go((active + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-9 h-9 rounded-full border border-border/40 bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all shadow-sm"
            aria-label="Nächste Bewertung"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-primary" : "w-1.5 bg-border/60 hover:bg-border"
              }`}
              aria-label={`Bewertung ${i + 1}`}
            />
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/35 italic">
          * Repräsentative Nutzungsszenarien basierend auf Produkttests
        </p>
      </div>
    </section>
  );
};

export default TestimonialsSection;

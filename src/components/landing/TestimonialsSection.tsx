import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Christina Berger",
    role: "CEO, Mittelstand (220 MA)",
    quote: "Unsere Entscheidungszyklen sind um 43% schneller geworden. Was vorher 3 Wochen dauerte, schaffen wir jetzt in 4 Tagen.",
    metric: "43%",
    metricLabel: "schnellere Zyklen",
  },
  {
    name: "Marcus Weber",
    role: "CFO, Scale-Up",
    quote: "Wir haben €2.3M an Opportunity Costs identifiziert, die uns durch verzögerte Entscheidungen entgangen wären. Der Cost-of-Delay Radar war ein Game-Changer.",
    metric: "€2.3M",
    metricLabel: "identifiziert",
  },
  {
    name: "Anna Richter",
    role: "VP Governance, Enterprise",
    quote: "Eskalationen sind um 61% zurückgegangen seit wir die SLA-Engine nutzen. Unser Board hat erstmals vollständige Transparenz über alle kritischen Entscheidungen.",
    metric: "–61%",
    metricLabel: "Eskalationen",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);

  const next = () => setActive((prev) => (prev + 1) % testimonials.length);
  const prev = () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const t = testimonials[active];

  return (
    <section id="testimonials" className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="max-w-3xl mx-auto mb-16"
        >
          <p className="text-xs font-medium text-muted-foreground/50 mb-4 tracking-[0.15em] uppercase">Kundenstimmen</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
            Messbare Ergebnisse
          </h2>
        </motion.div>

        {/* Large single testimonial */}
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-border/40 bg-card p-8 md:p-12 overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[80px] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease }}
              >
                {/* Big metric */}
                <div className="mb-8">
                  <span className="text-5xl md:text-6xl font-bold font-display text-primary tracking-tight">{t.metric}</span>
                  <span className="text-base text-muted-foreground/40 ml-3">{t.metricLabel}</span>
                </div>

                <Quote className="w-5 h-5 text-foreground/[0.06] mb-4" />

                <blockquote className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-8 font-medium tracking-tight">
                  „{t.quote}"
                </blockquote>

                <div>
                  <div className="text-base font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground/40">{t.role}</div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/20">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full border border-border/40 flex items-center justify-center hover:bg-muted/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
              </button>
              <div className="flex gap-1.5 flex-1">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-1 rounded-full transition-all duration-400 ${
                      i === active ? "w-8 bg-primary" : "w-3 bg-muted-foreground/15 hover:bg-muted-foreground/25"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full border border-border/40 flex items-center justify-center hover:bg-muted/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

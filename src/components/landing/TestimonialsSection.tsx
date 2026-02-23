import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    quote: "Wir haben €2.3M an Opportunity Costs identifiziert, die uns durch verzögerte Entscheidungen entgangen wären.",
    metric: "€2.3M",
    metricLabel: "identifiziert",
  },
  {
    name: "Anna Richter",
    role: "VP Governance, Enterprise",
    quote: "Eskalationen sind um 61% zurückgegangen seit wir die SLA-Engine nutzen. Unser Board hat erstmals vollständige Transparenz.",
    metric: "–61%",
    metricLabel: "Eskalationen",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const next = () => setActive((p) => (p + 1) % testimonials.length);
  const prev = () => setActive((p) => (p - 1 + testimonials.length) % testimonials.length);
  const t = testimonials[active];

  return (
    <section id="testimonials" className="py-32 relative bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-12 bg-primary" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Kundenstimmen</span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-[1fr_2fr] gap-12 md:gap-20 items-start">
            {/* Big metric */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease }}
              >
                <span className="text-6xl md:text-8xl font-bold font-display tracking-[-0.05em] text-primary block leading-none">
                  {t.metric}
                </span>
                <span className="text-sm text-muted-foreground mt-3 block">{t.metricLabel}</span>
              </motion.div>
            </AnimatePresence>

            {/* Quote */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <blockquote className="text-xl md:text-2xl font-medium leading-relaxed tracking-tight mb-8">
                    „{t.quote}"
                  </blockquote>
                  <div className="border-t border-border pt-4">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.role}</div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-8">
                <button onClick={prev} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1.5">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-px transition-all duration-300 ${i === active ? "w-8 bg-foreground" : "w-4 bg-border hover:bg-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

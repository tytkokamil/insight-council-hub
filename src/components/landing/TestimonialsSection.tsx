import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Christina Berger",
    role: "CEO, Mittelstand",
    quote: "Unsere Entscheidungszyklen sind um 43% schneller geworden. Was vorher 3 Wochen dauerte, schaffen wir jetzt in 4 Tagen.",
    metric: "43%",
    metricLabel: "schnellere Zyklen",
  },
  {
    name: "Marcus Weber",
    role: "CFO, Scale-Up",
    quote: "Wir haben €2.3M an Opportunity Costs identifiziert, die uns durch verzögerte Entscheidungen entgangen wären.",
    metric: "€2.3M",
    metricLabel: "eingespart",
  },
  {
    name: "Anna Richter",
    role: "VP Governance, Enterprise",
    quote: "Eskalationen sind um 61% zurückgegangen. Unser Board hat erstmals vollständige Transparenz.",
    metric: "–61%",
    metricLabel: "Eskalationen",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => (
  <section id="testimonials" className="py-28 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-16"
      >
        <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">
          Kundenstimmen
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Messbare Ergebnisse
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease }}
            className="group relative p-7 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 flex flex-col"
          >
            {/* Metric highlight */}
            <div className="mb-5">
              <span className="text-3xl font-bold font-display text-primary">{t.metric}</span>
              <span className="text-xs text-muted-foreground/60 ml-2">{t.metricLabel}</span>
            </div>

            <Quote className="w-4 h-4 text-foreground/[0.08] mb-3" />

            <p className="text-sm text-muted-foreground/80 leading-[1.8] mb-6 flex-1">
              „{t.quote}"
            </p>

            <div className="pt-5 border-t border-border/30">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground/50">{t.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;

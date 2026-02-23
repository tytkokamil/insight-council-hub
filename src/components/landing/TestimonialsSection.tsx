import { motion } from "framer-motion";
import { Quote } from "lucide-react";

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

const TestimonialsSection = () => (
  <section id="testimonials" className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-muted-foreground/50 mb-3 tracking-[0.15em] uppercase">
          Kundenstimmen
        </p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Messbare Ergebnisse
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="group relative p-6 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 flex flex-col"
          >
            {/* Metric */}
            <div className="mb-4">
              <span className="text-2xl font-bold font-display text-primary">{t.metric}</span>
              <span className="text-[11px] text-muted-foreground/50 ml-1.5">{t.metricLabel}</span>
            </div>

            <Quote className="w-3.5 h-3.5 text-foreground/[0.06] mb-2" />

            <p className="text-xs text-muted-foreground/70 leading-[1.7] mb-5 flex-1">
              „{t.quote}"
            </p>

            <div className="pt-4 border-t border-border/25">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-[11px] text-muted-foreground/40">{t.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;

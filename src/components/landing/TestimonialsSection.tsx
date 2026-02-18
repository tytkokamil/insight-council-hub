import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Sarah Lindner",
    role: "VP Operations, Siemens Digital",
    quote: "DecisionOS hat unsere Entscheidungszyklen von 3 Wochen auf 4 Tage reduziert. Der KI Co-Pilot allein spart uns hunderte Stunden pro Quartal.",
    avatar: "SL",
  },
  {
    name: "Marcus Weber",
    role: "CTO, TechScale GmbH",
    quote: "Der Decision Graph war ein Gamechanger. Wir sehen endlich wie unsere technischen Entscheidungen zusammenhängen und können Konflikte frühzeitig erkennen.",
    avatar: "MW",
  },
  {
    name: "Anna Richter",
    role: "Head of Strategy, FinBridge AG",
    quote: "Die Szenario-Engine hat uns geholfen, eine €50M Investitionsentscheidung mit vollem Confidence zu treffen. Unverzichtbar für unser C-Level.",
    avatar: "AR",
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-32 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto mb-20"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-widest uppercase">
          Kundenstimmen
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Was Enterprise-Teams
          <span className="gradient-text"> über uns sagen</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative p-7 rounded-2xl border border-border/50 bg-card hover:border-border transition-colors duration-300 group"
          >
            <Quote className="w-6 h-6 text-primary/10 mb-5" />
            <p className="text-sm text-muted-foreground leading-[1.7] mb-8">
              {t.quote}
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {t.avatar}
              </div>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;

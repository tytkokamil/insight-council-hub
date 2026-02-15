import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

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

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">
            Kundenstimmen
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Was Enterprise-Teams
            <span className="gradient-text"> über uns sagen</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
            >
              <Quote className="w-8 h-8 text-primary/8 absolute top-5 right-5" />
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Sarah Lindner",
    role: "VP Operations, Siemens Digital",
    quote: "DecisionOS hat unsere Entscheidungszyklen von 3 Wochen auf 4 Tage reduziert. Der KI Co-Pilot allein spart uns hunderte Stunden pro Quartal.",
    avatar: "SL",
    highlight: "3 Wochen → 4 Tage",
    accentClass: "from-accent-blue to-accent-violet",
    avatarBg: "bg-accent-blue/15 text-accent-blue",
  },
  {
    name: "Marcus Weber",
    role: "CTO, TechScale GmbH",
    quote: "Der Decision Graph war ein Gamechanger. Wir sehen endlich wie unsere technischen Entscheidungen zusammenhängen und können Konflikte frühzeitig erkennen.",
    avatar: "MW",
    highlight: "Gamechanger",
    accentClass: "from-accent-violet to-accent-rose",
    avatarBg: "bg-accent-violet/15 text-accent-violet",
  },
  {
    name: "Anna Richter",
    role: "Head of Strategy, FinBridge AG",
    quote: "Die Szenario-Engine hat uns geholfen, eine €50M Investitionsentscheidung mit vollem Confidence zu treffen. Unverzichtbar für unser C-Level.",
    avatar: "AR",
    highlight: "€50M Entscheidung",
    accentClass: "from-accent-teal to-accent-blue",
    avatarBg: "bg-accent-teal/15 text-accent-teal",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => (
  <section id="testimonials" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">
          Kundenstimmen
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Was Enterprise-Teams <span className="gradient-text">über uns sagen</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease }}
            className="group relative p-7 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 flex flex-col"
          >
            <div className="relative flex-1 flex flex-col">
              {/* Quote icon */}
              <Quote className="w-5 h-5 text-primary/20 mb-3" />

              {/* Stars - golden */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-accent-amber text-accent-amber" />
                ))}
              </div>

              {/* Highlight badge with gradient */}
              <div className={`inline-flex self-start px-2.5 py-1 rounded-full bg-gradient-to-r ${t.accentClass} text-[10px] font-semibold text-white mb-4`}>
                {t.highlight}
              </div>

              <p className="text-sm text-muted-foreground leading-[1.8] mb-8 flex-1">
                „{t.quote}"
              </p>

              <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/30">
                <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;

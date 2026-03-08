import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const cards = [
  {
    emoji: "🔒",
    title: "Gründerpreis für immer",
    text: "Professional für €89/Mo statt €149 — lebenslang fixiert.",
  },
  {
    emoji: "📞",
    title: "Direkter Zugang zum Gründer",
    text: "Ihre Anforderungen formen das Produkt.",
  },
  {
    emoji: "⭐",
    title: "Case Study Partner",
    text: "Ihr Unternehmen als Referenz — mit Ihrer Freigabe.",
  },
];

const TestimonialsSection = () => (
  <section className="py-24 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/15 to-transparent" />

    <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-12"
      >
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-4 text-muted-foreground">
          Early Access
        </p>
        <h2 className="text-[28px] md:text-3xl font-bold tracking-tight mb-4">
          Sei einer der ersten 20 Gründer.
        </h2>
        <p className="text-[16px] text-muted-foreground leading-relaxed max-w-[600px] mx-auto">
          Decivio ist noch jung. Wir suchen 20 Unternehmen aus dem Mittelstand die mit uns wachsen wollen — und dafür Gründerpreise erhalten.
        </p>
      </motion.div>

      {/* 3 Benefit cards */}
      <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease }}
            className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 text-center"
          >
            <span className="text-2xl mb-3 block">{card.emoji}</span>
            <h3 className="text-sm font-semibold mb-2">{card.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.text}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5, ease }}
        className="text-center"
      >
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:opacity-90"
          style={{ background: "hsl(var(--primary))" }}
        >
          Gründerpreis sichern <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-muted-foreground mt-3">
          Aktuell 0/20 Plätze vergeben
        </p>
      </motion.div>
    </div>
  </section>
);

export default TestimonialsSection;

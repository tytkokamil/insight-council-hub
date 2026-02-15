import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm mb-10">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Jetzt starten</span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-7 tracking-tight leading-[0.95]">
            Bereit für bessere
            <span className="gradient-text block mt-1">Entscheidungen?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Schließe dich hunderten Enterprise-Teams an, die mit DecisionOS
            strukturierter, schneller und transparenter entscheiden.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="xl" className="rounded-2xl">
              Kostenlos testen
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" className="rounded-2xl">
              Demo vereinbaren
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["14 Tage kostenlos", "Keine Kreditkarte", "Jederzeit kündbar"].map((text, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

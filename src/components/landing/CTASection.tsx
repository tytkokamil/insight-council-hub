import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <section className="py-32 relative">
    <div className="container mx-auto px-4">
      {/* Minimal divider */}
      <div className="w-12 h-px bg-border mx-auto mb-20" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[0.95]">
          Bereit für bessere
          <span className="gradient-text block mt-1">Entscheidungen?</span>
        </h2>

        <p className="text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
          Schließe dich hunderten Enterprise-Teams an, die mit DecisionOS
          strukturierter und schneller entscheiden.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="hero" size="xl" className="rounded-full">
            Kostenlos testen
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="glass" size="xl" className="rounded-full">
            Demo vereinbaren
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground/60">
          {["14 Tage kostenlos", "Keine Kreditkarte", "Jederzeit kündbar"].map((text, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              {text}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

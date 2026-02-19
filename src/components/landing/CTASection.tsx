import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-32 relative overflow-hidden">
    {/* Ambient glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="max-w-3xl mx-auto"
      >
        {/* Card-style CTA with gradient border */}
        <div className="relative rounded-3xl border border-border/40 bg-card p-12 md:p-16 text-center overflow-hidden" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] pointer-events-none" />
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[0.95]">
              Bereit für bessere
              <span className="gradient-text block mt-1">Entscheidungen?</span>
            </h2>

            <p className="text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Schließe dich hunderten Enterprise-Teams an, die mit DecisionOS
              strukturierter und schneller entscheiden.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {["14 Tage kostenlos", "Keine Kreditkarte", "Jederzeit kündbar"].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.08, ease }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {text}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="hero" size="xl" className="rounded-full">
                Kostenlos testen
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="xl" className="rounded-full">
                Demo vereinbaren
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

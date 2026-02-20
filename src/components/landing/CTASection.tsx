import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="max-w-3xl mx-auto"
      >
        <div className="relative rounded-3xl border border-border/40 bg-card p-12 md:p-16 text-center overflow-hidden" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03] pointer-events-none" />
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[0.95]">
              {"Bereit für bessere".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease }}
                  className="inline-block mr-[0.25em]"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.7, ease }}
                className="gradient-text block mt-1"
              >
                Entscheidungen?
              </motion.span>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
            >
              Schließe dich hunderten Enterprise-Teams an, die mit DecisionOS
              strukturierter und schneller entscheiden.
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {["14 Tage kostenlos", "Keine Kreditkarte", "Jederzeit kündbar"].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.08, ease }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {text}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button variant="hero" size="xl" className="rounded-full group">
                Kostenlos testen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glass" size="xl" className="rounded-full">
                Demo vereinbaren
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

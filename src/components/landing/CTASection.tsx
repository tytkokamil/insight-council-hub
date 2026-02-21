import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="max-w-3xl mx-auto"
      >
        <div className="relative rounded-3xl border border-primary/15 bg-gradient-to-b from-primary/[0.04] to-transparent p-12 md:p-16 text-center overflow-hidden">
          {/* Subtle glow orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent-blue/[0.06] blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-accent-teal/[0.06] blur-[80px]" />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[0.95]">
              Bereit für bessere{" "}
              <span className="bg-gradient-to-r from-accent-blue to-accent-violet bg-clip-text text-transparent">
                Entscheidungen?
              </span>
            </h2>

            <p className="text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Schließe dich hunderten Enterprise-Teams an, die mit DecisionOS
              strukturierter und schneller entscheiden.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {[
                { text: "14 Tage kostenlos", color: "text-accent-teal" },
                { text: "Keine Kreditkarte", color: "text-accent-blue" },
                { text: "Jederzeit kündbar", color: "text-accent-violet" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + i * 0.08, ease }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className={`w-4 h-4 ${item.color}`} />
                  {item.text}
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
              <Button size="lg" className="rounded-full group bg-primary hover:bg-primary/90 shadow-glow">
                Kostenlos testen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full">
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

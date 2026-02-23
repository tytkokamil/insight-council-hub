import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-28 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[1.05]">
          Bereit für strukturierte Entscheidungen?
        </h2>

        <p className="text-muted-foreground/70 max-w-md mx-auto mb-10 leading-relaxed">
          14 Tage kostenlos. Keine Kreditkarte. Jederzeit kündbar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="xl" className="rounded-full group shadow-lg shadow-primary/10">
            Kostenlos starten
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="xl" className="rounded-full border-border/50">
            Demo vereinbaren
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-24 relative">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-2xl md:text-4xl font-bold mb-5 tracking-tight leading-[1.1]">
          Bereit für{" "}
          <span className="bg-gradient-to-r from-primary to-accent-violet bg-clip-text text-transparent">
            strukturierte Entscheidungen
          </span>
          ?
        </h2>

        <p className="text-muted-foreground/60 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
          14 Tage kostenlos. Keine Kreditkarte. Jederzeit kündbar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="rounded-full group px-8 shadow-lg shadow-primary/10">
            Kostenlos starten
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="rounded-full border-border/40 px-8">
            Demo vereinbaren
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

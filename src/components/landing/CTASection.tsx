import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Aurora glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-t from-aurora-violet/[0.1] via-aurora-blue/[0.06] to-transparent blur-[120px]" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-[-0.04em] leading-[1.05]">
          Bereit für{" "}
          <span className="bg-gradient-to-r from-aurora-blue via-accent-violet to-aurora-mint bg-clip-text text-transparent bg-[length:200%_auto] animate-aurora-shift">
            strukturierte Entscheidungen
          </span>
          ?
        </h2>

        <p className="text-muted-foreground/60 max-w-md mx-auto mb-10 text-base leading-relaxed">
          14 Tage kostenlos. Keine Kreditkarte. Jederzeit kündbar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button
              size="lg"
              className="rounded-full group px-8 h-12 text-[15px] shadow-xl shadow-primary/15"
            >
              Kostenlos starten
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-12 text-[15px] border-border/60"
          >
            Demo vereinbaren
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Soft gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

    <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-5 leading-[1.1]">
          Starten Sie heute.
          <br />
          Erste Entscheidung in 3 Minuten.
        </h2>
        <p className="text-muted-foreground mb-10 text-base">
          Keine Kreditkarte · Keine Installation · DSGVO-konform
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-7 py-3 rounded-xl shadow-sm transition-all"
          >
            Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:demo@decivio.com"
            className="inline-flex items-center justify-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-7 py-3 rounded-xl transition-all"
          >
            Demo buchen
          </a>
        </div>

        <p className="mt-10 text-[11px] text-muted-foreground/50">
          Server in Deutschland · ISO 27001 · AVV inklusive
        </p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

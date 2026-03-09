import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" aria-label="Jetzt starten">
      <div className="aurora-bg" />

      <motion.div style={{ y: orbY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            Erste Entscheidung in 3 Minuten.
            <br />
            <span className="text-primary">Keine Kreditkarte. Kein IT-Projekt.</span>
          </h2>

          <p className="mb-10 text-[15px] text-muted-foreground max-w-md mx-auto">
            Starten Sie heute. Ihr nächster Audit-Prüfer wird es Ihnen danken.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-primary-foreground px-9 py-4 rounded-xl bg-primary hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="mailto:hallo@decivio.com"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-medium glass-ultra px-7 py-3.5 rounded-xl hover:shadow-md text-muted-foreground hover:text-foreground transition-all"
            >
              Demo buchen
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {["🇩🇪 Server in Deutschland", "🔒 DSGVO", "📋 AVV inklusive", "↕ Jederzeit kündbar"].map((item, i) => (
              <span key={i} className="text-[11px] font-medium text-muted-foreground">{item}</span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

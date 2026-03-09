import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;
const COST_PER_SECOND = 47000 / 30 / 24 / 3600;

const CTASection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const [pageCost, setPageCost] = useState(0);
  const pageStart = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setPageCost(((Date.now() - pageStart.current) / 1000) * COST_PER_SECOND);
    }, 80);
    return () => clearInterval(id);
  }, []);

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
          {/* Live cost — since page visit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-ultra mb-10"
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-destructive"
            />
            <span className="text-[12px] text-muted-foreground">
              Seit Ihrem Seitenbesuch:{" "}
              <span className="font-mono font-bold text-destructive tabular-nums">
                €{pageCost.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            Starten Sie jetzt.
            <br />
            <span className="text-primary">Erste Entscheidung in 3 Minuten.</span>
          </h2>

          <p className="mb-10 text-[15px] text-muted-foreground max-w-md mx-auto">
            Keine Installation. Kein IT-Projekt. Registrieren, Branche wählen, loslegen.
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
            {["🇩🇪 Server in DE", "🔒 ISO 27001", "📋 AVV inklusive", "🛡️ DSGVO"].map((item, i) => (
              <span key={i} className="text-[11px] font-medium text-muted-foreground">{item}</span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

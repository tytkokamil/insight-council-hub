import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const orbScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);

  return (
    <section ref={ref} className="py-28 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div style={{ y: orbY, scale: orbScale }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-violet/[0.03] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-accent-teal/[0.03] blur-[80px]" />
      </motion.div>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--primary) / 0.15) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          {/* Glowing badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/[0.05] mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-primary">14 Tage kostenlos · Keine Kreditkarte</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-5 leading-[1.1]">
            Starten Sie heute.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-blue to-accent-violet bg-clip-text text-transparent">
              Erste Entscheidung in 3 Minuten.
            </span>
          </h2>
          <p className="text-muted-foreground mb-10 text-base max-w-lg mx-auto">
            Keine Installation. Kein IT-Projekt. Einfach registrieren, Branche wählen und loslegen.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="mailto:demo@decivio.com"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground border border-border/60 hover:border-border px-7 py-3 rounded-xl transition-all"
            >
              Demo buchen
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {[
              "🇩🇪 Server in Deutschland",
              "🔒 ISO 27001",
              "📋 AVV inklusive",
              "🛡️ DSGVO-konform",
            ].map((item, i) => (
              <span key={i} className="text-[11px] text-muted-foreground/50">{item}</span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

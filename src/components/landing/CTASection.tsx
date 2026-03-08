import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const orbY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const orbScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" aria-label="Jetzt starten">
      {/* Soft ambient orbs */}
      <motion.div style={{ y: orbY, scale: orbScale }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.05] blur-[150px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-accent/[0.03] blur-[80px]" />
      </motion.div>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, hsl(220 30% 55% / 0.3) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-background/70 backdrop-blur-md mb-10 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-semibold text-primary">14 Tage kostenlos · Keine Kreditkarte</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            Starten Sie heute.
            <br />
            <span className="text-primary">
              Erste Entscheidung in 3 Minuten.
            </span>
          </h2>
          <p className="mb-10 text-base text-muted-foreground max-w-lg mx-auto">
            Keine Installation. Kein IT-Projekt. Einfach registrieren, Branche wählen und loslegen.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-primary-foreground px-9 py-4 rounded-xl transition-all duration-300 overflow-hidden bg-primary hover:shadow-[0_4px_24px_-6px_hsl(var(--primary)/0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="mailto:demo@decivio.com"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-medium border border-border/50 hover:border-border/80 bg-background/60 backdrop-blur-sm px-7 py-3.5 rounded-xl transition-all hover:shadow-sm text-muted-foreground hover:text-foreground"
            >
              Demo buchen
            </a>
          </div>

          {/* Social proof + trust */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 space-y-4"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {["MH", "SK", "TB", "AL"].map((initials, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-[12px] text-muted-foreground/60 ml-1">
                <span className="font-semibold text-muted-foreground">120+</span> Unternehmen nutzen Decivio
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                "🇩🇪 Server in Deutschland",
                "🔒 ISO 27001",
                "📋 AVV inklusive",
                "🛡️ DSGVO-konform",
              ].map((item, i) => (
                <span key={i} className="text-[11px] font-medium text-muted-foreground/50">{item}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

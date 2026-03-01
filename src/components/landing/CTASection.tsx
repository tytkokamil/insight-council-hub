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
      {/* Soft ambient orbs */}
      <motion.div style={{ y: orbY, scale: orbScale }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[hsl(220,40%,70%,0.05)] blur-[150px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(250,35%,70%,0.04)] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[hsl(180,30%,65%,0.03)] blur-[80px]" />
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(220,40%,70%,0.2)] bg-white/60 mb-10 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(220,50%,55%)] animate-pulse" />
            <span className="text-[11px] font-semibold" style={{ color: 'hsl(220 45% 50%)' }}>14 Tage kostenlos · Keine Kreditkarte</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
            Starten Sie heute.
            <br />
            <span className="bg-gradient-to-r from-[hsl(220,45%,50%)] via-[hsl(240,35%,55%)] to-[hsl(200,40%,48%)] bg-clip-text text-transparent">
              Erste Entscheidung in 3 Minuten.
            </span>
          </h2>
          <p className="mb-10 text-base max-w-lg mx-auto">
            Keine Installation. Kein IT-Projekt. Einfach registrieren, Branche wählen und loslegen.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="group relative inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white px-9 py-4 rounded-xl transition-all duration-300 overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, hsl(220 50% 48%), hsl(220 50% 40%))',
                boxShadow: '0 2px 16px -4px hsl(220 50% 40% / 0.35)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Kostenlos starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="mailto:demo@decivio.com"
              className="inline-flex items-center justify-center gap-2 text-[14px] font-medium border border-border/50 hover:border-border/80 bg-white/60 backdrop-blur-sm px-7 py-3.5 rounded-xl transition-all hover:shadow-sm"
              style={{ color: 'hsl(220 12% 48%)' }}
            >
              Demo buchen
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              "🇩🇪 Server in Deutschland",
              "🔒 ISO 27001",
              "📋 AVV inklusive",
              "🛡️ DSGVO-konform",
            ].map((item, i) => (
              <span key={i} className="text-[11px] font-medium" style={{ color: 'hsl(220 12% 58%)' }}>{item}</span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

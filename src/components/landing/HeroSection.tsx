import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      <motion.div
        style={{ y: textY, opacity }}
        className="container relative z-10 mx-auto px-4 pt-24 pb-20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="h-px w-12 bg-primary" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary">
              Decision Governance Platform
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-[clamp(3rem,8vw,7rem)] font-bold tracking-[-0.06em] leading-[0.9]">
            <motion.span
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Entscheidungen
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="block text-muted-foreground/25"
            >
              brauchen Struktur.
            </motion.span>
          </h1>

          {/* Subline + CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-border pt-8"
          >
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              KI-Risikoanalyse, SLA-Eskalation und Executive Dashboards — 
              für Teams, die bessere Entscheidungen treffen.
            </p>

            <div className="flex gap-3 shrink-0">
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full group px-8 h-12 text-[15px]">
                  Kostenlos starten
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 text-[15px]"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Mehr erfahren
              </Button>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 flex items-center gap-8 text-xs text-muted-foreground/40 font-medium"
          >
            {["DSGVO-konform", "SOC 2 Ready", "E2E-verschlüsselt", "KI-gestützt"].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </section>
  );
};

export default HeroSection;

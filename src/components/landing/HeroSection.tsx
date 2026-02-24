import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import ProductTourModal from "./ProductTourModal";

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection = () => {
  const { t } = useTranslation();
  const [showTour, setShowTour] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const dashboardScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.4, 0.9], [1, 0]);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-28 pb-16 w-full">
      {/* Subtle animated gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] rounded-full opacity-[0.03]"
          style={{ background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent-teal)), hsl(var(--accent-violet)), hsl(var(--primary)))" }}
        />
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/[0.02] blur-[120px]" />
      </div>

      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-muted/60 border border-border mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground tracking-[0.12em] uppercase">
              {t("landing.hero.badge")}
            </span>
          </motion.div>

          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold tracking-[-0.045em] leading-[1.02] mb-8">
            <motion.span initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.2, duration: 0.8, ease }} className="block">
              {t("landing.hero.headline1")}
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 30, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.35, duration: 0.8, ease }} className="block">
              {t("landing.hero.headline2")}{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-primary via-accent-violet to-accent-teal bg-clip-text text-transparent">
                  {t("landing.hero.headline3")}
                </span>
              </span>
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8, ease }} className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
            {t("landing.hero.subline")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6, ease }} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" className="rounded-full group shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15 transition-all" asChild>
              <a href="/auth">
                {t("landing.hero.ctaStart")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="outline" size="xl" className="rounded-full border-border/60 hover:bg-muted/30" onClick={() => setShowTour(true)}>
              <Play className="w-4 h-4" />
              {t("landing.hero.ctaDemo")}
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1 }} className="mt-14 flex items-center justify-center gap-8">
            {[
              t("landing.hero.gdpr"),
              t("landing.hero.soc2"),
              t("landing.hero.enterprise"),
            ].map((text, i) => (
              <span key={i} className="text-[11px] text-muted-foreground/40 font-medium tracking-wide">{text}</span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 1.4, ease }}
          style={{ y: dashboardY, scale: dashboardScale, opacity: dashboardOpacity }}
          className="mt-20 relative max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xl shadow-primary/[0.04]">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/30 bg-muted/15">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/[0.08]" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/[0.08]" />
                <div className="w-2.5 h-2.5 rounded-full bg-foreground/[0.08]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/40 text-[11px] text-muted-foreground/50 font-mono border border-border/20">
                  app.decivio.com
                </div>
              </div>
            </div>

            <div className="relative p-5 md:p-8 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("landing.hero.approved"), value: "12", color: "text-accent-teal" },
                  { label: t("landing.hero.inReview"), value: "5", color: "text-accent-amber" },
                  { label: t("landing.hero.riskScore"), value: "34%", color: "text-primary" },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4 + i * 0.1, duration: 0.5, ease }} className="p-4 rounded-xl border border-border/40 bg-muted/10">
                    <div className={`text-2xl md:text-3xl font-bold font-display tabular-nums ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7, duration: 0.6 }} className="p-5 rounded-xl bg-muted/10 border border-border/30">
                <div className="text-xs font-medium text-muted-foreground mb-4">{t("landing.hero.velocity")}</div>
                <div className="flex items-end gap-1.5 h-20">
                  {[40, 65, 50, 80, 55, 90, 70, 95, 75, 60, 85, 72].map((h, i) => (
                    <motion.div key={i} className="flex-1 rounded-sm bg-primary/8 hover:bg-primary/15 transition-colors" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 1.8 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
                  ))}
                </div>
              </motion.div>
              
              <div className="space-y-2">
                {[
                  { title: t("landing.hero.q4Budget"), status: t("landing.hero.statusApproved"), color: "text-accent-teal bg-accent-teal/8" },
                  { title: t("landing.hero.engineeringHiring"), status: t("landing.hero.statusReview"), color: "text-accent-amber bg-accent-amber/8" },
                  { title: t("landing.hero.cloudMigration"), status: t("landing.hero.statusDraft"), color: "text-muted-foreground bg-muted/50" },
                ].map((row, i) => (
                  <motion.div key={row.title} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 + i * 0.08, duration: 0.4, ease }} className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-card">
                    <div className="w-1 h-1 rounded-full bg-foreground/20" />
                    <span className="text-xs font-medium flex-1 truncate">{row.title}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${row.color}`}>{row.status}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>
          
          <div className="absolute -bottom-8 left-[10%] right-[10%] h-16 bg-primary/[0.03] blur-[40px] rounded-full" />
        </motion.div>
      </div>

      <ProductTourModal open={showTour} onOpenChange={setShowTour} />
    </section>
  );
};

export default HeroSection;

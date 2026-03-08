import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingCTA = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.8, ease }}
      className="mt-24 text-center max-w-xl mx-auto relative"
    >
      {/* Subtle glow behind CTA */}
      <div className="absolute inset-0 -top-8 -bottom-8 bg-primary/[0.03] rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-5"
        >
          <Sparkles className="w-3 h-3" />
          {t("landing.pricing.annually") === "Annually" ? "No credit card required" : "Keine Kreditkarte nötig"}
        </motion.div>

        <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          {t("landing.pricing.ctaTitle")}
        </h3>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          {t("landing.pricing.ctaSubtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/auth">
            <Button
              variant="hero"
              size="xl"
              className="group/btn shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.5)] transition-shadow duration-300"
            >
              {t("landing.pricing.ctaStart")}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="mailto:hallo@decivio.com">
            <Button variant="outline" size="xl">
              {t("landing.pricing.ctaDemo")}
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingCTA;

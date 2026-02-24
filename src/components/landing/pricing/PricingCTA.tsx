import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingCTA = () => {
  const { t } = useTranslation();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.7, ease }} className="mt-20 text-center max-w-xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{t("landing.pricing.ctaTitle")}</h3>
      <p className="text-muted-foreground text-sm mb-8">{t("landing.pricing.ctaSubtitle")}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/auth">
          <Button variant="hero" size="xl" className="group/btn">
            {t("landing.pricing.ctaStart")}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
        <a href="mailto:demo@decivio.com">
          <Button variant="outline" size="xl">{t("landing.pricing.ctaDemo")}</Button>
        </a>
      </div>
    </motion.div>
  );
};

export default PricingCTA;

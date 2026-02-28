import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getTrustItems } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingTrust = () => {
  const { t } = useTranslation();
  const trustItems = getTrustItems(t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.7, ease }}
      className="mt-12 max-w-3xl mx-auto"
    >
      <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.4, ease }}
              className="flex items-center gap-2 text-muted-foreground group/trust"
            >
              <ShieldCheck className="w-4 h-4 text-accent-teal shrink-0 group-hover/trust:scale-110 transition-transform" />
              <span className="text-xs font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PricingTrust;

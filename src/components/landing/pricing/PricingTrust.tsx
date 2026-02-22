import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { trustItems } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingTrust = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: 0.3, duration: 0.7, ease }}
    className="mt-16 max-w-3xl mx-auto"
  >
    <div className="rounded-xl border border-border bg-card/50 p-6">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {trustItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-accent-teal shrink-0" />
            <span className="text-xs font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

export default PricingTrust;

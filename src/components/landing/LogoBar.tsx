import { motion } from "framer-motion";
import { Factory, Car, Pill, Landmark, Server, Zap, Shield, Globe } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const logos = [
  { name: "Maschinenbau", icon: Factory },
  { name: "Automotive", icon: Car },
  { name: "Pharma", icon: Pill },
  { name: "Finanzwesen", icon: Landmark },
  { name: "IT-Dienstleister", icon: Server },
  { name: "Energie", icon: Zap },
];

const trustBadges = [
  { icon: Shield, label: "DSGVO-konform" },
  { icon: Globe, label: "Server in Deutschland" },
  { icon: Shield, label: "ISO 27001" },
  { icon: Factory, label: "Made in Germany" },
];

const LogoBar = () => (
  <section className="py-12 relative">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="text-center text-xs font-medium text-muted-foreground/60 uppercase tracking-[0.15em] mb-8">
          Vertraut von Unternehmen aus dem Mittelstand
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mb-10">
          {logos.map((logo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className="flex items-center gap-2 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/50">
                <logo.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium tracking-tight">{logo.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground/60 text-[11px] font-medium"
            >
              <badge.icon className="w-3 h-3" />
              {badge.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default LogoBar;

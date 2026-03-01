import { motion } from "framer-motion";
import { Factory, Car, Pill, Landmark, Server, Zap } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const logos = [
  { name: "Maschinenbau", icon: Factory },
  { name: "Automotive", icon: Car },
  { name: "Pharma", icon: Pill },
  { name: "Finanzwesen", icon: Landmark },
  { name: "IT-Dienstleister", icon: Server },
  { name: "Energie", icon: Zap },
];

const LogoBar = () => (
  <section className="py-10 relative">
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      >
        <p className="text-center text-[11px] text-muted-foreground/50 uppercase tracking-[0.15em] mb-6">
          Vertraut von Unternehmen aus dem Mittelstand
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {logos.map((logo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease }}
              className="flex items-center gap-2 text-muted-foreground/35"
            >
              <logo.icon className="w-4 h-4" />
              <span className="text-[13px] font-medium">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default LogoBar;

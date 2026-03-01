import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const logos = [
  { name: "TechCorp", initials: "TC" },
  { name: "MaschBau AG", initials: "MB" },
  { name: "PharmaSolutions", initials: "PS" },
  { name: "AutoParts GmbH", initials: "AP" },
  { name: "FinanzWerk", initials: "FW" },
  { name: "EnergiePlus", initials: "E+" },
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
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((logo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className="flex items-center gap-2 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground/50">
                {logo.initials}
              </div>
              <span className="text-sm font-medium tracking-tight">{logo.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default LogoBar;

import { motion } from "framer-motion";

const logos = [
  { name: "Siemens", letters: "SI" },
  { name: "Deutsche Bahn", letters: "DB" },
  { name: "SAP", letters: "SAP" },
  { name: "Bosch", letters: "BO" },
  { name: "Allianz", letters: "AZ" },
  { name: "BMW Group", letters: "BMW" },
  { name: "BASF", letters: "BF" },
  { name: "Henkel", letters: "HK" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const LogoCloudSection = () => (
  <section className="py-16 relative border-y border-border/30">
    <div className="container mx-auto px-4">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-xs font-medium text-muted-foreground/50 text-center mb-10 tracking-widest uppercase"
      >
        Vertraut von führenden Enterprise-Teams
      </motion.p>

      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 max-w-4xl mx-auto">
        {logos.map((logo, i) => (
          <motion.div
            key={logo.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
            className="flex items-center gap-2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-500 select-none"
          >
            <span className="font-display text-lg font-bold tracking-tight">{logo.letters}</span>
            <span className="text-sm font-medium hidden sm:inline">{logo.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default LogoCloudSection;

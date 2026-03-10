import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const trustItems = [
  { emoji: "🔒", label: "DSGVO-KONFORM" },
  { emoji: "🇩🇪", label: "SERVER IN DEUTSCHLAND" },
  { emoji: "🔐", label: "SHA-256 AUDIT TRAIL" },
  { emoji: "📋", label: "AVV INKLUSIVE" },
  { emoji: "⚡", label: "SETUP IN 3 MINUTEN" },
];

const LogoBar = () => (
  <section className="relative py-5" aria-label="Trust-Bar" style={{ background: "hsl(var(--muted) / 0.3)" }}>
    <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1"
      >
        {trustItems.map((item, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              color: "hsl(var(--muted-foreground))",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
            {i < trustItems.length - 1 && <span className="ml-2 text-border select-none hidden md:inline">|</span>}
          </motion.span>
        ))}
      </motion.div>
    </div>
  </section>
);

export default LogoBar;

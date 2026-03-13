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
  <section className="relative pt-8 pb-24 overflow-hidden" aria-label="Trust-Bar" style={{ background: "hsl(222 47% 4%)" }}>
    <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2"
      >
        {trustItems.map((item, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </motion.span>
        ))}
      </motion.div>
    </div>

    {/* Seamless transition from dark zone to content zone */}
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{
        height: "200px",
        background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)",
      }}
    />
  </section>
);

export default LogoBar;

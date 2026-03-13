import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Crown, Sparkles, Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const FoundingSection = () => {
  const [claimed, setClaimed] = useState(3);
  const [total, setTotal] = useState(20);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("founding_customer_slots")
          .select("claimed_slots, total_slots")
          .limit(1)
          .single();
        if (data) {
          setClaimed(data.claimed_slots ?? 3);
          setTotal(data.total_slots ?? 20);
        }
      } catch { /* fallback */ }
    };
    fetch();
  }, []);

  const remaining = total - claimed;
  const progress = (claimed / total) * 100;

  if (remaining <= 0) return null;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: "hsl(222, 47%, 4%)" }}>
      {/* Animated mesh blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 20, -10, 0], y: [0, -15, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--accent-amber) / 0.08) 0%, transparent 60%)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ x: [0, -15, 10, 0], y: [0, 10, -15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--accent-violet) / 0.06) 0%, transparent 60%)", filter: "blur(40px)" }}
        />
      </div>

      {/* Noise */}
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-40" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: "linear-gradient(135deg, hsl(var(--accent-amber) / 0.15), hsl(var(--accent-amber) / 0.05))",
              border: "1px solid hsl(var(--accent-amber) / 0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Crown className="w-4 h-4 text-accent-amber" />
            <span className="text-[12px] font-semibold tracking-[0.1em] uppercase" style={{ color: "hsl(var(--accent-amber))" }}>
              Founding Customer Program
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Professional für{" "}
            <span className="relative inline-block">
              <span
                className="relative z-10"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-rose)))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                €89/Mo
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--accent-amber) / 0.6), hsl(var(--accent-rose) / 0.4))" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6, ease }}
              />
            </span>
            <br />
            <span style={{ color: "rgba(255,255,255,0.4)" }}>statt €149.</span>
            {" "}Lebenslang.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6, ease }}
            className="text-[16px] md:text-[18px] max-w-lg mx-auto leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Für die ersten 20 Kunden, die mit uns starten. Kein Ablaufdatum.
            Kein automatischer Preisanstieg. Solange Sie Kunde sind.
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6, ease }}
            className="max-w-md mx-auto mb-10"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Flame className="w-4 h-4 inline-block mr-1 text-accent-amber" />
                {claimed} von {total} vergeben
              </span>
              <span className="text-[13px] font-bold" style={{ color: "hsl(var(--accent-amber))" }}>
                {remaining} verfügbar
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--accent-amber)), hsl(var(--accent-rose)))",
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1, ease }}
              >
                {/* Shine effect on progress */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    width: "50%",
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
          >
            {[
              { icon: Lock, text: "Preis lebenslang fixiert" },
              { icon: Users, text: "Bis 25 Nutzer" },
              { icon: Sparkles, text: "Alle Pro-Features" },
            ].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.text}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5, ease }}
          >
            <Link
              to="/auth?founding=true"
              className="group relative inline-flex items-center justify-center gap-2.5 text-[15px] font-bold px-10 py-4.5 rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(var(--accent-amber)), hsl(var(--accent-rose) / 0.85))",
                color: "hsl(38 80% 12%)",
                boxShadow: "0 0 50px -10px hsl(var(--accent-amber) / 0.5), 0 0 100px -20px hsl(var(--accent-rose) / 0.3)",
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                }}
              />
              <span className="relative z-10 flex items-center gap-2.5">
                Founding-Platz sichern
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FoundingSection;

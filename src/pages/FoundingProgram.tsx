import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, Clock, Users, Flame, Star, Zap, Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

const ease = [0.16, 1, 0.3, 1] as const;

const benefits = [
  { icon: Crown, title: "Lebenslang −40%", desc: "Professional-Plan für €89/Monat statt €149 — solange Ihr Account existiert." },
  { icon: Star, title: "Founding Badge", desc: "Permanentes Gründer-Abzeichen in Ihrem Profil und Audit Trail." },
  { icon: Zap, title: "Direkter Draht", desc: "Persönlicher Slack-Kanal mit dem Gründerteam. Feature-Requests werden priorisiert." },
  { icon: Users, title: "Advisory Board", desc: "Stimmen Sie über die Roadmap ab und gestalten Sie Decivio aktiv mit." },
  { icon: Shield, title: "Compliance-Garantie", desc: "Wir passen die Plattform an Ihre Compliance-Anforderungen an — kostenlos." },
  { icon: Clock, title: "Frühester Zugang", desc: "Neue Features 4 Wochen vor allen anderen. Beta-Zugang zu experimentellen KI-Funktionen." },
];

// ── Hook: live founding slots from DB + Realtime ────────
function useFoundingSlots() {
  const [totalSlots, setTotalSlots] = useState(20);
  const [claimedSlots, setClaimedSlots] = useState(13);
  const [deadline, setDeadline] = useState<Date>(new Date("2026-04-15T23:59:59+02:00"));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetch = async () => {
      const { data } = await supabase
        .from("founding_customer_slots")
        .select("total_slots, claimed_slots, deadline")
        .limit(1)
        .single();
      if (data) {
        setTotalSlots(data.total_slots);
        setClaimedSlots(data.claimed_slots);
        setDeadline(new Date(data.deadline));
      }
      setLoaded(true);
    };
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel("founding-slots")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "founding_customer_slots" },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            setTotalSlots(row.total_slots);
            setClaimedSlots(row.claimed_slots);
            setDeadline(new Date(row.deadline));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { totalSlots, claimedSlots, remaining: totalSlots - claimedSlots, deadline, loaded };
}

// ── Hook: countdown timer ───────────────────────────────
function useCountdown(deadline: Date) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, deadline.getTime() - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const isUrgent = diff < 48 * 3_600_000;    // < 48h
  const isWarning = diff < 7 * 86_400_000;   // < 7 days

  return { d, h, m, s, isUrgent, isWarning, expired: diff <= 0 };
}

const FoundingProgram = () => {
  const { totalSlots, claimedSlots, remaining, deadline, loaded } = useFoundingSlots();
  const countdown = useCountdown(deadline);

  const countdownColor = countdown.isUrgent ? "#EF4444" : countdown.isWarning ? "#F97316" : "rgba(255,255,255,0.6)";

  return (
    <>
      <Helmet>
        <title>Founding Customer Program — Decivio</title>
        <meta name="description" content="Werden Sie einer der ersten 20 Founding Customers von Decivio. Lebenslang −40%, Gründer-Badge, direkter Draht zum Gründerteam." />
      </Helmet>

      <div className="min-h-screen" style={{ background: "#030712" }}>
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute pointer-events-none" style={{ top: "-200px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "600px", background: "radial-gradient(ellipse, rgba(239,68,68,0.10) 0%, transparent 70%)" }} />

          <div className="container relative z-10 mx-auto px-4 max-w-3xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <Flame className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
              <span style={{ color: "#EF4444", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>
                NUR {remaining} VON {totalSlots} PLÄTZE VERFÜGBAR
              </span>
            </motion.div>

            {/* Countdown timer */}
            {!countdown.expired && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <span className="text-[13px] font-mono font-semibold tabular-nums" style={{ color: countdownColor }}>
                  Angebot endet in: {countdown.d}T {String(countdown.h).padStart(2, "0")}h {String(countdown.m).padStart(2, "0")}m {String(countdown.s).padStart(2, "0")}s
                </span>
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8, ease }}
              className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.02em] leading-[1.15] mb-6"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              Werden Sie einer der ersten
              <br />
              <span style={{ color: "#EF4444" }}>20 Founding Customers.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease }}
              className="text-[15px] md:text-[17px] max-w-lg mx-auto leading-relaxed mb-10"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Lebenslanger Rabatt, direkter Draht zum Gründerteam, und die Chance, eine Kategorie mitzugestalten.
            </motion.p>

            {/* Live progress bar from DB */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: loaded ? 1 : 0.5, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="max-w-md mx-auto mb-10"
            >
              <div className="flex justify-between text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span>{claimedSlots} vergeben</span>
                <span>{remaining} frei</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(claimedSlots / totalSlots) * 100}%` }}
                  transition={{ delay: 0.6, duration: 1.2, ease }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #EF4444, #F97316)" }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5, ease }}
            >
              <Link
                to="/auth"
                className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 hover:opacity-90"
                style={{ background: "#EF4444" }}
              >
                Founding-Platz sichern <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-semibold text-center mb-14"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Was Founding Customers bekommen
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease }}
                  className="rounded-xl p-6"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <b.icon className="w-5 h-5 mb-3" style={{ color: "#EF4444" }} />
                  <h3 className="text-[14px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.9)" }}>{b.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Price comparison */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-4" style={{ color: "#EF4444" }}>
                FOUNDING CUSTOMER DEAL
              </p>
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="text-2xl font-semibold line-through" style={{ color: "rgba(255,255,255,0.3)" }}>€149</span>
                <span className="text-4xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>€89</span>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/Monat</span>
              </div>
              <p className="text-[13px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                Professional-Plan. Bis 25 Nutzer. Lebenslang locked.
              </p>
              <p className="text-[12px] mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                Jahresplan: €74/Mo statt €124
              </p>

              <ul className="text-left max-w-sm mx-auto space-y-2 mb-8">
                {[
                  "Alle Professional-Features",
                  "KI Daily Brief & CoPilot",
                  "Alle Compliance Frameworks",
                  "Unbegrenzter Audit Trail",
                  "Founding Badge & Advisory Board",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#EF4444" }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 hover:opacity-90"
                style={{ background: "#EF4444" }}
              >
                Jetzt Founding Customer werden <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Scarcity proof card (replaces testimonials) */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4 max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
              className="rounded-xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Lock className="w-6 h-6 mx-auto mb-4" style={{ color: "#EF4444" }} />
              <p className="text-[20px] md:text-[22px] font-semibold mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                Platz 1–{claimedSlots} bereits vergeben.
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Die nächsten {remaining} Unternehmen
                <br />
                erhalten €89/Mo — für immer. Danach: €149.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 max-w-xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[28px] md:text-[32px] font-semibold mb-4 leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
                {remaining} Plätze. Dann ist Schluss.
              </p>
              <p className="text-[14px] mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nach den ersten 20 steigt der Preis auf €149/Monat. Kein Upgrade möglich.
              </p>
              <Link
                to="/auth"
                className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 hover:opacity-90"
                style={{ background: "#EF4444" }}
              >
                Founding-Platz sichern <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default FoundingProgram;

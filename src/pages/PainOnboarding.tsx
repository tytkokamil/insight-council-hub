import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import decivioLogo from "@/assets/decivio-logo.png";
import { Slider } from "@/components/ui/slider";

const PainOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [decisions, setDecisions] = useState(8);
  const [hourlyRate, setHourlyRate] = useState(85);
  const [slidersInteracted, setSlidersInteracted] = useState(false);
  const [showSecondSlider, setShowSecondSlider] = useState(false);
  const [tickerValue, setTickerValue] = useState(0);
  const startTimeRef = useRef(Date.now());
  const animFrameRef = useRef<number>(0);

  // Show second slider after 1 second
  useEffect(() => {
    const timer = setTimeout(() => setShowSecondSlider(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-show calculation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setSlidersInteracted(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Weekly cost formula: hourlyRate * 8h * (decisions * 2.5) * 7 / 7
  const weeklyCost = useMemo(
    () => Math.round(hourlyRate * 8 * decisions * 2.5),
    [hourlyRate, decisions]
  );

  // Smooth ticker animation
  const costPerSecond = useMemo(
    () => (hourlyRate * decisions * 2.5) / 3600,
    [hourlyRate, decisions]
  );

  useEffect(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTickerValue(elapsed * costPerSecond);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [costPerSecond]);

  const handleCTA = useCallback(async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", profile.org_id)
        .single();
      const currentSettings = (org?.settings as Record<string, any>) || {};
      await supabase.from("organizations").update({
        settings: {
          ...currentSettings,
          cod_hourly_rate: hourlyRate,
          avg_decision_count: decisions,
          avg_persons_involved: Math.round(decisions * 0.3),
          onboarding_pain_completed: true,
        },
      }).eq("id", profile.org_id);
    }

    localStorage.setItem("pain_hourly_rate", String(hourlyRate));
    localStorage.setItem("pain_decision_count", String(decisions));
    navigate("/welcome", { replace: true });
  }, [user, hourlyRate, decisions, navigate]);

  const formattedCost = weeklyCost.toLocaleString("de-DE");
  const formattedTicker = Math.floor(tickerValue).toLocaleString("de-DE");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Logo */}
      <div className="mt-12 mb-8 flex items-center gap-2">
        <img src={decivioLogo} alt="Decivio" className="w-7 h-7 rounded-lg" />
        <span className="text-primary font-semibold text-xl">Decivio</span>
      </div>

      {/* Question */}
      <h1 className="text-4xl font-bold text-primary text-center mb-10 px-4">
        Eine Frage bevor wir starten.
      </h1>

      {/* Slider Card */}
      <div className="w-full max-w-[640px] mx-auto px-4">
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-10 space-y-8">
          {/* First Slider */}
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground text-center">
              Wie viele Entscheidungen, Freigaben oder Genehmigungen hat Ihr Unternehmen gerade offen?
            </p>
            <Slider
              value={[decisions]}
              onValueChange={([v]) => { setDecisions(v); setSlidersInteracted(true); }}
              min={1}
              max={50}
              step={1}
              className="[&_[role=slider]]:w-7 [&_[role=slider]]:h-7 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&>span:first-child]:h-2 [&>span:first-child>span]:bg-primary"
            />
            <p className="text-center">
              <span className="text-5xl font-extrabold text-primary tabular-nums">{decisions}</span>
              <span className="text-lg text-muted-foreground ml-2">offene Entscheidungen</span>
            </p>
          </div>

          {/* Second Slider */}
          <AnimatePresence>
            {showSecondSlider && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5 }}
                className="space-y-6 overflow-hidden"
              >
                <p className="text-lg text-muted-foreground text-center">
                  Wie hoch ist der durchschnittliche Stundensatz Ihrer Entscheider?
                </p>
                <Slider
                  value={[hourlyRate]}
                  onValueChange={([v]) => { setHourlyRate(v); setSlidersInteracted(true); }}
                  min={40}
                  max={300}
                  step={5}
                  className="[&_[role=slider]]:w-7 [&_[role=slider]]:h-7 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&>span:first-child]:h-2 [&>span:first-child>span]:bg-primary"
                />
                <p className="text-center">
                  <span className="text-5xl font-extrabold text-primary tabular-nums">{hourlyRate}</span>
                  <span className="text-lg text-muted-foreground ml-2">€/Stunde</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Calculation */}
          <AnimatePresence>
            {slidersInteracted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="pt-6 border-t border-border space-y-3"
              >
                <p className="text-sm uppercase tracking-wider text-muted-foreground/60 text-center">
                  Diese offenen Entscheidungen kosten Sie gerade:
                </p>
                <p className="text-center">
                  <span className="text-7xl font-extrabold text-destructive tabular-nums transition-colors duration-300">
                    {formattedTicker} €
                  </span>
                </p>
                <p className="text-base text-muted-foreground text-center">
                  pro Woche — und der Zähler läuft.
                </p>
                <p className="text-xs text-muted-foreground/50 italic text-center">
                  Basierend auf Ihren Angaben und durchschnittlichen Verzögerungszeiten im deutschen Mittelstand.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <button
          onClick={handleCTA}
          className="w-full h-14 mt-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold transition-colors duration-200 cursor-pointer"
        >
          Meine echten Zahlen sehen →
        </button>

        <p className="text-sm text-muted-foreground/50 text-center mt-4 mb-12">
          Keine Kreditkarte · Kostenlos starten · Jederzeit kündbar
        </p>
      </div>
    </div>
  );
};

export default PainOnboarding;

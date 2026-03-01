import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Loader2, Play, Diamond, Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { industries } from "@/lib/industries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import decivioLogo from "@/assets/decivio-logo.png";

type WizardStep = 1 | 2 | 3;

const INDUSTRY_GRID = [
  { id: "maschinenbau", icon: "🏭", label: "Maschinenbau" },
  { id: "pharma", icon: "💊", label: "Pharma" },
  { id: "automotive", icon: "🚗", label: "Automotive" },
  { id: "finanzen", icon: "🏦", label: "Finanzen" },
  { id: "it", icon: "💻", label: "IT & Software" },
  { id: "bau", icon: "🏗️", label: "Bau" },
  { id: "energie", icon: "⚡", label: "Energie" },
  { id: "healthcare", icon: "🏥", label: "Healthcare" },
  { id: "handel", icon: "🛒", label: "Handel" },
  { id: "oeffentlich", icon: "🏛️", label: "Öffentl. Sektor" },
  { id: "lebensmittel", icon: "🌾", label: "Lebensmittel" },
  { id: "allgemein", icon: "⚙️", label: "Andere" },
];

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [choseDemo, setChoseDemo] = useState(false);
  const [dailyBriefEnabled, setDailyBriefEnabled] = useState(true);
  const [briefEmail, setBriefEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user?.email) setBriefEmail(user.email);
  }, [user?.email]);

  const progressPercent = (step / 3) * 100;

  const handleIndustryContinue = async () => {
    if (!selectedIndustry || !user) return;
    setLoading(true);
    const ind = INDUSTRY_GRID.find(i => i.id === selectedIndustry);
    setLoadingText(`Lade ${ind?.label || ""}-Vorlagen...`);

    await supabase.from("profiles").update({ industry: selectedIndustry } as any).eq("user_id", user.id);

    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setLoadingText("");
    setStep(2);
  };

  const handleDemoLoad = async () => {
    if (!user) return;
    setLoading(true);
    setLoadingText("Bereite Demo-Daten vor...");
    setChoseDemo(true);

    try {
      await supabase.functions.invoke("seed-demo-data", {
        body: { userId: user.id, industry: selectedIndustry },
      });
    } catch (e) {
      console.error("Demo seed error:", e);
    }

    setLoading(false);
    setLoadingText("");
    setStep(3);
  };

  const handleDirectStart = () => {
    setChoseDemo(false);
    setStep(3);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    // Save daily brief preference
    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      review_requests: true,
      escalations: true,
      team_updates: true,
      mention_enabled: true,
      deadline_enabled: true,
      status_change_enabled: true,
      digest_frequency: dailyBriefEnabled ? "daily" : "never",
    } as any, { onConflict: "user_id" });

    // Mark onboarding completed
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);

    setLoading(false);

    if (choseDemo) {
      navigate("/dashboard", { replace: true });
    } else {
      // Navigate to dashboard with flag to open new decision dialog
      navigate("/dashboard?newDecision=true", { replace: true });
    }
  };

  // Loading overlay
  if (loading && loadingText) {
    return (
      <div className="min-h-screen bg-[#060D1A] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium text-white"
        >
          {loadingText}
        </motion.p>
        {step === 2 && (
          <div className="w-64">
            <Progress value={65} className="h-1.5 bg-white/10" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D1A] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src={decivioLogo} alt="Decivio" className="w-full h-full" />
          </div>
          <span className="text-white/80 font-semibold text-sm">Decivio</span>
        </div>
        <span className="text-white/40 text-xs">Schritt {step} von 3</span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-8">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden max-w-xl mx-auto">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 overflow-y-auto pb-12">
        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Industry ═══ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[600px]"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white">
                  Für welche Branche richten wir Decivio ein?
                </h1>
                <p className="text-white/50 text-sm mt-2">
                  Wir laden die passenden Vorlagen und Compliance-Einstellungen automatisch.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {INDUSTRY_GRID.map((ind, i) => {
                  const isSelected = selectedIndustry === ind.id;
                  return (
                    <motion.button
                      key={ind.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedIndustry(ind.id)}
                      className={`relative p-3.5 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 hover:border-white/25 bg-white/5"
                      }`}
                    >
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </motion.div>
                      )}
                      <span className="text-2xl block mb-1.5">{ind.icon}</span>
                      <span className="text-[11px] font-medium text-white/80 leading-tight block">{ind.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-8">
                <Button
                  size="lg"
                  disabled={!selectedIndustry}
                  onClick={handleIndustryContinue}
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-sm font-semibold"
                >
                  Weiter <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: Demo or Start ═══ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[600px]"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white">
                  Wie möchtest du Decivio kennenlernen?
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Demo card */}
                <button
                  onClick={handleDemoLoad}
                  className="text-left p-6 rounded-xl border-2 border-white/10 hover:border-blue-500/60 bg-white/5 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <Play className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Mit Beispieldaten starten</h3>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    Sieh Decivio in Aktion — mit realistischen Entscheidungen aus dem{" "}
                    {INDUSTRY_GRID.find(i => i.id === selectedIndustry)?.label || ""}-Bereich. Keine eigenen Daten nötig.
                  </p>
                  <span className="text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                    Demo laden <ArrowRight className="w-3 h-3" />
                  </span>
                </button>

                {/* Direct start card */}
                <button
                  onClick={handleDirectStart}
                  className="text-left p-6 rounded-xl border-2 border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/8 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                    <Diamond className="w-5 h-5 text-white/60" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Erste echte Entscheidung anlegen</h3>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    Starte direkt mit einer echten Entscheidung aus deinem Unternehmen. In 2 Minuten fertig.
                  </p>
                  <span className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors flex items-center gap-1">
                    Jetzt starten <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Daily Brief ═══ */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[600px]"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white">Dein täglicher Assistent</h1>
                <p className="text-white/50 text-sm mt-2 max-w-md mx-auto">
                  Jeden Morgen um 07:30 Uhr erhältst du eine E-Mail mit:
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-6">
                <ul className="space-y-3">
                  {[
                    "Den 3 kritischsten offenen Entscheidungen",
                    "Aktuellen Verzögerungskosten (Cost-of-Delay)",
                    "SLA-Warnungen für heute",
                    "Einer konkreten Handlungsempfehlung",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <span className="text-blue-400 mt-0.5">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 mb-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">KI Daily Brief aktivieren</span>
                </div>
                <Switch
                  checked={dailyBriefEnabled}
                  onCheckedChange={setDailyBriefEnabled}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              {/* Email field */}
              <div className="mb-8">
                <label className="text-xs text-white/40 mb-1.5 block">E-Mail-Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={briefEmail}
                    onChange={(e) => setBriefEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleFinish}
                disabled={loading}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 text-sm font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Decivio starten <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Welcome;

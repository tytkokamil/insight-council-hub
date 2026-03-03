import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import decivioLogo from "@/assets/decivio-logo.png";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import IndustryStep from "@/components/onboarding/IndustryStep";
import TeamSizeStep from "@/components/onboarding/TeamSizeStep";
import FirstDecisionStep from "@/components/onboarding/FirstDecisionStep";
import CompletionStep from "@/components/onboarding/CompletionStep";

const TOTAL_STEPS = 5;

const CATEGORY_BY_INDUSTRY: Record<string, string> = {
  maschinenbau: "operational",
  automotive: "strategic",
  pharma: "technical",
  it: "technical",
  bau: "operational",
  allgemein: "operational",
};

const slideAnim = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3 },
};

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedTeamSize, setSelectedTeamSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Step 4 form
  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionCategory, setDecisionCategory] = useState("operational");
  const [decisionPriority, setDecisionPriority] = useState("medium");
  const [usedDemo, setUsedDemo] = useState(false);

  // Live CoD ticker for step 5
  const [codTick, setCodTick] = useState(0);
  useEffect(() => {
    if (step !== 5) return;
    const iv = setInterval(() => setCodTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const liveCod = useMemo(() => {
    const baseDailyCod = decisionPriority === "critical" ? 2040 : decisionPriority === "high" ? 1530 : 510;
    return Math.round((baseDailyCod / 86400 * codTick) * 100) / 100;
  }, [codTick, decisionPriority]);

  const weeklyCod = useMemo(() => {
    const baseDailyCod = decisionPriority === "critical" ? 2040 : decisionPriority === "high" ? 1530 : 510;
    return baseDailyCod * 7;
  }, [decisionPriority]);

  useEffect(() => {
    if (selectedIndustry) {
      setDecisionCategory(CATEGORY_BY_INDUSTRY[selectedIndustry] || "operational");
    }
  }, [selectedIndustry]);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const progressPercent = (step / TOTAL_STEPS) * 100;
  const timeRemaining = Math.max(1, TOTAL_STEPS - step + 1) <= 2 ? "< 1 Min." : `~ ${TOTAL_STEPS - step} Min.`;

  const handleSkip = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
    navigate("/dashboard", { replace: true });
  };

  const handleIndustrySelect = (id: string) => {
    setSelectedIndustry(id);
    setTimeout(() => setStep(3), 300);
  };

  const handleTeamSizeSelect = async (id: string) => {
    setSelectedTeamSize(id);
    if (user) {
      await supabase.from("profiles").update({ industry: selectedIndustry } as any).eq("user_id", user.id);
    }
    setTimeout(() => setStep(4), 300);
  };

  const goToStep5 = () => {
    setStep(5);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleCreateDecision = async () => {
    if (!user || !decisionTitle.trim()) return;
    setLoading(true);
    try {
      await supabase.from("decisions").insert({
        title: decisionTitle.trim(),
        category: decisionCategory,
        priority: decisionPriority,
        status: "draft",
        created_by: user.id,
        owner_id: user.id,
      } as any).select("id").single();
      setUsedDemo(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    goToStep5();
  };

  const handleLoadDemo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.functions.invoke("seed-demo-data", {
        body: { userId: user.id, industry: selectedIndustry },
      });
      setUsedDemo(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    goToStep5();
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <img src={decivioLogo} alt="Decivio" className="w-8 h-8 rounded-lg" />
          <span className="text-foreground/80 font-semibold text-sm">Decivio</span>
        </div>
        <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Überspringen
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 mb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">{timeRemaining} verbleibend</span>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <AnimatePresence mode="wait">
          {step === 1 && <WelcomeStep userName={userName} onNext={() => setStep(2)} slideAnim={slideAnim} />}
          {step === 2 && <IndustryStep selectedIndustry={selectedIndustry} onSelect={handleIndustrySelect} slideAnim={slideAnim} />}
          {step === 3 && <TeamSizeStep selectedTeamSize={selectedTeamSize} onSelect={handleTeamSizeSelect} slideAnim={slideAnim} />}
          {step === 4 && (
            <FirstDecisionStep
              decisionTitle={decisionTitle}
              setDecisionTitle={setDecisionTitle}
              decisionCategory={decisionCategory}
              setDecisionCategory={setDecisionCategory}
              decisionPriority={decisionPriority}
              setDecisionPriority={setDecisionPriority}
              loading={loading}
              onCreateDecision={handleCreateDecision}
              onLoadDemo={handleLoadDemo}
              slideAnim={slideAnim}
            />
          )}
          {step === 5 && (
            <CompletionStep
              showConfetti={showConfetti}
              usedDemo={usedDemo}
              decisionTitle={decisionTitle}
              liveCod={liveCod}
              weeklyCod={weeklyCod}
              loading={loading}
              onFinish={handleFinish}
              slideAnim={slideAnim}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Welcome;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import decivioLogo from "@/assets/decivio-logo.png";
import PainPointStep from "@/components/onboarding/PainPointStep";
import SmartDecisionStep from "@/components/onboarding/SmartDecisionStep";

const TOTAL_STEPS = 2;

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
  const [loading, setLoading] = useState(false);
  const [costData, setCostData] = useState<{ people: number; rate: number; days: number; monthlyCost: number } | null>(null);

  const progressPercent = (step / TOTAL_STEPS) * 100;

  const handleSkip = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
    // Seed demo data if org has no decisions yet
    try {
      await supabase.functions.invoke("seed-demo-data", { body: { mode: "quickstart" } });
    } catch {
      // Don't block navigation
    }
    navigate("/dashboard", { replace: true });
  };

  const handlePainPointNext = (data: { people: number; rate: number; days: number; monthlyCost: number }) => {
    setCostData(data);
    setStep(2);
  };

  const handleCreateDecision = async (data: {
    title: string;
    category: string;
    priority: string;
    sla_days: number;
    colleagueEmail?: string;
  }) => {
    if (!user) return;
    setLoading(true);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + data.sla_days);

      // Calculate cost_per_day from pain point data
      const costPerDay = costData
        ? Math.round((costData.rate * 8 * costData.people) / 1)
        : 510;

      await supabase.from("decisions").insert({
        title: data.title,
        category: data.category,
        priority: data.priority,
        status: "draft",
        created_by: user.id,
        owner_id: user.id,
        due_date: dueDate.toISOString().split("T")[0],
        cost_per_day: costPerDay,
      } as any);

      // Store aha-moment data for dashboard overlay
      localStorage.setItem("aha-moment-data", JSON.stringify({
        costPerDay,
        decisionTitle: data.title,
      }));

      // Mark onboarding complete
      await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);

      // If colleague email provided, send invite
      if (data.colleagueEmail) {
        try {
          await supabase.functions.invoke("send-team-invite", {
            body: { email: data.colleagueEmail, invitedBy: user.id },
          });
        } catch {
          // Don't block flow
        }
      }
    } catch (e) {
      console.error(e);
    }
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
            <span className="text-[10px] text-muted-foreground">
              {step === 1 ? "~ 2 Min." : "~ 1 Min."} verbleibend
            </span>
          </div>
          <Progress value={progressPercent} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <PainPointStep onNext={handlePainPointNext} slideAnim={slideAnim} />
          )}
          {step === 2 && (
            <SmartDecisionStep
              onCreateDecision={handleCreateDecision}
              loading={loading}
              slideAnim={slideAnim}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Welcome;

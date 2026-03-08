import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, BarChart3, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2,
  Building2, Target, UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingTour = ({ open, onComplete }: OnboardingTourProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [phase, setPhase] = useState<"context" | "tour">("context");
  const [contextStep, setContextStep] = useState(0);
  const [tourStep, setTourStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const contextQuestions = [
    {
      id: "industry", icon: Building2,
      title: t("onboarding.industryTitle"), description: t("onboarding.industryDesc"),
      options: [
        { label: t("onboarding.industryFinance"), value: "finance" },
        { label: t("onboarding.industryPharma"), value: "pharma" },
        { label: t("onboarding.industryTech"), value: "tech" },
        { label: t("onboarding.industryConsulting"), value: "consulting" },
        { label: t("onboarding.industryOther"), value: "other" },
      ],
    },
    {
      id: "painpoint", icon: Target,
      title: t("onboarding.painpointTitle"), description: t("onboarding.painpointDesc"),
      options: [
        { label: t("onboarding.painLost"), value: "lost_decisions" },
        { label: t("onboarding.painAccountability"), value: "no_accountability" },
        { label: t("onboarding.painAudit"), value: "audit_pain" },
        { label: t("onboarding.painCost"), value: "cost_blind" },
      ],
    },
    {
      id: "teamsize", icon: UsersRound,
      title: t("onboarding.teamsizeTitle"), description: t("onboarding.teamsizeDesc"),
      options: [
        { label: t("onboarding.size1_5"), value: "1-5" },
        { label: t("onboarding.size6_20"), value: "6-20" },
        { label: t("onboarding.size21_50"), value: "21-50" },
        { label: t("onboarding.size50plus"), value: "50+" },
      ],
    },
  ];

  const tourSteps = [
    {
      id: "decision", icon: FileText,
      title: t("onboarding.decisionTitle"), description: t("onboarding.decisionDesc"),
      actionLabel: t("onboarding.decisionAction"), actionPath: "/decisions",
      tips: [t("onboarding.decisionTip1"), t("onboarding.decisionTip2")],
    },
    {
      id: "team", icon: Users,
      title: t("onboarding.teamTitle"), description: t("onboarding.teamDesc"),
      actionLabel: t("onboarding.teamAction"), actionPath: "/teams",
      tips: [t("onboarding.teamTip1"), t("onboarding.teamTip2")],
    },
    {
      id: "dashboard", icon: BarChart3,
      title: t("onboarding.dashboardTitle"), description: t("onboarding.dashboardDesc"),
      actionLabel: t("onboarding.dashboardAction"), actionPath: "/dashboard",
      tips: [t("onboarding.dashboardTip1"), t("onboarding.dashboardTip2")],
    },
  ];

  useEffect(() => {
    if (open) { setPhase("context"); setContextStep(0); setTourStep(0); setAnswers({}); }
  }, [open]);

  if (!open) return null;

  const handleContextAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    try { localStorage.setItem("onboarding_context", JSON.stringify(newAnswers)); } catch {}
    
    // Persist industry to profile
    if (questionId === "industry" && user) {
      supabase.from("profiles").update({ industry: value }).eq("user_id", user.id).then(() => {});
    }
    
    if (contextStep < contextQuestions.length - 1) setContextStep(contextStep + 1);
    else setPhase("tour");
  };

  const totalSteps = contextQuestions.length + tourSteps.length;
  const currentGlobalStep = phase === "context" ? contextStep : contextQuestions.length + tourStep;
  const progress = ((currentGlobalStep + 1) / totalSteps) * 100;

  if (phase === "context") {
    const q = contextQuestions[contextStep];
    const QIcon = q.icon;
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
            <button onClick={onComplete} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label={t("onboarding.skip")}>
              <X className="w-4 h-4" />
            </button>
            <div className="h-1 bg-muted"><motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
            <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><QIcon className="w-6 h-6 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{t("onboarding.contextSetup")} · {contextStep + 1}/{contextQuestions.length}</p>
                    <h2 className="font-display text-xl font-bold leading-tight">{q.title}</h2>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{q.description}</p>
              <AnimatePresence mode="wait">
                <motion.div key={`opts-${q.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
                  {q.options.map((opt) => (
                    <button key={opt.value} onClick={() => handleContextAnswer(q.id, opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${answers[q.id] === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/40 hover:bg-primary/5 text-foreground"}`}>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const current = tourSteps[tourStep];
  const Icon = current.icon;
  const isLast = tourStep === tourSteps.length - 1;
  const handleAction = () => { onComplete(); if (current.actionPath) navigate(current.actionPath); };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
          <button onClick={onComplete} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label={t("onboarding.tourEnd")}>
            <X className="w-4 h-4" />
          </button>
          <div className="h-1 bg-muted"><motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
          <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div key={tourStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><Icon className="w-6 h-6 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{t("onboarding.stepOf", { current: tourStep + 1, total: tourSteps.length })}</p>
                  <h2 className="font-display text-xl font-bold leading-tight">{current.title}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="px-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div key={`c-${tourStep}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, delay: 0.05 }}>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{current.description}</p>
                {current.tips && (
                  <ul className="space-y-1.5 mb-3">
                    {current.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /><span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button size="sm" variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10" onClick={handleAction}>
                  {current.actionLabel}<ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="px-6 pb-5 pt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <button key={i} onClick={() => setTourStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === tourStep ? "w-6 bg-primary" : i < tourStep ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"}`}
                  aria-label={t("onboarding.stepOf", { current: i + 1, total: tourSteps.length })} />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {tourStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setTourStep(tourStep - 1)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> {t("onboarding.back")}
                </Button>
              )}
              <Button size="sm" onClick={() => isLast ? handleAction() : setTourStep(tourStep + 1)} className="rounded-xl">
                {isLast ? t("onboarding.letsGo") : t("onboarding.next")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;

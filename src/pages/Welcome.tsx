import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, Loader2, Sparkles, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCost } from "@/lib/formatters";
import decivioLogo from "@/assets/decivio-logo.png";

const TOTAL_STEPS = 5;

const INDUSTRIES = [
  { id: "maschinenbau", icon: "⚙️", label: "Maschinenbau" },
  { id: "automotive", icon: "🏭", label: "Automotive" },
  { id: "pharma", icon: "💊", label: "Pharma" },
  { id: "it", icon: "💻", label: "IT / Software" },
  { id: "bau", icon: "🏗️", label: "Bau / Industrie" },
  { id: "allgemein", icon: "📦", label: "Andere" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Nur ich", desc: "Einzelnutzer" },
  { id: "small", label: "2–5", desc: "Kleines Team" },
  { id: "medium", label: "6–20", desc: "Mittelgroßes Team" },
  { id: "large", label: "20+", desc: "Große Organisation" },
];

const CATEGORY_BY_INDUSTRY: Record<string, string> = {
  maschinenbau: "operational",
  automotive: "strategic",
  pharma: "technical",
  it: "technical",
  bau: "operational",
  allgemein: "operational",
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
  const [createdDecisionCod, setCreatedDecisionCod] = useState(0);
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
    const perSecond = baseDailyCod / 86400;
    return Math.round((perSecond * codTick) * 100) / 100;
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
      // Save industry & team_size to profile
      await supabase.from("profiles").update({ industry: selectedIndustry } as any).eq("user_id", user.id);
    }
    setTimeout(() => setStep(4), 300);
  };

  const handleCreateDecision = async () => {
    if (!user || !decisionTitle.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase.from("decisions").insert({
        title: decisionTitle.trim(),
        category: decisionCategory,
        priority: decisionPriority,
        status: "draft",
        created_by: user.id,
        owner_id: user.id,
      } as any).select("id").single();

      setCreatedDecisionCod(weeklyCod);
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

  const goToStep5 = () => {
    setStep(5);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("user_id", user.id);
    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  const slideAnim = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3 },
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
          {/* ═══ STEP 1: Welcome ═══ */}
          {step === 1 && (
            <motion.div key="s1" {...slideAnim} className="w-full max-w-md text-center">
              <img src={decivioLogo} alt="Decivio" className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-lg" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Willkommen, {userName}! 👋
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                Lass uns Decivio in 3 Minuten für dich einrichten.
              </p>
              <Button
                size="lg"
                onClick={() => setStep(2)}
                className="w-full max-w-xs mx-auto gap-2 h-12 text-sm font-semibold"
              >
                Los geht's <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 2: Industry ═══ */}
          {step === 2 && (
            <motion.div key="s2" {...slideAnim} className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">In welcher Branche bist du tätig?</h1>
                <p className="text-muted-foreground text-sm mt-2">Wir passen Vorlagen und Einstellungen an.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INDUSTRIES.map((ind, i) => {
                  const selected = selectedIndustry === ind.id;
                  return (
                    <motion.button
                      key={ind.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleIndustrySelect(ind.id)}
                      className={`relative p-5 rounded-xl border-2 transition-all text-center ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      {selected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                      <span className="text-3xl block mb-2">{ind.icon}</span>
                      <span className="text-xs font-medium text-foreground">{ind.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: Team Size ═══ */}
          {step === 3 && (
            <motion.div key="s3" {...slideAnim} className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  Wie viele Personen treffen bei euch Entscheidungen?
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TEAM_SIZES.map((ts, i) => {
                  const selected = selectedTeamSize === ts.id;
                  return (
                    <motion.button
                      key={ts.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleTeamSizeSelect(ts.id)}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <p className="text-xl font-bold text-foreground mb-1">{ts.label}</p>
                      <p className="text-xs text-muted-foreground">{ts.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 4: First Decision ═══ */}
          {step === 4 && (
            <motion.div key="s4" {...slideAnim} className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  Welche Entscheidung liegt bei euch gerade offen?
                </h1>
                <p className="text-muted-foreground text-sm mt-2">Erstelle deine erste Entscheidung oder lade Beispieldaten.</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 space-y-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titel *</label>
                  <Input
                    value={decisionTitle}
                    onChange={(e) => setDecisionTitle(e.target.value)}
                    placeholder="z.B. ERP-System Migration entscheiden"
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kategorie</label>
                    <select
                      value={decisionCategory}
                      onChange={(e) => setDecisionCategory(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="strategic">Strategisch</option>
                      <option value="operational">Operativ</option>
                      <option value="technical">Technisch</option>
                      <option value="budget">Budget</option>
                      <option value="hr">Personal</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priorität</label>
                    <select
                      value={decisionPriority}
                      onChange={(e) => setDecisionPriority(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="critical">Kritisch</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleCreateDecision}
                  disabled={!decisionTitle.trim() || loading}
                  className="w-full gap-2 h-11"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Entscheidung anlegen <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="text-xs text-primary hover:underline"
                >
                  {loading ? "Wird geladen..." : "Beispieldaten laden →"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 5: Done ═══ */}
          {step === 5 && (
            <motion.div key="s5" {...slideAnim} className="w-full max-w-md text-center">
              {/* Confetti */}
              {showConfetti && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
                >
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: 0,
                        y: 0,
                        scale: 0,
                        rotate: 0,
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.5) * 600,
                        scale: [0, 1, 0.5],
                        rotate: Math.random() * 720,
                      }}
                      transition={{
                        duration: 1.5 + Math.random(),
                        ease: "easeOut",
                      }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: [
                          "hsl(var(--primary))",
                          "#F59E0B",
                          "#10B981",
                          "#EF4444",
                          "#8B5CF6",
                          "#06B6D4",
                        ][i % 6],
                      }}
                    />
                  ))}
                </motion.div>
              )}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Dein Workspace ist bereit! 🎉
              </h1>

              {!usedDemo && decisionTitle && (
                <div className="mt-6 rounded-xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-1">Cost-of-Delay deiner Entscheidung</p>
                  <motion.p
                    className="text-3xl font-bold text-destructive tabular-nums font-mono"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    {formatCost(liveCod)}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Deine erste Entscheidung kostet bereits <span className="font-semibold text-foreground">{formatCost(weeklyCod)}/Woche</span>.
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button
                  size="lg"
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full max-w-xs mx-auto gap-2 h-12 text-sm font-semibold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Zum Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Welcome;

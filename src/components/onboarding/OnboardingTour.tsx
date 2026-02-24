import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, BarChart3, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2,
  Building2, Target, UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

/* ── Kontext-Setup (3 Questions per Endstand-Spec) ── */
const contextQuestions = [
  {
    id: "industry",
    icon: Building2,
    title: "In welcher Branche seid ihr?",
    description: "Wir personalisieren Templates, Benchmarks und Beispiele für euch.",
    options: [
      { label: "Finanzdienstleister", value: "finance" },
      { label: "Pharma / Healthcare", value: "pharma" },
      { label: "Technologie / SaaS", value: "tech" },
      { label: "Beratung / Dienstleistung", value: "consulting" },
      { label: "Andere", value: "other" },
    ],
  },
  {
    id: "painpoint",
    icon: Target,
    title: "Was ist euer größter Schmerz?",
    description: "Das hilft uns, die richtigen Funktionen sofort zu zeigen.",
    options: [
      { label: "Entscheidungen verschwinden in E-Mails", value: "lost_decisions" },
      { label: "Niemand weiß wer zuständig ist", value: "no_accountability" },
      { label: "Audits kosten Wochen manueller Arbeit", value: "audit_pain" },
      { label: "Keine Übersicht über Kosten offener Entscheidungen", value: "cost_blind" },
    ],
  },
  {
    id: "teamsize",
    icon: UsersRound,
    title: "Wie groß ist euer Team?",
    description: "So können wir den passenden Plan und Features empfehlen.",
    options: [
      { label: "1–5 Personen", value: "1-5" },
      { label: "6–20 Personen", value: "6-20" },
      { label: "21–50 Personen", value: "21-50" },
      { label: "50+ Personen", value: "50+" },
    ],
  },
];

/* ── Onboarding Tour Steps ── */
const tourSteps = [
  {
    id: "decision",
    icon: FileText,
    title: "Erste Entscheidung",
    description: "Erstelle eine strukturierte Entscheidung mit Template. Priorität, Kategorie und Optionen werden automatisch vorgeschlagen.",
    actionLabel: "Entscheidung erstellen",
    actionPath: "/decisions",
    tips: ["Template für Struktur wählen", "KI gibt sofort Cost-of-Delay Einschätzung"],
  },
  {
    id: "team",
    icon: Users,
    title: "Team einladen",
    description: "Lade 2–3 Kollegen ein. Mehr Personen = bessere Entscheidungen.",
    actionLabel: "Team erstellen",
    actionPath: "/teams",
    tips: ["Rollen definieren: Lead, Member, Viewer", "Einladungen per E-Mail versenden"],
  },
  {
    id: "dashboard",
    icon: BarChart3,
    title: "Dashboard erkunden",
    description: "Dein Cockpit zeigt Decision Health, Risk Exposure, Cost of Delay und SLA Compliance auf einen Blick.",
    actionLabel: "Zum Dashboard",
    actionPath: "/dashboard",
    tips: ["Top Action Now zeigt die dringendste Aktion", "Executive-Modus für C-Level-Sicht"],
  },
];

const OnboardingTour = ({ open, onComplete }: OnboardingTourProps) => {
  const [phase, setPhase] = useState<"context" | "tour">("context");
  const [contextStep, setContextStep] = useState(0);
  const [tourStep, setTourStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setPhase("context");
      setContextStep(0);
      setTourStep(0);
      setAnswers({});
    }
  }, [open]);

  if (!open) return null;

  const handleContextAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Save to localStorage for personalization
    try { localStorage.setItem("onboarding_context", JSON.stringify(newAnswers)); } catch {}

    if (contextStep < contextQuestions.length - 1) {
      setContextStep(contextStep + 1);
    } else {
      setPhase("tour");
    }
  };

  const totalSteps = contextQuestions.length + tourSteps.length;
  const currentGlobalStep = phase === "context" ? contextStep : contextQuestions.length + tourStep;
  const progress = ((currentGlobalStep + 1) / totalSteps) * 100;

  /* ── Context Phase ── */
  if (phase === "context") {
    const q = contextQuestions[contextStep];
    const QIcon = q.icon;

    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <button onClick={onComplete}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Überspringen">
              <X className="w-4 h-4" />
            </button>

            <div className="h-1 bg-muted">
              <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>

            <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <QIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                      Kontext-Setup · {contextStep + 1}/{contextQuestions.length}
                    </p>
                    <h2 className="font-display text-xl font-bold leading-tight">{q.title}</h2>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-6 pb-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{q.description}</p>
              <AnimatePresence mode="wait">
                <motion.div key={`opts-${q.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleContextAnswer(q.id, opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                        answers[q.id] === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                      }`}
                    >
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

  /* ── Tour Phase ── */
  const current = tourSteps[tourStep];
  const Icon = current.icon;
  const isLast = tourStep === tourSteps.length - 1;

  const handleAction = () => {
    onComplete();
    if (current.actionPath) navigate(current.actionPath);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <button onClick={onComplete}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tour beenden">
            <X className="w-4 h-4" />
          </button>

          <div className="h-1 bg-muted">
            <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div key={tourStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                    Schritt {tourStep + 1} von {tourSteps.length}
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight">{current.title}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div key={`c-${tourStep}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: 0.05 }}>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{current.description}</p>
                {current.tips && (
                  <ul className="space-y-1.5 mb-3">
                    {current.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button size="sm" variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/10" onClick={handleAction}>
                  {current.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-6 pb-5 pt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <button key={i} onClick={() => setTourStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === tourStep ? "w-6 bg-primary" : i < tourStep ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                  }`} aria-label={`Schritt ${i + 1}`} />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {tourStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setTourStep(tourStep - 1)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
                </Button>
              )}
              <Button size="sm" onClick={() => isLast ? handleAction() : setTourStep(tourStep + 1)} className="rounded-xl">
                {isLast ? "Los geht's!" : "Weiter"}
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

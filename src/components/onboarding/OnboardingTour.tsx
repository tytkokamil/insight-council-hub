import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Users,
  GitBranch,
  Zap,
  ArrowRight,
  ArrowLeft,
  Target,
  CheckCircle2,
  X,
  Sparkles,
  ClipboardCheck,
  UserPlus,
  PlusCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

type Phase = "welcome" | "overview" | "action";

interface OnboardingStep {
  id: string;
  phase: Phase;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  tips?: string[];
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    phase: "welcome",
    icon: Sparkles,
    title: "Willkommen bei Decivio!",
    subtitle: "Dein Entscheidungs-Cockpit",
    description:
      "In wenigen Schritten zeigen wir dir, wie du dein Team aufstellst, deine erste Entscheidung erstellst und den Review-Prozess nutzt.",
  },
  {
    id: "dashboard",
    phase: "overview",
    icon: BarChart3,
    title: "Dashboard",
    subtitle: "Dein Überblick",
    description:
      "Das Dashboard zeigt dir alle wichtigen KPIs: offene Entscheidungen, Risiko-Scores, Velocity und Kosten — alles auf einen Blick.",
    tips: ["Momentum Score zeigt die Dynamik deines Teams", "Health Score warnt vor Problemen"],
  },
  {
    id: "team",
    phase: "action",
    icon: Users,
    title: "Schritt 1: Team erstellen",
    subtitle: "Gemeinsam entscheiden",
    description:
      "Erstelle dein erstes Team und lade Kollegen ein. Teams ermöglichen gemeinsame Entscheidungen, Reviewer-Workflows und einen integrierten Chat.",
    actionLabel: "Team erstellen →",
    actionPath: "/teams",
    tips: [
      "Definiere Rollen: Lead, Member, Viewer",
      "Team-Defaults setzen: Kategorie, Priorität, SLA",
      "Einladungen per E-Mail versenden",
    ],
  },
  {
    id: "decision",
    phase: "action",
    icon: FileText,
    title: "Schritt 2: Erste Entscheidung",
    subtitle: "Strukturiert entscheiden",
    description:
      "Erstelle deine erste Entscheidung mit einem Template. Templates geben Struktur vor: Pflichtfelder, Risikoanalyse und Approval-Steps — je nach Kategorie und Priorität.",
    actionLabel: "Entscheidung erstellen →",
    actionPath: "/decisions",
    tips: [
      "Wähle ein passendes Template (z.B. Produktentscheidung)",
      "Bei High Priority → Risikoanalyse wird Pflicht",
      "Optionen definieren und bewerten",
    ],
  },
  {
    id: "review",
    phase: "action",
    icon: ClipboardCheck,
    title: "Schritt 3: Review-Prozess",
    subtitle: "Qualität sichern",
    description:
      "Füge Reviewer hinzu, die deine Entscheidung prüfen. Je nach Template sind bestimmte Approval-Stufen vordefiniert. Reviewer können Approve, Oppose oder Feedback geben.",
    tips: [
      "Reviewer werden automatisch benachrichtigt",
      "Delegation möglich bei Abwesenheit",
      "Eskalation bei Verzögerung durch SLA",
    ],
  },
  {
    id: "ai",
    phase: "overview",
    icon: Zap,
    title: "KI-Analyse",
    subtitle: "Intelligente Einblicke",
    description:
      "Jede Entscheidung wird automatisch analysiert: Risiko-Score, Erfolgswahrscheinlichkeit und KI-gestützte Empfehlungen helfen dir bei der Bewertung.",
    tips: ["CoPilot gibt kontextuelle Hinweise", "What-If-Simulator für Szenarien"],
  },
  {
    id: "graph",
    phase: "overview",
    icon: GitBranch,
    title: "Decision Graph",
    subtitle: "Abhängigkeiten erkennen",
    description:
      "Visualisiere Abhängigkeiten zwischen Entscheidungen und identifiziere Bottlenecks, bevor sie zum Problem werden.",
  },
  {
    id: "done",
    phase: "welcome",
    icon: CheckCircle2,
    title: "Bereit loszulegen!",
    subtitle: "Viel Erfolg",
    description:
      "Du kennst jetzt die wichtigsten Bereiche. Starte mit deinem Team und deiner ersten Entscheidung — wir begleiten dich dabei.",
    actionLabel: "Los geht's!",
    actionPath: "/teams",
  },
];

const phaseColors: Record<Phase, string> = {
  welcome: "from-primary/20 to-primary/5",
  overview: "from-accent/30 to-accent/5",
  action: "from-primary/15 to-primary/5",
};

const OnboardingTour = ({ open, onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const handleAction = () => {
    if (isLast && current.actionPath) {
      onComplete();
      navigate(current.actionPath);
    } else if (current.actionPath) {
      onComplete();
      navigate(current.actionPath);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tour beenden"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Phase gradient header */}
          <div className={`bg-gradient-to-b ${phaseColors[current.phase]} px-6 pt-6 pb-4`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-4"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <div className="min-w-0">
                  {/* Phase badge */}
                  {current.phase === "action" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      <Target className="w-3 h-3" />
                      Aktion
                    </span>
                  )}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    {current.subtitle}
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight">{current.title}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="px-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${step}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {current.description}
                </p>

                {/* Tips */}
                {current.tips && current.tips.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {current.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action CTA */}
                {current.actionLabel && current.actionPath && !isLast && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl mb-2 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={handleAction}
                  >
                    {current.id === "team" && <UserPlus className="w-4 h-4 mr-1.5" />}
                    {current.id === "decision" && <PlusCircle className="w-4 h-4 mr-1.5" />}
                    {current.actionLabel}
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 pt-2 flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-6 bg-primary"
                      : i < step
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                  }`}
                  aria-label={`Schritt ${i + 1}: ${s.title}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-muted-foreground/50 font-mono mr-1">
                {step + 1}/{steps.length}
              </span>
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => (isLast ? handleAction() : setStep(step + 1))}
                className="rounded-xl"
              >
                {isLast ? (
                  <>
                    Los geht's!
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Weiter
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;

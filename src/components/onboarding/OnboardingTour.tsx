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
  Settings,
  X,
} from "lucide-react";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: Target,
    title: "Willkommen bei DecisionOS!",
    subtitle: "Dein Entscheidungs-Cockpit",
    description:
      "DecisionOS hilft dir und deinem Team, bessere Entscheidungen schneller zu treffen. Lass uns die wichtigsten Bereiche kurz durchgehen.",
  },
  {
    icon: BarChart3,
    title: "Dashboard",
    subtitle: "Dein Überblick",
    description:
      "Das Dashboard zeigt dir alle wichtigen KPIs: offene Entscheidungen, Risiko-Scores, Velocity und Kosten — alles auf einen Blick.",
  },
  {
    icon: FileText,
    title: "Entscheidungen",
    subtitle: "Erstellen & Verwalten",
    description:
      "Erstelle Entscheidungen, weise sie Team-Mitgliedern zu und verfolge den Fortschritt von Entwurf bis zur Umsetzung.",
  },
  {
    icon: Zap,
    title: "KI-Analyse",
    subtitle: "Intelligente Einblicke",
    description:
      "Jede Entscheidung wird automatisch analysiert: Risiko-Score, Erfolgswahrscheinlichkeit und KI-gestützte Empfehlungen helfen dir bei der Bewertung.",
  },
  {
    icon: GitBranch,
    title: "Decision Graph",
    subtitle: "Abhängigkeiten erkennen",
    description:
      "Visualisiere Abhängigkeiten zwischen Entscheidungen und identifiziere Bottlenecks, bevor sie zum Problem werden.",
  },
  {
    icon: Users,
    title: "Teams",
    subtitle: "Gemeinsam entscheiden",
    description:
      "Lade dein Team ein, definiere Reviewer-Workflows und nutze den Team-Chat für schnelle Abstimmungen.",
  },
  {
    icon: Settings,
    title: "Bereit loszulegen!",
    subtitle: "Viel Erfolg",
    description:
      "Du kannst diese Tour jederzeit in den Einstellungen erneut starten. Erstelle jetzt deine erste Entscheidung!",
  },
];

const OnboardingTour = ({ open, onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

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
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* Text */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {current.subtitle}
                </p>
                <h2 className="font-display text-xl font-bold mb-3">{current.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
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
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => (isLast ? onComplete() : setStep(step + 1))}
                className="rounded-xl"
              >
                {isLast ? (
                  "Los geht's!"
                ) : (
                  <>
                    Weiter
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <div className="text-center pb-4">
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {step + 1} / {steps.length}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;

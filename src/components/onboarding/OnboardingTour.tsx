import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, BarChart3, ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: "team",
    icon: Users,
    title: "Team aufstellen",
    description: "Erstelle dein erstes Team und lade Kollegen ein. Teams sind die Basis für kollaborative Governance.",
    actionLabel: "Team erstellen",
    actionPath: "/teams",
    tips: ["Rollen definieren: Lead, Member, Viewer", "Einladungen per E-Mail versenden"],
  },
  {
    id: "decision",
    icon: FileText,
    title: "Erste Entscheidung",
    description: "Erstelle eine strukturierte Entscheidung mit Template. Priorität, Kategorie und Optionen werden automatisch vorgeschlagen.",
    actionLabel: "Entscheidung erstellen",
    actionPath: "/decisions",
    tips: ["Template für Struktur wählen", "Optionen definieren und bewerten"],
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
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => { if (open) setStep(0); }, [open]);

  if (!open) return null;

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

          {/* Progress */}
          <div className="h-1 bg-muted">
            <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          {/* Header */}
          <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                    Schritt {step + 1} von {steps.length}
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight">{current.title}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="px-6 pb-2">
            <AnimatePresence mode="wait">
              <motion.div key={`c-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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

          {/* Footer */}
          <div className="px-6 pb-5 pt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                  }`} aria-label={`Schritt ${i + 1}`} />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
                </Button>
              )}
              <Button size="sm" onClick={() => isLast ? handleAction() : setStep(step + 1)} className="rounded-xl">
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

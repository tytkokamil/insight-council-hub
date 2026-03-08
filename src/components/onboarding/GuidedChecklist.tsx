import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Circle, ArrowRight, X, Rocket,
  FileText, Users, Clock, Shield, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface GuidedChecklistProps {
  hasDecision: boolean;
  hasTeamMember: boolean;
  hasSla: boolean;
  hasCompliance: boolean;
  hasBrief: boolean;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

const GuidedChecklist = ({
  hasDecision, hasTeamMember, hasSla, hasCompliance, hasBrief,
}: GuidedChecklistProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("guided-checklist-dismissed") === "true"
  );
  const [showConfetti, setShowConfetti] = useState(false);

  const steps = useMemo(() => [
    { id: "decision", icon: FileText, label: "Erste Entscheidung erstellt", done: hasDecision, path: "/decisions?create=true" },
    { id: "team", icon: Users, label: "Kollegen einladen", done: hasTeamMember, path: "/teams" },
    { id: "sla", icon: Clock, label: "SLA konfigurieren", done: hasSla, path: "/settings" },
    { id: "compliance", icon: Shield, label: "Compliance Framework wählen", done: hasCompliance, path: "/settings" },
    { id: "brief", icon: Brain, label: "KI Daily Brief aktivieren", done: hasBrief, path: "/settings" },
  ], [hasDecision, hasTeamMember, hasSla, hasCompliance, hasBrief]);

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;
  const allDone = completedCount === steps.length;

  // Check if within first 7 days
  const [withinWindow, setWithinWindow] = useState(true);
  useEffect(() => {
    const firstSeen = localStorage.getItem("guided-checklist-first-seen");
    if (!firstSeen) {
      localStorage.setItem("guided-checklist-first-seen", new Date().toISOString());
    } else {
      const diff = Date.now() - new Date(firstSeen).getTime();
      if (diff > 7 * 24 * 60 * 60 * 1000) setWithinWindow(false);
    }
  }, []);

  useEffect(() => {
    if (allDone && !dismissed) {
      setShowConfetti(true);
      setOpen(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone, dismissed]);

  if (dismissed || !withinWindow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("guided-checklist-dismissed", "true");
  };

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[110]">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: "50vw", y: "50vh", scale: 0, rotate: 0 }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0.5],
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: CONFETTI_COLORS[i % 4] }}
            />
          ))}
        </div>
      )}

      {/* Floating Badge */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow text-sm font-medium"
      >
        <Rocket className="w-4 h-4" />
        Setup {completedCount}/{steps.length} ✓
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-[95] w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  {allDone ? "🎉 Sie sind bereit!" : "Erste Schritte"}
                </h3>
                <button
                  onClick={handleDismiss}
                  className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <Progress value={progress} className="h-1.5" />
              {allDone && (
                <p className="text-xs text-muted-foreground mt-2">
                  Decivio arbeitet jetzt für Sie.
                </p>
              )}
            </div>

            <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (!step.done) {
                        setOpen(false);
                        navigate(step.path);
                      }
                    }}
                    disabled={step.done}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      step.done
                        ? "opacity-60"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${step.done ? "line-through text-muted-foreground" : "font-medium"}`}>
                      {step.label}
                    </span>
                    {!step.done && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GuidedChecklist;

import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Rocket, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLaunchProgress, LAUNCH_PHASES } from "@/hooks/useLaunchProgress";

/**
 * Persistent banner at top of Dashboard when launch progress < 100%.
 * Clicking navigates to /launch-checklist.
 */
const GoLiveProgressWidget = memo(() => {
  const { completedCount, percent, isComplete, isLoading, currentPhaseIndex } = useLaunchProgress();

  // Don't render if complete or loading
  if (isLoading || isComplete) return null;

  // Don't show if user explicitly dismissed
  const dismissed = localStorage.getItem("golive-widget-dismissed") === "true";
  if (dismissed) return null;

  const currentPhase = currentPhaseIndex < LAUNCH_PHASES.length ? LAUNCH_PHASES[currentPhaseIndex] : null;
  const totalItems = LAUNCH_PHASES.flatMap(p => p.items).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Link
        to="/launch-checklist"
        className="group block p-4 rounded-xl border border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground">
                Go-Live-Fortschritt: {completedCount}/{totalItems} Schritte ✓
              </p>
              {currentPhase && (
                <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                  {currentPhase.emoji} {currentPhase.title}
                </span>
              )}
            </div>
            <Progress value={percent} className="h-1.5 max-w-xs" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            Weiter <ArrowRight className="w-3 h-3" />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              localStorage.setItem("golive-widget-dismissed", "true");
              // Force re-render by dispatching storage event
              window.dispatchEvent(new Event("storage"));
              // Hide via DOM manipulation for immediate feedback
              (e.currentTarget.closest("[class*='mb-6']") as HTMLElement)?.remove();
            }}
            className="text-muted-foreground/40 hover:text-muted-foreground text-xs shrink-0 p-1"
            title="Ausblenden"
          >
            ✕
          </button>
        </div>
      </Link>
    </motion.div>
  );
});

GoLiveProgressWidget.displayName = "GoLiveProgressWidget";

export default GoLiveProgressWidget;

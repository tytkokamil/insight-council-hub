import { useState } from "react";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useNavigate } from "react-router-dom";
import { Lightbulb, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Trigger 1 — Soft Warning at 80% decision limit.
 * Dismissible info bar shown below the TopBar.
 */
const FreemiumWarningBar = () => {
  const { isFree, decisionCount, maxDecisions } = useFreemiumLimits();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!isFree || dismissed || !maxDecisions) return null;

  const threshold = Math.floor(maxDecisions * 0.8);
  if (decisionCount < threshold || decisionCount >= maxDecisions) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="relative flex items-center gap-3 px-4 py-2.5 bg-warning/10 border-b border-warning/20 text-sm"
      >
        <Lightbulb className="w-4 h-4 text-warning shrink-0" />
        <span className="text-foreground/80">
          💡 {decisionCount} von {maxDecisions} Entscheidungen verwendet.{" "}
          <button
            onClick={() => navigate("/upgrade")}
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            Upgrade für unbegrenzte Entscheidungen
            <ArrowRight className="w-3 h-3" />
          </button>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default FreemiumWarningBar;

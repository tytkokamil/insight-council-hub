import { memo } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface TrialBannerProps {
  daysLeft: number;
}

const TrialBanner = memo(({ daysLeft }: TrialBannerProps) => {
  if (daysLeft > 5) return null;

  const urgency = daysLeft <= 1 ? "critical" : daysLeft <= 2 ? "high" : "medium";

  const styles = {
    critical: {
      bg: "bg-destructive",
      text: "text-white",
      button: "bg-white text-destructive hover:bg-white/90",
      label: daysLeft <= 0 ? "Testphase abgelaufen" : "Testphase endet heute!",
    },
    high: {
      bg: "bg-orange-500",
      text: "text-white",
      button: "bg-white text-orange-600 hover:bg-white/90",
      label: `Testphase endet in ${daysLeft} Tagen`,
    },
    medium: {
      bg: "bg-amber-500",
      text: "text-white",
      button: "bg-white text-amber-700 hover:bg-white/90",
      label: `Testphase endet in ${daysLeft} Tagen`,
    },
  };

  const s = styles[urgency];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className={`${s.bg} ${s.text} px-4 py-2 flex items-center justify-center gap-3 text-[13px] font-medium`}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{s.label}</span>
      <Link
        to="/upgrade"
        className={`${s.button} inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold transition-colors`}
      >
        Jetzt upgraden
        <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  );
});

TrialBanner.displayName = "TrialBanner";

export default TrialBanner;

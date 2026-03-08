import { memo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface PastDueBannerProps {
  daysUntilSuspension: number;
}

const PastDueBanner = memo(({ daysUntilSuspension }: PastDueBannerProps) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="bg-destructive text-white px-4 py-2.5 flex items-center justify-center gap-3 text-[13px] font-medium"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        {daysUntilSuspension > 0
          ? `Zahlung ausstehend — Zugang wird in ${daysUntilSuspension} ${daysUntilSuspension === 1 ? "Tag" : "Tagen"} eingeschränkt`
          : "Zahlung ausstehend — Zugang wurde eingeschränkt"}
      </span>
      <Link
        to="/settings?tab=billing"
        className="bg-white text-destructive inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-semibold transition-colors hover:bg-white/90"
      >
        <CreditCard className="w-3 h-3" />
        Zahlungsmethode aktualisieren
      </Link>
    </motion.div>
  );
});

PastDueBanner.displayName = "PastDueBanner";

export default PastDueBanner;

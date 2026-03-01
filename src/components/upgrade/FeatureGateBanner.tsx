import { Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateBannerProps {
  planName?: string;
  price?: string;
}

/**
 * Trigger 3 — Inline banner for locked features.
 * Non-modal, non-blocking. Feature stays visible but disabled.
 */
const FeatureGateBanner = ({
  planName = "Professional",
  price = "149€/mo",
}: FeatureGateBannerProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 text-sm mb-4">
      <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">
        🔒 Nur in {planName} ({price})
      </span>
      <button
        onClick={() => navigate("/upgrade")}
        className="ml-auto text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 shrink-0"
      >
        14 Tage kostenlos testen
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};

export default FeatureGateBanner;

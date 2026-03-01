import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface WelcomeBannerProps {
  firstName: string;
}

const WelcomeBanner = ({ firstName }: WelcomeBannerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("welcome-banner-dismissed") === "true"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("welcome-banner-dismissed", "true");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative border border-primary/30 bg-primary/[0.04] rounded-lg p-5"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Schließen"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold">
            {t("dashboard.welcomeTitle", {
              name: firstName,
              defaultValue: `Willkommen bei Decivio, ${firstName} 👋`,
            })}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dashboard.welcomeSubtitle", {
              defaultValue:
                "Leg deine erste Entscheidung an — alles andere erklärt sich von selbst.",
            })}
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => navigate("/decisions?create=true")}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("dashboard.welcomeCTA", {
            defaultValue: "Erste Entscheidung anlegen",
          })}
        </Button>
      </div>
    </motion.div>
  );
};

export default WelcomeBanner;

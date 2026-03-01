import { motion } from "framer-motion";
import { Timer, Info, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CodPreviewWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Timer className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Cost of Delay</h3>
          <p className="text-xs text-muted-foreground">
            {t("cod.previewSubtitle", { defaultValue: "Live-Verzögerungskosten" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-bold font-display text-muted-foreground/40 tabular-nums">
          €0
        </span>
        <Info className="w-4 h-4 text-muted-foreground/40" />
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {t("cod.previewDescription", {
          defaultValue:
            "Dieser Zähler zeigt in Echtzeit was offene Entscheidungen kosten — sobald du Cost-of-Delay konfiguriert hast.",
        })}
      </p>

      <button
        onClick={() => navigate("/teams")}
        className="text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
      >
        {t("cod.configureCTA", { defaultValue: "Jetzt konfigurieren" })}
        <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export default CodPreviewWidget;

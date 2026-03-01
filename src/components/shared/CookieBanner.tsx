import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const COOKIE_KEY = "decivio_cookie_consent";

const CookieBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (value: "all" | "essential") => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] bg-card border border-border/60 rounded-xl shadow-xl p-5"
        >
          <button onClick={() => accept("essential")} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label={t("shared.cookieClose")}>
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">{t("shared.cookieTitle")}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("shared.cookieDesc")}{" "}
                <Link to="/privacy" className="text-primary hover:underline">{t("shared.cookiePrivacy")}</Link>
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => accept("all")} className="text-xs">
                  {t("shared.cookieAcceptAll")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => accept("essential")} className="text-xs">
                  {t("shared.cookieEssentialOnly")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

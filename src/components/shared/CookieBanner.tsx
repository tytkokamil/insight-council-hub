import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { hasConsented, acceptAll, acceptEssentialOnly } from "@/lib/cookieConsent";
import CookieSettingsModal from "./CookieSettingsModal";

/** Public-only routes where the banner may appear */
const PUBLIC_PREFIXES = ["/", "/auth", "/pricing", "/privacy", "/terms", "/imprint", "/dpa", "/ai-data-policy", "/sub-processors", "/demo", "/help", "/blog"];

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

const CookieBanner = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Don't show for authenticated users or if already consented
    if (user || hasConsented()) return;
    // Only show on public routes
    if (!isPublicRoute(location.pathname)) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [user, location.pathname]);

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    acceptEssentialOnly();
    setVisible(false);
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] bg-card border border-border/60 rounded-xl shadow-xl p-5"
          >
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-sm text-foreground font-medium">{t("shared.cookieTitle")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("shared.cookieBannerText")}{" "}
                  <Link to="/privacy" className="text-primary hover:underline">{t("shared.cookiePrivacy")}</Link>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleAcceptAll} className="text-xs">
                    {t("shared.cookieAcceptAll")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleEssentialOnly} className="text-xs">
                    {t("shared.cookieEssentialOnly")}
                  </Button>
                  <button
                    onClick={() => { setSettingsOpen(true); setVisible(false); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    {t("shared.cookieSettings")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookieSettingsModal
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open && !hasConsented()) {
            // Re-show banner if user closed settings without saving
            setVisible(true);
          }
        }}
      />
    </>
  );
};

export default CookieBanner;

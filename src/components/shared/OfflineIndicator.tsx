import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const OfflineIndicator = () => {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          role="alert"
          aria-live="assertive"
          className="fixed top-0 left-0 right-0 z-[200] bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-md"
        >
          <WifiOff className="w-4 h-4" aria-hidden="true" />
          {t("shared.offlineMsg")}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Micro-interaction: Brief green checkmark flash after save actions.
 * Usage: const { showSuccess, SuccessIndicator } = useSaveSuccess();
 *        await save(); showSuccess();
 */
export const useSaveSuccess = () => {
  const [visible, setVisible] = useState(false);

  const showSuccess = useCallback(() => {
    setVisible(true);
    setTimeout(() => setVisible(false), 1500);
  }, []);

  const SuccessIndicator = () => (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-flex items-center gap-1 text-success text-xs font-medium"
        >
          <Check className="w-3.5 h-3.5" />
          Gespeichert
        </motion.span>
      )}
    </AnimatePresence>
  );

  return { showSuccess, SuccessIndicator, isVisible: visible };
};

export default useSaveSuccess;

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCost } from "@/lib/formatters";

interface Props {
  costPerDay: number;
  decisionTitle: string;
  onDismiss: () => void;
}

const AhaMomentOverlay = ({ costPerDay, decisionTitle, onDismiss }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const liveCost = useMemo(() => {
    return (costPerDay / 86400) * elapsed;
  }, [elapsed, costPerDay]);

  const handleDismiss = () => {
    localStorage.setItem("aha-moment-seen", "true");
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8 text-center"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-destructive" />
          </div>

          <p className="text-xs text-muted-foreground mb-1">
            Kosten seit Sie diese Seite geöffnet haben
          </p>

          <motion.p
            className="text-5xl font-bold text-destructive tabular-nums font-mono my-4"
            key={Math.floor(liveCost * 100)}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
          >
            {formatCost(liveCost)}
          </motion.p>

          <p className="text-sm text-foreground font-medium mb-1">
            Das sind die echten Kosten dieser offenen Entscheidung.
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs mx-auto">
            „{decisionTitle}" — jede Sekunde, die diese Entscheidung offen bleibt, kostet Geld.
          </p>

          <Button
            onClick={handleDismiss}
            size="lg"
            className="w-full gap-2 h-12 text-sm font-semibold"
          >
            Zähler stoppen — Entscheidung treffen
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AhaMomentOverlay;

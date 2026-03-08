import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCost } from "@/lib/formatters";

interface Props {
  showConfetti: boolean;
  usedDemo: boolean;
  decisionTitle: string;
  liveCod: number;
  weeklyCod: number;
  loading: boolean;
  onFinish: () => void;
  slideAnim: Record<string, unknown>;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-violet))",
  "hsl(var(--accent-teal))",
];

const CompletionStep = ({
  showConfetti, usedDemo, decisionTitle,
  liveCod, weeklyCod, loading, onFinish, slideAnim,
}: Props) => (
  <motion.div key="s5" {...slideAnim} className="w-full max-w-md text-center">
    {/* Confetti */}
    {showConfetti && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 600,
              y: (Math.random() - 0.5) * 600,
              scale: [0, 1, 0.5],
              rotate: Math.random() * 720,
            }}
            transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: CONFETTI_COLORS[i % 6] }}
          />
        ))}
      </motion.div>
    )}

    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
    >
      <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
    </motion.div>

    <h1 className="text-2xl font-bold text-foreground mb-2">
      Dein Workspace ist bereit! 🎉
    </h1>

    {!usedDemo && decisionTitle && (
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-1">Cost-of-Delay deiner Entscheidung</p>
        <motion.p
          className="text-3xl font-bold text-destructive tabular-nums font-mono"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          {formatCost(liveCod)}
        </motion.p>
        <p className="text-xs text-muted-foreground mt-2">
          Deine erste Entscheidung kostet bereits <span className="font-semibold text-foreground">{formatCost(weeklyCod)}/Woche</span>.
        </p>
      </div>
    )}

    <div className="mt-8 space-y-3">
      <Button
        size="lg"
        onClick={onFinish}
        disabled={loading}
        className="w-full max-w-xs mx-auto gap-2 h-12 text-sm font-semibold"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Zum Dashboard <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
);

export default CompletionStep;

import { motion } from "framer-motion";
import { LucideIcon, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EmptyAnalysisStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Primary CTA - navigates to a route */
  ctaLabel?: string;
  ctaRoute?: string;
  /** Secondary hint text */
  hint?: string;
}

const EmptyAnalysisState = ({
  icon: Icon,
  title,
  description,
  ctaLabel = "Entscheidung erstellen",
  ctaRoute = "/decisions",
  hint,
}: EmptyAnalysisStateProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Icon className="w-8 h-8 text-primary opacity-60" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">{description}</p>
      <Button onClick={() => navigate(ctaRoute)} className="gap-2">
        <Plus className="w-4 h-4" />
        {ctaLabel}
      </Button>
      {hint && (
        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          <ArrowRight className="w-3 h-3" />
          {hint}
        </p>
      )}
    </motion.div>
  );
};

export default EmptyAnalysisState;

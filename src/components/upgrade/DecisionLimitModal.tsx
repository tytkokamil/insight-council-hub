import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { Lock, ArrowRight, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { useDecisions } from "@/hooks/useDecisions";

interface DecisionLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Trigger 2 — Hard Limit Modal when decision limit is 100% reached.
 * Shows ROI argument with average CoD.
 */
const DecisionLimitModal = ({ open, onOpenChange }: DecisionLimitModalProps) => {
  const navigate = useNavigate();
  const { decisionCount, maxDecisions } = useFreemiumLimits();
  const { data: decisions = [] } = useDecisions();

  const avgCod = useMemo(() => {
    const withCod = decisions.filter(d => d.cost_per_day && d.cost_per_day > 0);
    if (withCod.length === 0) return null;
    const total = withCod.reduce((s, d) => s + (d.cost_per_day || 0), 0);
    return Math.round(total / withCod.length);
  }, [decisions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-base">Limit erreicht</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            Du hast {decisionCount}/{maxDecisions} Entscheidungen im Free Plan.
            Upgrade auf Starter für 49€/Monat für unbegrenzte Entscheidungen.
          </DialogDescription>
        </DialogHeader>

        {avgCod && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warning/5 border border-warning/20">
            <TrendingDown className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Eine nicht getroffene Entscheidung kostet dich durchschnittlich{" "}
              <span className="font-semibold text-foreground">{avgCod}€/Tag</span>.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/upgrade");
            }}
            className="w-full gap-2"
          >
            Jetzt upgraden
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground text-xs"
          >
            Später
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionLimitModal;

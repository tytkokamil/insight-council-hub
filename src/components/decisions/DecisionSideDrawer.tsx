import { Brain, AlertCircle, Eye, ChevronRight, Info } from "lucide-react";
import AiExplainabilityBadge from "@/components/shared/AiExplainabilityBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
  review: "bg-warning/15 text-warning border border-warning/20",
  approved: "bg-success/15 text-success border border-success/20",
  rejected: "bg-destructive/15 text-destructive border border-destructive/20",
  implemented: "bg-primary/15 text-primary border border-primary/20",
  cancelled: "bg-muted/60 text-muted-foreground line-through",
  superseded: "bg-accent-violet/10 text-accent-violet border border-accent-violet/20",
  archived: "bg-muted/50 text-muted-foreground/60",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-accent-blue",
  high: "text-warning",
  critical: "text-destructive font-semibold",
};

interface DecisionSideDrawerProps {
  decision: any | null;
  meta: { openTasks: number; depCount: number; cost: number; alignment: number } | null;
  onClose: () => void;
  onUpdate: (d: any) => void;
  statusOptions: { value: string; label: string }[];
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
  onInvalidate: () => void;
}

const DecisionSideDrawer = ({
  decision, meta, onClose, onUpdate,
  statusOptions, statusLabels, priorityLabels, categoryLabels, onInvalidate,
}: DecisionSideDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!decision) return null;

  const m = meta || { openTasks: 0, depCount: 0, cost: 0, alignment: 0 };

  return (
    <Sheet open={!!decision} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto border-l border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-lg tracking-tight">{decision.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-5">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${statusStyles[decision.status]}`}>
              {statusLabels[decision.status]}
            </span>
            <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
              {priorityLabels[decision.priority]}
            </span>
            <span className="text-xs text-muted-foreground">· {categoryLabels[decision.category]}</span>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{t("decisions.description")}</p>
            <p className="text-sm leading-relaxed">{decision.description || t("decisions.noDescription")}</p>
          </div>

          {/* AI Summary */}
          {(decision.ai_risk_score || decision.ai_impact_score) && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-semibold text-primary">{t("decisions.aiAnalysis")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">{t("decisions.risk")}</p>
                  <p className="font-bold text-lg">{decision.ai_risk_score || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("drawer.impact")}</p>
                  <p className="font-bold text-lg">{decision.ai_impact_score || 0}%</p>
                </div>
              </div>
              <AiExplainabilityBadge
                confidence={decision.ai_risk_score > 60 ? "low" : decision.ai_risk_score > 30 ? "medium" : "high"}
                sourceType="data"
                dataPoints={decision.ai_risk_factors?.length || 0}
                factors={decision.ai_risk_factors?.slice(0, 2)}
                className="mt-2"
              />
            </div>
          )}

          {/* Open Tasks */}
          {m.openTasks > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-xs text-warning"><span className="font-semibold">{t("drawer.openTasks", { count: m.openTasks })}</span></p>
            </div>
          )}

          {/* Quick Status Change */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("decisions.changeStatus")}</p>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map(s => (
                <Button key={s.value} size="sm" variant={decision.status === s.value ? "default" : "outline"}
                  className="text-xs h-7 press-scale"
                  onClick={async () => {
                    await supabase.from("decisions").update({ status: s.value as any }).eq("id", decision.id);
                    onInvalidate();
                    onUpdate({ ...decision, status: s.value });
                    toast.success(`→ ${s.label}`);
                  }}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <Button className="w-full gap-2 press-scale" onClick={() => { onClose(); navigate(`/decisions/${decision.id}`); }}>
            <Eye className="w-4 h-4" /> {t("decisions.toDetail")} <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DecisionSideDrawer;

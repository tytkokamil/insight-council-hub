import { reviewFlowTemplates, suggestReviewFlow, type ReviewFlowTemplate } from "@/lib/reviewFlowTemplates";
import { Zap, Shield, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const flowIcons = { zap: Zap, shield: Shield, crown: Crown };

interface Props {
  selectedFlowId: string;
  onSelect: (flow: ReviewFlowTemplate) => void;
  category: string;
  priority: string;
}

const ReviewFlowSelector = ({ selectedFlowId, onSelect, category, priority }: Props) => {
  const { t } = useTranslation();
  const suggestedId = suggestReviewFlow(category, priority);

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground mb-1 block">{t("reviewFlow.label")}</label>
      <div className="grid grid-cols-3 gap-2">
        {reviewFlowTemplates.map((flow) => {
          const Icon = flowIcons[flow.icon];
          const isSelected = selectedFlowId === flow.id;
          const isSuggested = suggestedId === flow.id;

          return (
            <button
              key={flow.id}
              type="button"
              onClick={() => onSelect(flow)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border bg-muted/30 hover:bg-muted/60"
              )}
            >
              {isSuggested && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {t("reviewFlow.recommended")}
                </span>
              )}
              {isSelected && (
                <span className="absolute top-1.5 right-1.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </span>
              )}
              <Icon className={cn("w-5 h-5", flow.color)} />
              <span className="text-xs font-semibold">{flow.name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {t("reviewFlow.requiredSteps", { count: flow.steps.filter(s => s.required).length })}
              </span>
              <span className="text-[10px] text-muted-foreground">{t("reviewFlow.estimatedDays", { days: flow.estimatedDays })}</span>
            </button>
          );
        })}
      </div>
      {selectedFlowId && (
        <div className="mt-2 space-y-1">
          {reviewFlowTemplates
            .find(f => f.id === selectedFlowId)
            ?.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/20">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <span className="flex-1">{step.label}</span>
                <span className={cn("text-[10px]", step.required ? "text-destructive" : "text-muted-foreground")}>
                  {step.required ? t("reviewFlow.required") : t("reviewFlow.optional")}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ReviewFlowSelector;

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface MethodologyItem {
  label: string;
  formula: string;
  weight?: string;
}

interface ScoreMethodologyProps {
  title: string;
  description: string;
  items: MethodologyItem[];
  source?: string;
}

const ScoreMethodology = ({ title, description, items, source }: ScoreMethodologyProps) => {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
            aria-label={`${t("shared.methodology")}: ${title}`}
          >
            <Info className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs p-3 space-y-2">
          <p className="text-xs font-semibold">{title} – {t("shared.methodology")}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
          <div className="space-y-1.5 pt-1 border-t border-border/40">
            {items.map((item, i) => (
              <div key={i} className="text-[11px]">
                <span className="font-medium">{item.label}</span>
                {item.weight && <span className="text-muted-foreground"> ({item.weight})</span>}
                <p className="text-muted-foreground leading-snug">{item.formula}</p>
              </div>
            ))}
          </div>
          {source && (
            <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/40">
              {t("shared.source")}: {source}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ScoreMethodology;

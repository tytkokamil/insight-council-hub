import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface HeroKpiItem {
  label: string;
  value: string;
  subLabel?: string;
  icon?: React.ElementType;
  sentiment?: "positive" | "neutral" | "warning" | "critical";
  tooltip?: string;
}

const sentimentColor: Record<string, string> = {
  positive: "text-success",
  neutral: "text-foreground",
  warning: "text-warning",
  critical: "text-destructive",
};

const sentimentBg: Record<string, string> = {
  positive: "bg-success/8",
  neutral: "bg-muted/60",
  warning: "bg-warning/8",
  critical: "bg-destructive/8",
};

const sentimentIcon: Record<string, string> = {
  positive: "text-success",
  neutral: "text-muted-foreground",
  warning: "text-warning",
  critical: "text-destructive",
};

interface HeroKpiProps {
  items: HeroKpiItem[];
  columns?: 3 | 4 | 5;
}

const HeroKpi = ({ items, columns = 4 }: HeroKpiProps) => {
  const gridCols = columns === 3 ? "lg:grid-cols-3" : columns === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-2 gap-5", gridCols)}>
      {items.map((kpi, i) => {
        const sentiment = kpi.sentiment || "neutral";
        const Icon = kpi.icon;
        const card = (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cmd-card p-6 cursor-default group">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {kpi.label}
                </span>
                {Icon && (
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", sentimentBg[sentiment])}>
                    <Icon className={cn("w-4.5 h-4.5", sentimentIcon[sentiment])} />
                  </div>
                )}
              </div>
              <p className={cn("hero-number text-4xl mb-2", sentimentColor[sentiment])}>
                {kpi.value}
              </p>
              {kpi.subLabel && (
                <p className="text-xs text-muted-foreground leading-relaxed">{kpi.subLabel}</p>
              )}
            </div>
          </motion.div>
        );

        if (kpi.tooltip) {
          return (
            <Tooltip key={kpi.label}>
              <TooltipTrigger asChild>{card}</TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-64 text-xs">{kpi.tooltip}</TooltipContent>
            </Tooltip>
          );
        }
        return card;
      })}
    </div>
  );
};

export default HeroKpi;

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

const sentimentDot: Record<string, string> = {
  positive: "bg-success",
  neutral: "bg-muted-foreground/30",
  warning: "bg-warning",
  critical: "bg-destructive",
};

interface HeroKpiProps {
  items: HeroKpiItem[];
  columns?: 3 | 4 | 5;
}

const HeroKpi = ({ items }: HeroKpiProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="cmd-card"
    >
      <div className={cn(
        "grid divide-x divide-border/50",
        items.length <= 3 ? "grid-cols-3" : items.length === 5 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"
      )}>
        {items.map((kpi) => {
          const sentiment = kpi.sentiment || "neutral";
          const Icon = kpi.icon;

          const content = (
            <div key={kpi.label} className="px-5 py-5 sm:py-6 group cursor-default">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", sentimentDot[sentiment])} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {kpi.label}
                </span>
                {Icon && <Icon className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
              <p className={cn("hero-number text-2xl sm:text-3xl", sentimentColor[sentiment])}>
                {kpi.value}
              </p>
              {kpi.subLabel && (
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-relaxed truncate">{kpi.subLabel}</p>
              )}
            </div>
          );

          if (kpi.tooltip) {
            return (
              <Tooltip key={kpi.label}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-64 text-xs">{kpi.tooltip}</TooltipContent>
              </Tooltip>
            );
          }
          return content;
        })}
      </div>
    </motion.div>
  );
};

export default HeroKpi;

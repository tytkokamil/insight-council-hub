import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatters";

interface LiveCodCounterProps {
  /** Base cost already accumulated (snapshot at page load) */
  baseCost: number;
  /** Cost per second = (hourlyRate × 8 × persons × overhead) / 86400 */
  costPerSecond: number;
  /** Timestamp when the decision was created */
  createdAt: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "hero";
  /** Daily cost for tooltip */
  dailyCost?: number;
  /** Whether to show the timer icon */
  showIcon?: boolean;
}

const thresholds = {
  low: 500,
  medium: 1000,
  high: 5000,
};

const getColorClass = (cost: number) => {
  if (cost < thresholds.low) return "text-muted-foreground";
  if (cost < thresholds.medium) return "text-warning";
  return "text-destructive";
};

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm font-semibold",
  lg: "text-3xl font-bold font-display",
  hero: "text-5xl font-bold font-display text-destructive",
};

const LiveCodCounter = ({
  baseCost,
  costPerSecond,
  createdAt,
  size = "md",
  dailyCost,
  showIcon = true,
}: LiveCodCounterProps) => {
  const { t } = useTranslation();
  const [currentCost, setCurrentCost] = useState(baseCost);
  const [shouldPulse, setShouldPulse] = useState(false);
  const startTimeRef = useRef(Date.now());
  const baseRef = useRef(baseCost);
  const prevCostRef = useRef(baseCost);

  useEffect(() => {
    baseRef.current = baseCost;
    startTimeRef.current = Date.now();
  }, [baseCost]);

  useEffect(() => {
    if (costPerSecond <= 0) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newCost = baseRef.current + elapsed * costPerSecond;
      
      // Trigger pulse when cost crosses a whole euro threshold
      if (Math.floor(newCost) > Math.floor(prevCostRef.current)) {
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 1000);
      }
      prevCostRef.current = newCost;
      setCurrentCost(newCost);
    }, 1000);

    return () => clearInterval(interval);
  }, [costPerSecond]);

  const colorClass = getColorClass(currentCost);
  const formattedCost = formatCurrency(Math.round(currentCost));
  const formattedDaily = dailyCost ? formatCurrency(Math.round(dailyCost)) : null;
  const pulseClass = shouldPulse ? "cod-pulse number-tick" : "";

  const counter = (
    <span className={`inline-flex items-center gap-1 tabular-nums ${sizeClasses[size]} ${colorClass} ${pulseClass} transition-colors duration-300`}>
      {showIcon && (
        <Timer className={`shrink-0 ${costPerSecond > 0 ? "animate-pulse" : ""} ${size === "hero" ? "w-7 h-7" : size === "lg" ? "w-5 h-5" : size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"}`} />
      )}
      {formattedCost}
    </span>
  );

  if (!formattedDaily) return counter;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{counter}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-64">
          {t("cod.liveTooltip", {
            daily: formattedDaily,
            defaultValue: `Kosten steigen täglich um ${formattedDaily} — basierend auf Ihrer Cost-of-Delay Konfiguration`,
          })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LiveCodCounter;

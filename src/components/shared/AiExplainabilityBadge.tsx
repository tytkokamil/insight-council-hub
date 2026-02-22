import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiExplainabilityBadgeProps {
  confidence?: number | string | null; // 0-100 or "high"/"medium"/"low"
  factors?: string[];
  dataPoints?: number | null;
  className?: string;
}

const getLevel = (confidence: number | string | null | undefined): "high" | "medium" | "low" => {
  if (typeof confidence === "string") {
    if (confidence === "high" || confidence === "hoch") return "high";
    if (confidence === "low" || confidence === "niedrig") return "low";
    return "medium";
  }
  if (typeof confidence === "number") {
    if (confidence >= 70) return "high";
    if (confidence >= 40) return "medium";
    return "low";
  }
  return "medium";
};

const CONFIG = {
  high: { label: "Hohe Konfidenz", color: "text-success border-success/30 bg-success/10", Icon: ShieldCheck },
  medium: { label: "Mittlere Konfidenz", color: "text-warning border-warning/30 bg-warning/10", Icon: ShieldAlert },
  low: { label: "Niedrige Konfidenz", color: "text-destructive border-destructive/30 bg-destructive/10", Icon: AlertTriangle },
};

const AiExplainabilityBadge = ({ confidence, factors, dataPoints, className = "" }: AiExplainabilityBadgeProps) => {
  const level = getLevel(confidence);
  const { label, color, Icon } = CONFIG[level];
  const numericConfidence = typeof confidence === "number" ? confidence : null;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${color} ${className}`}>
      {/* Confidence header */}
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{label}</span>
            {numericConfidence !== null && (
              <span className="text-[10px] font-mono opacity-70">{numericConfidence}%</span>
            )}
          </div>
        </div>
        {dataPoints != null && dataPoints > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-[10px] opacity-70">
                <Database className="w-3 h-3" /> {dataPoints} Datenpunkte
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">Anzahl ähnlicher Entscheidungen als Grundlage</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Top factors */}
      {factors && factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium flex items-center gap-1 opacity-70">
            <Info className="w-3 h-3" /> Top-Einflussfaktoren
          </p>
          <div className="flex flex-wrap gap-1">
            {factors.slice(0, 3).map((f, i) => (
              <span key={i} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-background/50 border border-current/10">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiExplainabilityBadge;

import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Database, BarChart3, Search, Zap, Globe, Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export type AiSourceType = "data" | "pattern" | "rule" | "benchmark" | "llm";

interface AiExplainabilityBadgeProps {
  confidence?: number | string | null;
  factors?: string[];
  dataPoints?: number | null;
  sourceType?: AiSourceType;
  explanation?: string | null;
  modelUsed?: string | null;
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

const SOURCE_CONFIG: Record<AiSourceType, { icon: typeof BarChart3; labelKey: string; descKey: string }> = {
  data: { icon: BarChart3, labelKey: "shared.aiSourceData", descKey: "shared.aiSourceDataDesc" },
  pattern: { icon: Search, labelKey: "shared.aiSourcePattern", descKey: "shared.aiSourcePatternDesc" },
  rule: { icon: Zap, labelKey: "shared.aiSourceRule", descKey: "shared.aiSourceRuleDesc" },
  benchmark: { icon: Globe, labelKey: "shared.aiSourceBenchmark", descKey: "shared.aiSourceBenchmarkDesc" },
  llm: { icon: Brain, labelKey: "shared.aiSourceLlm", descKey: "shared.aiSourceLlmDesc" },
};

const MODEL_LABELS: Record<string, string> = {
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "google/gemini-3-flash-preview": "Gemini 3 Flash",
  "google/gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "openai/gpt-5": "GPT-5",
  "openai/gpt-5-mini": "GPT-5 Mini",
};

const AiExplainabilityBadge = ({ confidence, factors, dataPoints, sourceType, explanation, modelUsed, className = "" }: AiExplainabilityBadgeProps) => {
  const { t } = useTranslation();

  const level = getLevel(confidence);
  const CONFIG = {
    high: { label: t("shared.aiConfidenceHigh"), color: "text-success border-success/30 bg-success/10", Icon: ShieldCheck, dotColor: "bg-success" },
    medium: { label: t("shared.aiConfidenceMedium"), color: "text-warning border-warning/30 bg-warning/10", Icon: ShieldAlert, dotColor: "bg-warning" },
    low: { label: t("shared.aiConfidenceLow"), color: "text-destructive border-destructive/30 bg-destructive/10", Icon: AlertTriangle, dotColor: "bg-muted-foreground/40" },
  };

  const { label, color, Icon, dotColor } = CONFIG[level];
  const numericConfidence = typeof confidence === "number" ? confidence : null;
  const source = sourceType ? SOURCE_CONFIG[sourceType] : null;
  const SourceIcon = source?.icon;

  const confidenceTooltip = level === "high"
    ? t("shared.aiConfidenceHighTooltip")
    : level === "medium"
    ? t("shared.aiConfidenceMediumTooltip")
    : t("shared.aiConfidenceLowTooltip");

  return (
    <div className={`rounded-lg border p-4 space-y-2.5 ${color} ${className}`}>
      {/* Header: confidence + data points */}
      <div className="flex items-center gap-2.5">
        <Icon className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1.5 text-sm font-semibold cursor-help">
                  <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 animate-pulse`} />
                  {label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">{confidenceTooltip}</p>
              </TooltipContent>
            </Tooltip>
            {numericConfidence !== null && (
              <span className="text-xs font-mono opacity-80">{numericConfidence}%</span>
            )}
          </div>
        </div>
        {dataPoints != null && dataPoints > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-[10px] opacity-70">
                <Database className="w-3 h-3" /> {dataPoints} {t("shared.aiDataPoints")}
              </span>
            </TooltipTrigger>
            <TooltipContent><p className="text-xs">{t("shared.aiDataPointsTooltip")}</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Source type badge */}
      {source && SourceIcon && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-background/50 border border-current/10 cursor-help">
              <SourceIcon className="w-3 h-3" />
              <span className="font-medium">{t(source.labelKey)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">{t(source.descKey)}</p>
            {modelUsed && <p className="text-xs mt-1 opacity-70">{t("shared.aiCreatedWith", "Erstellt mit")} {MODEL_LABELS[modelUsed] || modelUsed}</p>}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Model badge (when no source type but model is known) */}
      {!source && modelUsed && (
        <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-background/50 border border-current/10">
          <Brain className="w-3 h-3" />
          <span className="font-medium">{MODEL_LABELS[modelUsed] || modelUsed}</span>
        </div>
      )}

      {/* Explanation text */}
      {explanation && (
        <div className="flex items-start gap-1.5 pt-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0 opacity-70" />
          <p className="text-[11px] leading-relaxed opacity-80">{explanation}</p>
        </div>
      )}

      {/* Top factors */}
      {factors && factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium flex items-center gap-1 opacity-70">
            <Info className="w-3 h-3" /> {t("shared.aiTopFactors")}
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

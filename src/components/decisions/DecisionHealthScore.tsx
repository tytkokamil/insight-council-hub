import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckSquare, Users, AlertTriangle, Clock,
  TrendingUp, Shield, Link2, DollarSign,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { useTranslation } from "react-i18next";

interface HealthDimension {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  detail: string;
}

type TrafficLight = "green" | "yellow" | "red" | "gray";

const trafficColor: Record<TrafficLight, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-destructive",
  gray: "bg-muted-foreground/40",
};

const trafficText: Record<TrafficLight, string> = {
  green: "text-success",
  yellow: "text-warning",
  red: "text-destructive",
  gray: "text-muted-foreground",
};

const trafficBg: Record<TrafficLight, string> = {
  green: "bg-success/10",
  yellow: "bg-warning/10",
  red: "bg-destructive/10",
  gray: "bg-muted/50",
};

const getTraffic = (value: number, invert = false): TrafficLight => {
  const v = invert ? 100 - value : value;
  if (v >= 70) return "green";
  if (v >= 40) return "yellow";
  if (v > 0) return "red";
  return "gray";
};

const progressColor = (traffic: TrafficLight) => {
  switch (traffic) {
    case "green": return "[&>div]:bg-success";
    case "yellow": return "[&>div]:bg-warning";
    case "red": return "[&>div]:bg-destructive";
    default: return "[&>div]:bg-muted-foreground/40";
  }
};

interface Props {
  decision: any;
  reviewCompletion: number;
  alignmentScore: number;
  riskScore: number;
  depCount: number;
  riskCount: number;
  delayCost: number;
  openLinkedTasks: number;
  isActive: boolean;
  stakeholderPositions: any[];
}

const DecisionHealthScore = ({
  decision,
  reviewCompletion,
  alignmentScore,
  riskScore,
  depCount,
  riskCount,
  delayCost,
  openLinkedTasks,
  isActive,
  stakeholderPositions,
}: Props) => {
  const { t } = useTranslation();

  const { dimensions, overallScore, overallTraffic } = useMemo(() => {
    const reviewDim: HealthDimension = {
      key: "review",
      label: t("healthScore.reviewProgress"),
      value: reviewCompletion,
      icon: CheckSquare,
      detail: t("healthScore.reviewDetail", { pct: reviewCompletion }),
    };

    const total = stakeholderPositions.length;
    const support = stakeholderPositions.filter(p => p.position === "support").length;
    const oppose = stakeholderPositions.filter(p => p.position === "oppose").length;
    const alignValue = total > 0
      ? Math.round(((support - oppose) / total) * 50 + 50)
      : alignmentScore > 0 ? alignmentScore : 0;
    const alignDim: HealthDimension = {
      key: "alignment",
      label: t("healthScore.stakeholderAlignment"),
      value: alignValue,
      icon: Users,
      detail: total > 0
        ? t("healthScore.supportNeutralOppose", { support, neutral: total - support - oppose, oppose })
        : alignmentScore > 0 ? t("healthScore.strategyAlignment", { pct: alignmentScore }) : t("healthScore.noPositions"),
    };

    const riskValue = 100 - riskScore;
    const riskDim: HealthDimension = {
      key: "risk",
      label: t("healthScore.riskLevel"),
      value: riskValue,
      icon: AlertTriangle,
      detail: t("healthScore.riskDetail", { score: riskScore, count: riskCount }),
    };

    let delayValue = 100;
    if (decision.due_date && isActive) {
      const daysLeft = differenceInDays(new Date(decision.due_date), new Date());
      const daysTotal = differenceInDays(new Date(decision.due_date), new Date(decision.created_at));
      if (daysLeft < 0) {
        delayValue = 0;
      } else if (daysTotal > 0) {
        const progress = (daysTotal - daysLeft) / daysTotal;
        const taskPenalty = openLinkedTasks > 0 ? Math.min(openLinkedTasks * 10, 30) : 0;
        delayValue = Math.max(0, Math.round((1 - progress) * 100 - taskPenalty));
      }
    } else if (!decision.due_date) {
      delayValue = 0;
    }
    const delayDim: HealthDimension = {
      key: "delay",
      label: t("healthScore.scheduleSafety"),
      value: !decision.due_date ? 0 : delayValue,
      icon: Clock,
      detail: !decision.due_date
        ? t("healthScore.noDueDate")
        : delayValue === 0
          ? t("healthScore.overdue")
          : t("healthScore.bufferRemaining", { pct: delayValue }),
    };

    const dims = [reviewDim, alignDim, riskDim, delayDim];
    const weights = dims.map(d => d.value > 0 || d.key === "delay" ? 1 : 0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const overall = totalWeight > 0
      ? Math.round(dims.reduce((s, d, i) => s + d.value * weights[i], 0) / totalWeight)
      : 0;

    return {
      dimensions: dims,
      overallScore: overall,
      overallTraffic: getTraffic(overall),
    };
  }, [decision, reviewCompletion, alignmentScore, riskScore, riskCount, openLinkedTasks, stakeholderPositions, isActive, t]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  return (
    <div className="mb-6 space-y-3">
      <Card className={`${trafficBg[overallTraffic]} border-0`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${trafficBg[overallTraffic]} border-2 ${overallTraffic === "green" ? "border-success/30" : overallTraffic === "yellow" ? "border-warning/30" : overallTraffic === "red" ? "border-destructive/30" : "border-muted"}`}>
                <span className={`text-xl font-bold ${trafficText[overallTraffic]}`}>{overallScore}</span>
              </div>
              <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full ${trafficColor[overallTraffic]} ring-2 ring-background`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className={`w-4 h-4 ${trafficText[overallTraffic]}`} />
                <h3 className="font-semibold text-sm">{t("healthScore.title")}</h3>
              </div>
              <Progress value={overallScore} className={`h-2 bg-muted ${progressColor(overallTraffic)}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dimensions.map(dim => {
          const traffic = dim.key === "risk"
            ? getTraffic(dim.value)
            : dim.key === "delay" && !decision.due_date
              ? "gray"
              : getTraffic(dim.value);

          return (
            <Tooltip key={dim.key}>
              <TooltipTrigger asChild>
                <Card className={`card-interactive cursor-default ${trafficBg[traffic]}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${trafficColor[traffic]} shrink-0`} />
                      <dim.icon className={`w-3.5 h-3.5 ${trafficText[traffic]}`} />
                      <span className="text-[10px] font-medium text-muted-foreground truncate">{dim.label}</span>
                    </div>
                    <p className={`text-lg font-bold ${trafficText[traffic]}`}>
                      {dim.value > 0 || dim.key === "delay" ? `${dim.value}%` : "—"}
                    </p>
                    <Progress value={dim.value} className={`h-1 mt-1.5 bg-muted ${progressColor(traffic)}`} />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{dim.detail}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Link2, label: t("healthScore.dependencies"), value: `${depCount}`, color: "text-primary" },
          { icon: DollarSign, label: t("healthScore.delayCost"), value: isActive ? formatCost(delayCost) : "—", color: "text-destructive" },
          { icon: Shield, label: t("healthScore.risks"), value: `${riskCount}`, color: riskCount > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map(m => (
          <Card key={m.label} className="card-interactive">
            <CardContent className="p-3 text-center">
              <m.icon className={`w-4 h-4 mx-auto mb-1 ${m.color}`} />
              <p className="text-lg font-bold number-highlight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DecisionHealthScore;

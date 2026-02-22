import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Gauge, AlertTriangle,
  Target, Users, Clock, BarChart3, ChevronDown, ChevronUp, Database,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDecisions, useReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { differenceInDays, subDays, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ScoreMethodology from "@/components/shared/ScoreMethodology";

interface DQIFactor {
  label: string;
  value: number;
  max: number;
  icon: typeof Gauge;
  color: string;
  description: string;
}

const BENCHMARK = 68;
const TARGET = 80;

const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="tabular-nums"
  >
    {value}{suffix}
  </motion.span>
);

const DecisionQualityIndex = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const { data: tasks = [] } = useTasks();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const [expanded, setExpanded] = useState(false);

  const { data: escalationNotifs = [] } = useQuery({
    queryKey: ["dqi-escalations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, created_at")
        .eq("type", "escalation");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const isPersonal = selectedTeamId === null;

  const { score, factors, trend, trendDelta, storyLine, dataBasis, lastUpdated, improvementTips } = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;

    if (decisions.length < 2) {
      return { score: null, factors: [], trend: "neutral" as const, trendDelta: 0, storyLine: "", dataBasis: 0, lastUpdated: new Date(), improvementTips: [] };
    }

    const now = new Date();
    const total = decisions.length;
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
    const implemented = decisions.filter(d => d.status === "implemented");

    // Factor 1: Escalation Rate (20%)
    const recentEsc = escalationNotifs.filter(e => new Date(e.created_at).getTime() > now.getTime() - 30 * 86400000);
    const escRate = total > 0 ? recentEsc.length / total : 0;
    const escScore = Math.round(Math.max(0, Math.min(20, 20 * (1 - Math.min(escRate, 0.5) / 0.5))));

    // Factor 2: Forecast Accuracy (20%)
    const withOutcome = implemented.filter(d => d.actual_impact_score != null && d.ai_impact_score);
    const accuracies = withOutcome.map(d => Math.max(0, 100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0))));
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 50;
    const forecastScore = Math.round(Math.max(0, Math.min(20, avgAccuracy / 5)));

    // Factor 3: Outcome Success (20%)
    const successful = implemented.filter(d => d.outcome_type === "successful").length;
    const partial = implemented.filter(d => d.outcome_type === "partial").length;
    const failed = implemented.filter(d => d.outcome_type === "failed").length;
    const rated = successful + partial + failed;
    const outcomeRatio = rated > 0 ? (successful + partial * 0.5) / rated : 0.5;
    const outcomeScore = Math.round(Math.max(0, Math.min(20, 20 * outcomeRatio)));

    // Factor 4: Alignment Stability (20%)
    const completedReviews = reviews.filter(r => r.reviewed_at);
    const approved = completedReviews.filter(r => r.status === "approved").length;
    const alignRate = completedReviews.length > 0 ? approved / completedReviews.length : 0.5;
    const alignScore = Math.round(Math.max(0, Math.min(20, 20 * alignRate)));

    // Factor 5: Time-to-Decision (20%)
    const velocities = implemented.filter(d => d.implemented_at).map(d =>
      differenceInDays(new Date(d.implemented_at!), new Date(d.created_at))
    );
    const avgDays = velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 30;
    const speedScore = Math.round(Math.max(0, Math.min(20, 20 * (1 - Math.min(avgDays, 60) / 60))));

    const totalScore = escScore + forecastScore + outcomeScore + alignScore + speedScore;

    // Trend
    const last30 = subDays(now, 30);
    const prev30 = subDays(now, 60);
    const recentImpl = implemented.filter(d => d.implemented_at && new Date(d.implemented_at) >= last30);
    const prevImpl = implemented.filter(d => d.implemented_at && new Date(d.implemented_at) >= prev30 && new Date(d.implemented_at) < last30);
    const recentSuccRate = recentImpl.length > 0
      ? recentImpl.filter(d => d.outcome_type === "successful" || d.outcome_type === "partial").length / recentImpl.length * 100
      : 0;
    const prevSuccRate = prevImpl.length > 0
      ? prevImpl.filter(d => d.outcome_type === "successful" || d.outcome_type === "partial").length / prevImpl.length * 100
      : 0;
    const delta = Math.round(recentSuccRate - prevSuccRate);
    const t = delta > 2 ? "up" as const : delta < -2 ? "down" as const : "neutral" as const;

    const factors: DQIFactor[] = [
      { label: "Eskalationsfreiheit", value: escScore, max: 20, icon: AlertTriangle, color: "text-warning", description: "Niedrige Eskalationsquote = höhere Qualität" },
      { label: "Prognose-Genauigkeit", value: forecastScore, max: 20, icon: BarChart3, color: "text-primary", description: "Wie genau treffen KI-Vorhersagen zu" },
      { label: "Outcome-Erfolg", value: outcomeScore, max: 20, icon: Target, color: "text-success", description: "Anteil erfolgreicher Entscheidungen" },
      { label: "Alignment-Stabilität", value: alignScore, max: 20, icon: Users, color: "text-accent-violet", description: "Übereinstimmung im Review-Prozess" },
      { label: "Time-to-Decision", value: speedScore, max: 20, icon: Clock, color: "text-accent-teal", description: "Geschwindigkeit der Umsetzung" },
    ];

    // Story line
    let story = "";
    if (totalScore >= 70) story = "Eure Entscheidungsqualität ist stark.";
    else if (totalScore >= 50) story = "Solide Qualität, mit Raum für Optimierung.";
    else if (totalScore >= 30) story = "Eure Entscheidungsqualität braucht Aufmerksamkeit.";
    else story = "Dringende Verbesserungen nötig.";

    // Improvement tips based on weakest factors
    const sortedFactors = [...factors].sort((a, b) => (a.value / a.max) - (b.value / b.max));
    const tips: string[] = [];
    if (sortedFactors[0].value / sortedFactors[0].max < 0.5) {
      tips.push(`${sortedFactors[0].label} verbessern (+${sortedFactors[0].max - sortedFactors[0].value} Punkte möglich)`);
    }
    if (sortedFactors.length > 1 && sortedFactors[1].value / sortedFactors[1].max < 0.6) {
      tips.push(`${sortedFactors[1].label} optimieren`);
    }

    const lastUpdate = decisions.length > 0
      ? new Date(Math.max(...decisions.map(d => new Date(d.updated_at).getTime())))
      : now;

    return {
      score: Math.min(100, totalScore),
      factors,
      trend: t,
      trendDelta: delta,
      storyLine: story,
      dataBasis: total,
      lastUpdated: lastUpdate,
      improvementTips: tips,
    };
  }, [allDecisions, reviews, tasks, escalationNotifs, user, isPersonal, selectedTeamId]);

  if (score === null) return null;

  const getScoreColor = (s: number) =>
    s >= 70 ? "text-success" : s >= 45 ? "text-warning" : "text-destructive";

  const getScoreGradient = (s: number) =>
    s >= 70 ? "from-success/20 to-success/5" : s >= 45 ? "from-warning/20 to-warning/5" : "from-destructive/20 to-destructive/5";

  const getScoreRingColor = (s: number) =>
    s >= 70 ? "stroke-success" : s >= 45 ? "stroke-warning" : "stroke-destructive";

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const confidenceLevel = dataBasis >= 30 ? "Hoch" : dataBasis >= 15 ? "Mittel" : "Niedrig";
  const confidenceColor = dataBasis >= 30 ? "text-success" : dataBasis >= 15 ? "text-warning" : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${getScoreGradient(score)} p-6 md:p-8 cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
        {/* Score Ring */}
        <div className="relative shrink-0 self-center md:self-auto">
          <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <motion.circle
              cx="64" cy="64" r={radius} fill="none"
              className={getScoreRingColor(score)}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              <AnimatedNumber value={score} />
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">DQI</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold tracking-tight">Decision Quality Index</h2>
            <ScoreMethodology
              title="Decision Quality Index (DQI)"
              description="Aggregierte Signature-Metrik (0–100) für die Gesamtqualität eurer Entscheidungen. 5 gleichgewichtete Faktoren à 20 Punkte."
              items={[
                { label: "Eskalationsfreiheit", weight: "20 Punkte", formula: "20 × (1 − min(Eskalationsquote 30d, 0.5) / 0.5)" },
                { label: "Prognose-Genauigkeit", weight: "20 Punkte", formula: "Ø(100 − |KI-Impact − Ist-Impact|) / 5" },
                { label: "Outcome-Erfolg", weight: "20 Punkte", formula: "20 × (Erfolg + Partial×0.5) / Bewertete" },
                { label: "Alignment-Stabilität", weight: "20 Punkte", formula: "20 × (Approved / Gesamt Reviews)" },
                { label: "Time-to-Decision", weight: "20 Punkte", formula: "20 × (1 − min(Ø Tage, 60) / 60)" },
              ]}
              source="Berechnung auf Basis aller Entscheidungen, Reviews und Eskalationen"
            />
          </div>

          {/* Story + Trend + Benchmark */}
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{storyLine}</p>
            {trend !== "neutral" && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                {trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trendDelta > 0 ? "+" : ""}{trendDelta}% vs. Vormonat
              </div>
            )}
          </div>

          {/* KPI chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50">
                  <BarChart3 className="w-3 h-3" /> Benchmark: {BENCHMARK}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Branchendurchschnitt für vergleichbare Organisationen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50">
                  <Target className="w-3 h-3" /> Ziel: {TARGET}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Empfohlener Zielwert für die nächsten 90 Tage</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 border border-border/50 ${confidenceColor}`}>
                  <Database className="w-3 h-3" /> Confidence: {confidenceLevel}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Datenbasis: {dataBasis} Entscheidungen</TooltipContent>
            </Tooltip>
          </div>

          {/* Factor bars */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {factors.map((f) => (
              <Tooltip key={f.label}>
                <TooltipTrigger asChild>
                  <div className="space-y-1.5 cursor-help">
                    <div className="flex items-center gap-1.5">
                      <f.icon className={`w-3 h-3 ${f.color}`} />
                      <span className="text-[11px] text-muted-foreground truncate">{f.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          f.value / f.max >= 0.7 ? "bg-success" : f.value / f.max >= 0.4 ? "bg-warning" : "bg-destructive"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(f.value / f.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{f.value}/{f.max}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-48">
                  {f.description}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Data basis footer */}
          <p className="text-[10px] text-muted-foreground/50 mt-3 flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            Datenbasis: {dataBasis} Entscheidungen · Letzte Aktualisierung: {formatDistanceToNow(lastUpdated, { locale: de, addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && improvementTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border/40"
          >
            <p className="text-xs font-semibold mb-2">Verbesserungsvorschläge</p>
            <div className="space-y-1.5">
              {improvementTips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-success shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-2">
              Ziel: DQI von {score} → {TARGET} | Benchmark: {BENCHMARK} | Gap: {Math.max(0, TARGET - score)} Punkte
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand hint */}
      <div className="flex justify-center mt-2">
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
        )}
      </div>
    </motion.div>
  );
};

export default DecisionQualityIndex;

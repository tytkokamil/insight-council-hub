import { useMemo, useRef, useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ── Score Input ── */
export interface QualityScoreInput {
  title?: string;
  description?: string;
  hasCategory?: boolean;
  hasPriority?: boolean;
  hasDueDate?: boolean;
  hasReviewer?: boolean;
  hasRiskAssessment?: boolean;
  hasBudgetInfo?: boolean;
  hasSla?: boolean;
  // legacy compat
  hasOptions?: boolean;
  hasAttachment?: boolean;
}

/* ── Score Calculation (100 pts total) ── */
export interface MissingItem {
  label: string;
  points: number;
  fieldId?: string;
}

export function calculateQualityScore(input: QualityScoreInput): {
  score: number;
  missing: MissingItem[];
} {
  let score = 0;
  const missing: MissingItem[] = [];

  // Title: +10
  if (input.title && input.title.trim().length > 0) {
    score += 10;
  } else {
    missing.push({ label: "Titel eingeben", points: 10, fieldId: "qs-title" });
  }

  // Description >50 chars: +15
  if (input.description && input.description.trim().length > 50) {
    score += 15;
  } else {
    missing.push({ label: "Beschreibung ergänzen (>50 Zeichen)", points: 15, fieldId: "qs-description" });
  }

  // Category: +10
  if (input.hasCategory) {
    score += 10;
  } else {
    missing.push({ label: "Kategorie wählen", points: 10, fieldId: "qs-category" });
  }

  // Priority: +10
  if (input.hasPriority) {
    score += 10;
  } else {
    missing.push({ label: "Priorität setzen", points: 10, fieldId: "qs-priority" });
  }

  // SLA: +10
  if (input.hasSla) {
    score += 10;
  } else {
    missing.push({ label: "SLA-Dauer setzen", points: 10, fieldId: "qs-sla" });
  }

  // Reviewer: +15
  if (input.hasReviewer) {
    score += 15;
  } else {
    missing.push({ label: "Reviewer hinzufügen", points: 15, fieldId: "qs-reviewer" });
  }

  // Risk assessment: +10
  if (input.hasRiskAssessment) {
    score += 10;
  } else {
    missing.push({ label: "Risiko-Einschätzung vorhanden", points: 10 });
  }

  // Budget/CoD info: +10
  if (input.hasBudgetInfo) {
    score += 10;
  } else {
    missing.push({ label: "Budget/CoD-Info ergänzen", points: 10 });
  }

  // Due date: +10
  if (input.hasDueDate) {
    score += 10;
  } else {
    missing.push({ label: "Fälligkeitsdatum setzen", points: 10, fieldId: "qs-duedate" });
  }

  return { score, missing };
}

/* ── Color helpers ── */
function getScoreColor(score: number): string {
  if (score <= 40) return "text-destructive";
  if (score <= 69) return "text-warning";
  if (score <= 89) return "text-primary";
  return "text-success";
}

function getScoreStroke(score: number): string {
  if (score <= 40) return "stroke-destructive";
  if (score <= 69) return "stroke-warning";
  if (score <= 89) return "stroke-primary";
  return "stroke-success";
}

function getScoreTrack(score: number): string {
  if (score <= 40) return "stroke-destructive/20";
  if (score <= 69) return "stroke-warning/20";
  if (score <= 89) return "stroke-primary/20";
  return "stroke-success/20";
}

function getScoreLabel(score: number): string {
  if (score <= 40) return "Unvollständig";
  if (score <= 69) return "Basis";
  if (score <= 89) return "Gut";
  return "Exzellent";
}

function getScoreBgClass(score: number): string {
  if (score <= 40) return "bg-destructive/10 border-destructive/20";
  if (score <= 69) return "bg-warning/10 border-warning/20";
  if (score <= 89) return "bg-primary/10 border-primary/20";
  return "bg-success/10 border-success/20";
}

/* ── Animated Circular Score ── */
export const QualityScoreCircle = ({
  score,
  size = 48,
  strokeWidth = 4,
  showLabel = false,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const prevScoreRef = useRef(score);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "relative inline-flex items-center justify-center transition-transform duration-300",
          pulsing && "scale-110"
        )}
        style={{ width: size, height: size }}
      >
        {/* Pulse ring */}
        {pulsing && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{
              backgroundColor: score <= 40 ? "hsl(var(--destructive))" :
                score <= 69 ? "hsl(var(--warning))" :
                score <= 89 ? "hsl(var(--primary))" : "hsl(var(--success))",
            }}
          />
        )}
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={getScoreTrack(score)}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(getScoreStroke(score), "transition-all duration-500 ease-out")}
          />
        </svg>
        <span className={cn("absolute text-xs font-bold transition-colors duration-300", getScoreColor(score))}>
          {score}
        </span>
      </div>
      {showLabel && (
        <span className={cn("text-[10px] font-medium transition-colors duration-300", getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
};

/* ── Inline badge for decision lists ── */
export const QualityScoreBadge = ({ decision }: { decision: any }) => {
  const { score } = useMemo(() => calculateQualityScore({
    title: decision.title,
    description: decision.description,
    hasCategory: !!decision.category,
    hasPriority: !!decision.priority && decision.priority !== "medium",
    hasDueDate: !!decision.due_date,
    hasReviewer: false,
    hasSla: !!decision.due_date,
    hasRiskAssessment: decision.ai_risk_score != null,
    hasBudgetInfo: decision.cost_per_day != null,
  }), [decision]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold border",
            score <= 40 ? "bg-destructive/10 text-destructive border-destructive/30" :
            score <= 69 ? "bg-warning/10 text-warning border-warning/30" :
            score <= 89 ? "bg-primary/10 text-primary border-primary/30" :
            "bg-success/10 text-success border-success/30"
          )}>
            {score}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Qualitäts-Score: {score}/100 — {getScoreLabel(score)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/* ── Clickable hints in the form ── */
export const QualityScoreHints = ({
  score,
  missing,
}: {
  score: number;
  missing: MissingItem[];
}) => {
  const handleClick = (fieldId?: string) => {
    if (!fieldId) return;
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

  if (missing.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
        <p className="text-xs text-success font-medium">
          ✓ Exzellent dokumentiert — bereit zur Einreichung
        </p>
      </div>
    );
  }

  return (
    <div className={cn("p-3 rounded-lg border space-y-1.5", getScoreBgClass(score))}>
      <p className={cn("text-xs font-medium", getScoreColor(score))}>
        Fehlende Punkte:
      </p>
      <ul className="space-y-0.5">
        {missing.map((m, i) => (
          <li key={i} className="text-[11px] text-muted-foreground">
            {m.fieldId ? (
              <button
                type="button"
                onClick={() => handleClick(m.fieldId)}
                className="text-left hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                + {m.points} Punkte: {m.label}
              </button>
            ) : (
              <span>+ {m.points} Punkte: {m.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

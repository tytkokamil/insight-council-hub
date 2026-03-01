import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface QualityScoreInput {
  title?: string;
  description?: string;
  hasOptions?: boolean;
  hasReviewer?: boolean;
  hasDueDate?: boolean;
  hasPriority?: boolean;
  hasAttachment?: boolean;
}

export function calculateQualityScore(input: QualityScoreInput): {
  score: number;
  missing: { label: string; points: number }[];
} {
  let score = 0;
  const missing: { label: string; points: number }[] = [];

  if (input.title && input.title.trim().length > 10) {
    score += 15;
  } else {
    missing.push({ label: "Titel mit mehr als 10 Zeichen", points: 15 });
  }

  if (input.description && input.description.trim().length > 50) {
    score += 20;
  } else {
    missing.push({ label: "Beschreibung mit mehr als 50 Zeichen", points: 20 });
  }

  if (input.hasOptions) {
    score += 15;
  } else {
    missing.push({ label: "Mindestens eine Option/Alternative", points: 15 });
  }

  if (input.hasReviewer) {
    score += 15;
  } else {
    missing.push({ label: "Reviewer zuweisen", points: 15 });
  }

  if (input.hasDueDate) {
    score += 15;
  } else {
    missing.push({ label: "Deadline setzen", points: 15 });
  }

  if (input.hasPriority) {
    score += 10;
  } else {
    missing.push({ label: "Priorität setzen", points: 10 });
  }

  if (input.hasAttachment) {
    score += 10;
  } else {
    missing.push({ label: "Anhang oder Dokument hinzufügen", points: 10 });
  }

  return { score, missing };
}

function getScoreColor(score: number): string {
  if (score <= 40) return "text-destructive";
  if (score <= 70) return "text-warning";
  return "text-success";
}

function getScoreStroke(score: number): string {
  if (score <= 40) return "stroke-destructive";
  if (score <= 70) return "stroke-warning";
  return "stroke-success";
}

function getScoreTrack(score: number): string {
  if (score <= 40) return "stroke-destructive/20";
  if (score <= 70) return "stroke-warning/20";
  return "stroke-success/20";
}

/** Circular quality score indicator */
export const QualityScoreCircle = ({
  score,
  size = 48,
  strokeWidth = 4,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
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
          className={cn(getScoreStroke(score), "transition-all duration-500")}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
};

/** Small inline badge for decision lists */
export const QualityScoreBadge = ({ decision }: { decision: any }) => {
  const { score } = useMemo(() => calculateQualityScore({
    title: decision.title,
    description: decision.description,
    hasOptions: decision.options && (Array.isArray(decision.options) ? decision.options.length > 0 : false),
    hasReviewer: false, // Can't determine from list data easily
    hasDueDate: !!decision.due_date,
    hasPriority: !!decision.priority && decision.priority !== "medium",
    hasAttachment: false,
  }), [decision]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold border",
          score <= 40 ? "bg-destructive/10 text-destructive border-destructive/30" :
          score <= 70 ? "bg-warning/10 text-warning border-warning/30" :
          "bg-success/10 text-success border-success/30"
        )}>
          {score}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        Qualitäts-Score: {score}/100
      </TooltipContent>
    </Tooltip>
  );
};

/** Hints box shown in the creation form */
export const QualityScoreHints = ({
  score,
  missing,
}: {
  score: number;
  missing: { label: string; points: number }[];
}) => {
  if (score >= 80) {
    return (
      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
        <p className="text-xs text-success font-medium">
          ✓ Gut dokumentiert — bereit zur Einreichung
        </p>
      </div>
    );
  }

  if (score < 60 && missing.length > 0) {
    return (
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 space-y-1.5">
        <p className="text-xs text-warning font-medium">
          Diese Entscheidung könnte besser vorbereitet sein:
        </p>
        <ul className="space-y-0.5">
          {missing.slice(0, 4).map((m, i) => (
            <li key={i} className="text-[11px] text-muted-foreground">
              • {m.label} <span className="text-warning font-medium">(+{m.points} Punkte)</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
};

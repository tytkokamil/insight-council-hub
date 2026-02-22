import { useMemo } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Ban, Replace, CheckCircle2, Clock, Circle } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { de } from "date-fns/locale";

interface DecisionLifecycleBarProps {
  decision: {
    status: string;
    created_at: string;
    updated_at: string;
    due_date?: string | null;
    implemented_at?: string | null;
    cancelled_at?: string | null;
    escalation_level?: number | null;
    last_escalated_at?: string | null;
  };
}

const STAGES = [
  { key: "draft", label: "Entwurf" },
  { key: "proposed", label: "Vorschlag" },
  { key: "review", label: "Review" },
  { key: "approved", label: "Genehmigt" },
  { key: "implemented", label: "Umgesetzt" },
] as const;

const stageIndex: Record<string, number> = {
  draft: 0,
  proposed: 1,
  review: 2,
  approved: 3,
  implemented: 4,
  rejected: 2, // stopped at review
};

const DecisionLifecycleBar = ({ decision }: DecisionLifecycleBarProps) => {
  const isCancelled = decision.status === "cancelled";
  const isSuperseded = decision.status === "superseded";
  const isRejected = decision.status === "rejected";
  const isTerminal = isCancelled || isSuperseded || isRejected;

  const currentIdx = stageIndex[decision.status] ?? 0;

  const isOverdue = useMemo(() => {
    if (!decision.due_date) return false;
    return new Date(decision.due_date) < new Date() && !["implemented", "cancelled", "superseded", "archived"].includes(decision.status);
  }, [decision.due_date, decision.status]);

  const daysOpen = differenceInDays(new Date(), new Date(decision.created_at));
  const hasEscalation = (decision.escalation_level || 0) > 0;

  return (
    <div className="space-y-2">
      {/* Progress track */}
      <div className="relative flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx || (i === currentIdx && decision.status === "implemented");
          const isCurrent = i === currentIdx && !isDone;
          const isFuture = i > currentIdx;

          // For terminal states, mark the stop point
          const isStopPoint = isTerminal && i === currentIdx;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              {/* Connector line (before node, not for first) */}
              {i > 0 && (
                <motion.div
                  className={`h-[3px] flex-1 rounded-full ${
                    isDone
                      ? isTerminal && i === currentIdx
                        ? isCancelled ? "bg-muted-foreground/40" : isRejected ? "bg-destructive/40" : "bg-accent-foreground/40"
                        : "bg-primary"
                      : "bg-muted"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
              )}

              {/* Node */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`relative shrink-0 flex items-center justify-center rounded-full transition-colors ${
                      isDone
                        ? "w-7 h-7 bg-primary text-primary-foreground"
                        : isStopPoint
                          ? isCancelled
                            ? "w-7 h-7 bg-muted-foreground/20 text-muted-foreground border-2 border-muted-foreground/40"
                            : isRejected
                              ? "w-7 h-7 bg-destructive/20 text-destructive border-2 border-destructive/40"
                              : "w-7 h-7 bg-accent/30 text-accent-foreground border-2 border-accent/50"
                          : isCurrent
                            ? "w-7 h-7 border-2 border-primary bg-primary/10 text-primary"
                            : "w-6 h-6 border-2 border-muted bg-background text-muted-foreground/40"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 + 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isStopPoint && isCancelled && <Ban className="w-3.5 h-3.5" />}
                    {isStopPoint && isRejected && <AlertTriangle className="w-3.5 h-3.5" />}
                    {isStopPoint && isSuperseded && <Replace className="w-3.5 h-3.5" />}
                    {isCurrent && !isTerminal && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    {isFuture && <Circle className="w-2.5 h-2.5" />}

                    {/* Escalation marker */}
                    {isCurrent && hasEscalation && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <AlertTriangle className="w-2 h-2 text-warning-foreground" />
                      </motion.div>
                    )}

                    {/* Overdue marker */}
                    {isCurrent && isOverdue && !hasEscalation && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Clock className="w-2 h-2 text-destructive-foreground" />
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-semibold">{stage.label}</p>
                  {isDone && <p className="text-muted-foreground">Abgeschlossen</p>}
                  {isCurrent && !isTerminal && <p className="text-primary">Aktueller Status</p>}
                  {isStopPoint && isCancelled && <p className="text-muted-foreground">Abgebrochen{decision.cancelled_at ? ` am ${format(new Date(decision.cancelled_at), "dd.MM.yy", { locale: de })}` : ""}</p>}
                  {isStopPoint && isRejected && <p className="text-destructive">Abgelehnt</p>}
                  {isStopPoint && isSuperseded && <p className="text-accent-foreground">Durch Nachfolger ersetzt</p>}
                  {isCurrent && isOverdue && <p className="text-destructive">⚠ Überfällig</p>}
                  {isCurrent && hasEscalation && <p className="text-warning">⚡ Eskalation Stufe {decision.escalation_level}</p>}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx || (i === currentIdx && decision.status === "implemented");
          const isCurrent = i === currentIdx && !isDone;
          return (
            <div key={stage.key} className={`flex-1 last:flex-none text-center ${i === 0 ? "text-left" : i === STAGES.length - 1 ? "text-right" : ""}`}>
              <p className={`text-[10px] font-medium leading-tight ${
                isDone ? "text-primary" : isCurrent ? (isTerminal ? "text-muted-foreground" : "text-foreground") : "text-muted-foreground/50"
              }`}>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Duration badge */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {daysOpen}d Laufzeit
        </span>
        {isOverdue && (
          <span className="text-destructive font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Überfällig
          </span>
        )}
        {hasEscalation && (
          <span className="text-warning font-medium">
            ⚡ Stufe {decision.escalation_level}
          </span>
        )}
        {decision.implemented_at && (
          <span className="text-success font-medium">
            ✓ Umgesetzt am {format(new Date(decision.implemented_at), "dd.MM.yy", { locale: de })}
          </span>
        )}
      </div>
    </div>
  );
};

export default DecisionLifecycleBar;

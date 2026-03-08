import { useMemo } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Ban, Replace, CheckCircle2, Clock, Circle } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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

const stageIndex: Record<string, number> = {
  draft: 0,
  proposed: 1,
  review: 2,
  approved: 3,
  implemented: 4,
  rejected: 2,
};

const DecisionLifecycleBar = ({ decision }: DecisionLifecycleBarProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const STAGES = [
    { key: "draft", label: t("lifecycle.draft") },
    { key: "proposed", label: t("lifecycle.proposed") },
    { key: "review", label: t("lifecycle.review") },
    { key: "approved", label: t("lifecycle.approved") },
    { key: "implemented", label: t("lifecycle.implemented") },
  ] as const;

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
      <div className="relative flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx || (i === currentIdx && decision.status === "implemented");
          const isCurrent = i === currentIdx && !isDone;
          const isFuture = i > currentIdx;
          const isStopPoint = isTerminal && i === currentIdx;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              {i > 0 && (
                <motion.div
                  className={`h-[3px] flex-1 rounded-full ${
                    isDone
                      ? isTerminal && i === currentIdx
                        ? isCancelled ? "bg-muted-foreground/40" : isRejected ? "bg-destructive/40" : "bg-accent-foreground/40"
                        : ""
                      : ""
                  }`}
                  style={{
                    transformOrigin: "left",
                    ...(isDone && !(isTerminal && i === currentIdx)
                      ? { backgroundColor: "hsl(var(--success))" }
                      : !isDone
                        ? { backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 6px, transparent 6px, transparent 12px)", opacity: 0.4 }
                        : {}),
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                />
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`relative shrink-0 flex items-center justify-center rounded-full transition-colors ${
                      isDone
                        ? "w-7 h-7"
                        : isStopPoint
                          ? isCancelled
                            ? "w-7 h-7 bg-muted-foreground/20 text-muted-foreground border-2 border-muted-foreground/40"
                            : isRejected
                              ? "w-7 h-7 bg-destructive/20 text-destructive border-2 border-destructive/40"
                              : "w-7 h-7 bg-accent/30 text-accent-foreground border-2 border-accent/50"
                          : isCurrent
                            ? "w-7 h-7"
                            : "w-6 h-6 border-2 bg-background"
                    }`}
                    style={
                      isDone
                        ? { backgroundColor: "hsl(var(--success))", color: "hsl(var(--success-foreground))" }
                        : isCurrent && !isTerminal
                          ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                          : isFuture
                            ? { borderColor: "hsl(var(--muted-foreground))", color: "hsl(var(--muted-foreground))" }
                            : undefined
                    }
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
                        className="w-2.5 h-2.5 rounded-full bg-white"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    {isFuture && <Circle className="w-2.5 h-2.5" />}

                    {isCurrent && hasEscalation && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <AlertTriangle className="w-2 h-2 text-warning-foreground" />
                      </motion.div>
                    )}

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
                  {isDone && <p className="text-muted-foreground">{t("lifecycle.completed")}</p>}
                  {isCurrent && !isTerminal && <p className="text-primary">{t("lifecycle.currentStatus")}</p>}
                  {isStopPoint && isCancelled && <p className="text-muted-foreground">{decision.cancelled_at ? t("lifecycle.cancelledAt", { date: format(new Date(decision.cancelled_at), "dd.MM.yy", { locale: dateFnsLocale }) }) : t("lifecycle.cancelled")}</p>}
                  {isStopPoint && isRejected && <p className="text-destructive">{t("lifecycle.rejected")}</p>}
                  {isStopPoint && isSuperseded && <p className="text-accent-foreground">{t("lifecycle.superseded")}</p>}
                  {isCurrent && isOverdue && <p className="text-destructive">{t("lifecycle.overdue")}</p>}
                  {isCurrent && hasEscalation && <p className="text-warning">{t("lifecycle.escalationLevel", { level: decision.escalation_level })}</p>}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>

      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isDone = i < currentIdx || (i === currentIdx && decision.status === "implemented");
          const isCurrent = i === currentIdx && !isDone;
          const isFuture = i > currentIdx;
          return (
            <div key={stage.key} className={`flex-1 last:flex-none text-center ${i === 0 ? "text-left" : i === STAGES.length - 1 ? "text-right" : ""}`}>
              <p className={`text-[10px] leading-tight ${
                isDone ? "font-medium" : isCurrent ? (isTerminal ? "text-muted-foreground font-semibold" : "font-semibold") : "font-medium"
              }`}
              style={
                isDone ? { color: "hsl(var(--success))" } : isCurrent && !isTerminal ? { color: "hsl(var(--primary))", fontWeight: 600 } : isFuture ? { opacity: 0.5, color: "hsl(var(--muted-foreground))" } : undefined
              }>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {t("lifecycle.daysOpen", { days: daysOpen })}
        </span>
        {isOverdue && (
          <span className="text-destructive font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {t("lifecycle.overdueLabel")}
          </span>
        )}
        {hasEscalation && (
          <span className="text-warning font-medium">
            {t("lifecycle.level", { level: decision.escalation_level })}
          </span>
        )}
        {decision.implemented_at && (
          <span className="text-success font-medium">
            {t("lifecycle.implementedAt", { date: format(new Date(decision.implemented_at), "dd.MM.yy", { locale: dateFnsLocale }) })}
          </span>
        )}
      </div>
    </div>
  );
};

export default DecisionLifecycleBar;

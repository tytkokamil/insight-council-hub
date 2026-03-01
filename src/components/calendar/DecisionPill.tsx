import { memo, DragEvent } from "react";
import { GripVertical, User, Calendar, AlertTriangle, Zap, Link2 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";
import { useTranslation } from "react-i18next";

interface DecisionPillProps {
  decision: any;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: (id: string) => void;
  showTime?: boolean;
  profileMap?: Record<string, string>;
}

const PRIORITY_MULTIPLIER: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };

const DecisionPill = memo(({ decision, draggingId, onDragStart, onDragEnd, onClick, profileMap }: DecisionPillProps) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const CATEGORY_LABELS: Record<string, string> = {
    strategic: t("cal.catStrategic"), budget: t("cal.catBudget"), hr: t("cal.catHr"),
    technical: t("cal.catTechnical"), operational: t("cal.catOperational"), marketing: t("cal.catMarketing"),
  };
  const STATUS_LABELS: Record<string, string> = {
    draft: t("cal.statusDraft"), proposed: t("cal.statusProposed"), review: t("cal.statusReview"),
    approved: t("cal.statusApproved"), rejected: t("cal.statusRejected"), implemented: t("cal.statusImplemented"), archived: t("cal.statusArchived"),
  };

  const assigneeName = decision.assignee_id && profileMap?.[decision.assignee_id];
  const creatorName = profileMap?.[decision.created_by];
  const isEscalated = (decision.escalation_level ?? 0) >= 1;
  const isOverdue = decision.due_date && new Date(decision.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(decision.status);
  const hasSLAViolation = isEscalated || isOverdue;

  let delayCost = 0;
  if (isOverdue && decision.due_date) {
    const days = differenceInCalendarDays(new Date(), new Date(decision.due_date));
    delayCost = days * 120 * (PRIORITY_MULTIPLIER[decision.priority] ?? 1);
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, decision.id)}
          onDragEnd={onDragEnd}
          onClick={() => onClick(decision.id)}
          className={cn(
            "w-full text-left rounded px-1.5 py-1 text-[11px] font-medium truncate flex items-center gap-1 cursor-grab active:cursor-grabbing hover:opacity-90 transition-all",
            priorityColor[decision.priority] || priorityColor.medium,
            draggingId === decision.id && "opacity-40 scale-95",
            hasSLAViolation && "ring-1 ring-destructive/50",
          )}
        >
          <GripVertical className="w-3 h-3 shrink-0 opacity-50" />
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[decision.status] || statusDot.draft)} />
          <span className="truncate">{decision.title}</span>
          {hasSLAViolation && <AlertTriangle className="w-3 h-3 shrink-0 text-destructive-foreground animate-pulse ml-auto" />}
          {!hasSLAViolation && isEscalated && <Zap className="w-3 h-3 shrink-0 ml-auto opacity-70" />}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-3">
        <div className="space-y-2">
          <p className="font-semibold text-sm leading-tight">{decision.title}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] capitalize">
              <span className={cn("w-1.5 h-1.5 rounded-full mr-1", statusDot[decision.status] || statusDot.draft)} />
              {STATUS_LABELS[decision.status] || decision.status}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{decision.priority}</Badge>
            <Badge variant="outline" className="text-[10px] capitalize">{CATEGORY_LABELS[decision.category] || decision.category}</Badge>
            {isEscalated && (
              <Badge variant="destructive" className="text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                {t("meeting.escalated")} (L{decision.escalation_level})
              </Badge>
            )}
          </div>

          {(decision.ai_risk_score > 0 || delayCost > 0 || isOverdue) && (
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40">
              {decision.ai_risk_score > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">{t("cal.risk")}: </span>
                  <span className={cn("font-semibold", decision.ai_risk_score >= 70 ? "text-destructive" : decision.ai_risk_score >= 40 ? "text-warning" : "text-success")}>{decision.ai_risk_score}%</span>
                </div>
              )}
              {delayCost > 0 && (
                <div className="text-xs flex items-center gap-1">
                  <span className="font-semibold text-destructive">{delayCost.toLocaleString()} €</span>
                </div>
              )}
              {isOverdue && (
                <div className="text-xs text-destructive font-medium col-span-2">
                  ⚠ {t("cal.overdueSince", { days: differenceInCalendarDays(new Date(), new Date(decision.due_date)) })}
                </div>
              )}
            </div>
          )}

          {decision.description && <p className="text-xs text-muted-foreground line-clamp-3">{decision.description}</p>}

          <div className="space-y-1 pt-1 border-t border-border/40">
            {assigneeName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3 shrink-0" />
                <span>{t("cal.assignee")}: <span className="text-foreground font-medium">{assigneeName}</span></span>
              </div>
            )}
            {!assigneeName && creatorName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3 shrink-0" />
                <span>{t("cal.createdBy")}: <span className="text-foreground font-medium">{creatorName}</span></span>
              </div>
            )}
            {decision.due_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{t("cal.dueDate")}: {format(new Date(decision.due_date), "dd. MMM yyyy", { locale: dateFnsLocale })}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground italic">{t("cal.dragHint")}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

DecisionPill.displayName = "DecisionPill";

export default DecisionPill;

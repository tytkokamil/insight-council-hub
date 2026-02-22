import { memo, DragEvent } from "react";
import { GripVertical, User, Calendar, AlertTriangle, Zap, DollarSign, Link2 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";

interface DecisionPillProps {
  decision: any;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: (id: string) => void;
  showTime?: boolean;
  profileMap?: Record<string, string>;
}

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Strategisch",
  budget: "Budget",
  hr: "HR",
  technical: "Technisch",
  operational: "Operativ",
  marketing: "Marketing",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  proposed: "Vorschlag",
  review: "Review",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  implemented: "Umgesetzt",
  archived: "Archiviert",
};

const PRIORITY_MULTIPLIER: Record<string, number> = {
  critical: 4, high: 2.5, medium: 1.5, low: 1,
};

const DecisionPill = memo(({
  decision,
  draggingId,
  onDragStart,
  onDragEnd,
  onClick,
  profileMap,
}: DecisionPillProps) => {
  const assigneeName = decision.assignee_id && profileMap?.[decision.assignee_id];
  const creatorName = profileMap?.[decision.created_by];

  const isEscalated = (decision.escalation_level ?? 0) >= 1;
  const isOverdue = decision.due_date && new Date(decision.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(decision.status);
  const isCritical = decision.priority === "critical";
  const hasSLAViolation = isEscalated || isOverdue;

  // Delay cost
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
          {hasSLAViolation && (
            <AlertTriangle className="w-3 h-3 shrink-0 text-destructive-foreground animate-pulse ml-auto" />
          )}
          {!hasSLAViolation && isEscalated && (
            <Zap className="w-3 h-3 shrink-0 ml-auto opacity-70" />
          )}
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
            <Badge variant="outline" className="text-[10px] capitalize">
              {CATEGORY_LABELS[decision.category] || decision.category}
            </Badge>
            {isEscalated && (
              <Badge variant="destructive" className="text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-0.5" />
                Eskaliert (L{decision.escalation_level})
              </Badge>
            )}
          </div>

          {/* Risk & economic info */}
          {(decision.ai_risk_score > 0 || delayCost > 0 || isOverdue) && (
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border">
              {decision.ai_risk_score > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Risiko: </span>
                  <span className={cn(
                    "font-semibold",
                    decision.ai_risk_score >= 70 ? "text-destructive" : decision.ai_risk_score >= 40 ? "text-warning" : "text-success"
                  )}>{decision.ai_risk_score}%</span>
                </div>
              )}
              {delayCost > 0 && (
                <div className="text-xs flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-destructive" />
                  <span className="font-semibold text-destructive">{delayCost.toLocaleString("de-DE")}€</span>
                </div>
              )}
              {isOverdue && (
                <div className="text-xs text-destructive font-medium col-span-2">
                  ⚠ Überfällig seit {differenceInCalendarDays(new Date(), new Date(decision.due_date))} Tagen
                </div>
              )}
            </div>
          )}

          {decision.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">{decision.description}</p>
          )}

          <div className="space-y-1 pt-1 border-t border-border">
            {assigneeName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3 shrink-0" />
                <span>Zuständig: <span className="text-foreground font-medium">{assigneeName}</span></span>
              </div>
            )}
            {!assigneeName && creatorName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3 shrink-0" />
                <span>Erstellt von: <span className="text-foreground font-medium">{creatorName}</span></span>
              </div>
            )}
            {decision.due_date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>Fällig: {format(new Date(decision.due_date), "dd. MMM yyyy", { locale: de })}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground italic">Ziehen zum Verschieben · Klicken für Details</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});

DecisionPill.displayName = "DecisionPill";

export default DecisionPill;

import { memo, DragEvent } from "react";
import { CalendarOff } from "lucide-react";
import DecisionPill from "./DecisionPill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

interface UnscheduledSidebarProps {
  decisions: any[];
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDecisionClick: (id: string) => void;
  profileMap?: Record<string, string>;
}

const UnscheduledSidebar = memo(({
  decisions, draggingId, onDragStart, onDragEnd, onDecisionClick, profileMap,
}: UnscheduledSidebarProps) => {
  const { t } = useTranslation();
  if (decisions.length === 0) return null;

  return (
    <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border/60 flex items-center gap-2">
        <CalendarOff className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">{t("cal.noDeadline")}</span>
        <span className="ml-auto text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{decisions.length}</span>
      </div>
      <ScrollArea className="max-h-[300px]">
        <div className="p-2 space-y-1">
          {decisions.map((decision) => (
            <DecisionPill key={decision.id} decision={decision} draggingId={draggingId} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onDecisionClick} profileMap={profileMap} />
          ))}
        </div>
      </ScrollArea>
      <div className="px-3 py-1.5 border-t border-border/60">
        <p className="text-[10px] text-muted-foreground italic">{t("cal.dragToAssign")}</p>
      </div>
    </div>
  );
});

UnscheduledSidebar.displayName = "UnscheduledSidebar";

export default UnscheduledSidebar;

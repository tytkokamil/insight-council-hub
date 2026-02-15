import { memo, DragEvent } from "react";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";

interface DecisionPillProps {
  decision: any;
  draggingId: string | null;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: (id: string) => void;
  showTime?: boolean;
}

const DecisionPill = memo(({
  decision,
  draggingId,
  onDragStart,
  onDragEnd,
  onClick,
}: DecisionPillProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, decision.id)}
        onDragEnd={onDragEnd}
        onClick={() => onClick(decision.id)}
        className={cn(
          "w-full text-left rounded px-1.5 py-1 text-[11px] font-medium truncate flex items-center gap-1 cursor-grab active:cursor-grabbing hover:opacity-90 transition-all",
          priorityColor[decision.priority] || priorityColor.medium,
          draggingId === decision.id && "opacity-40 scale-95"
        )}
      >
        <GripVertical className="w-3 h-3 shrink-0 opacity-50" />
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[decision.status] || statusDot.draft)} />
        <span className="truncate">{decision.title}</span>
      </div>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-[250px]">
      <p className="font-semibold text-sm">{decision.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="outline" className="text-[10px] capitalize">{decision.status}</Badge>
        <Badge variant="outline" className="text-[10px] capitalize">{decision.priority}</Badge>
        <Badge variant="outline" className="text-[10px] capitalize">{decision.category}</Badge>
      </div>
      {decision.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{decision.description}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5 italic">Ziehen zum Verschieben</p>
    </TooltipContent>
  </Tooltip>
));

DecisionPill.displayName = "DecisionPill";

export default DecisionPill;

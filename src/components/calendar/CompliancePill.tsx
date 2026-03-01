import { memo } from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CompliancePillProps {
  event: {
    id: string;
    title: string;
    framework: string;
    event_type: string;
    description?: string;
  };
}

const FRAMEWORK_LABELS: Record<string, string> = {
  nis2: "NIS2",
  gmp: "GMP",
  marisk: "MaRisk",
  iso9001: "ISO 9001",
  iatf16949: "IATF 16949",
};

const CompliancePill = memo(({ event }: CompliancePillProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-default",
            "bg-destructive/10 text-destructive border-2 border-destructive/40"
          )}
        >
          <Shield className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{event.title}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium text-xs">{event.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {FRAMEWORK_LABELS[event.framework] || event.framework} · Compliance-Pflicht
          </p>
          {event.description && (
            <p className="text-[10px] text-muted-foreground">{event.description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

CompliancePill.displayName = "CompliancePill";

export default CompliancePill;

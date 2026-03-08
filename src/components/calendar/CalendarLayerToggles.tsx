import { memo } from "react";
import { Layers, CalendarClock, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export interface CalendarLayers {
  deadlines: boolean;
  sla: boolean;
  compliance: boolean;
  approved: boolean;
}

export const DEFAULT_LAYERS: CalendarLayers = {
  deadlines: true,
  sla: true,
  compliance: true,
  approved: true,
};

interface CalendarLayerTogglesProps {
  layers: CalendarLayers;
  onChange: (layers: CalendarLayers) => void;
}

const LAYER_CONFIG: { key: keyof CalendarLayers; label: string; description: string; color: string; icon: typeof Layers }[] = [
  { key: "deadlines", label: "Entscheidungs-Deadlines", description: "Fälligkeitstermine aller offenen Entscheidungen", color: "bg-primary", icon: CalendarClock },
  { key: "sla", label: "SLA-Ablaufdaten", description: "SLA-Warnungen und Eskalationstermine", color: "bg-destructive", icon: AlertTriangle },
  { key: "compliance", label: "Compliance-Pflichttermine", description: "Audit-Fristen und regulatorische Termine", color: "bg-warning", icon: Shield },
  { key: "approved", label: "Genehmigte Entscheidungen", description: "Erfolge sichtbar machen — genehmigte & implementierte", color: "bg-success", icon: CheckCircle2 },
];

const CalendarLayerToggles = memo(({ layers, onChange }: CalendarLayerTogglesProps) => {
  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Layers className="w-3.5 h-3.5" />
          Layer
          {activeCount < 4 && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">{activeCount}/4</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-2">
        <p className="text-sm font-semibold mb-2">Kalender-Layer</p>
        {LAYER_CONFIG.map(({ key, label, description, color, icon: Icon }) => (
          <label
            key={key}
            className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
          >
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
              <Switch
                checked={layers[key]}
                onCheckedChange={(checked) => onChange({ ...layers, [key]: checked })}
                className="scale-75"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{description}</p>
            </div>
          </label>
        ))}
        <div className="pt-1 border-t border-border">
          <button
            onClick={() => onChange(DEFAULT_LAYERS)}
            className="text-[10px] text-primary hover:underline"
          >
            Alle Layer einblenden
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

CalendarLayerToggles.displayName = "CalendarLayerToggles";

export default CalendarLayerToggles;

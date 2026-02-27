import { AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { formatCost } from "@/lib/formatters";
import type { CostItem } from "./CostCalculationEngine";

interface Props {
  item: CostItem;
}

const CostItemPopover = ({ item: c }: Props) => {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer hover:bg-muted/20 rounded px-1 py-0.5 -mx-1 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${c.priority === "critical" ? "text-destructive" : c.priority === "high" ? "text-warning" : "text-muted-foreground"}`} />
            <span className="text-xs truncate">{c.title}</span>
          </div>
          <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCost(c.cost)}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="left">
        <p className="text-xs font-semibold mb-2">{c.title}</p>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <div className="flex justify-between"><span>{t("widgets.daysOpenLabel")}</span><span className="font-medium text-foreground">{c.days}d</span></div>
          <div className="flex justify-between"><span>{t("cod.hourlyRate", "Stundensatz")}</span><span className="font-medium text-foreground">{c.rate} €/h</span></div>
          <div className="flex justify-between"><span>{t("cod.persons", "Personen")}</span><span className="font-medium text-foreground">{c.persons}</span></div>
          <div className="flex justify-between"><span>{t("cod.overhead", "Overhead")}</span><span className="font-medium text-foreground">{c.overhead}x</span></div>
          <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-medium">Total</span><span className="font-bold text-destructive">{formatCost(c.cost)}</span></div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CostItemPopover;

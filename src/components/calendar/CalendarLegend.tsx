import { memo } from "react";
import { CheckSquare, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityColor, statusDot } from "./CalendarConstants";
import { useTranslation } from "react-i18next";

const CalendarLegend = memo(() => {
  const { t } = useTranslation();

  const PRIORITY_LABELS: Record<string, string> = {
    critical: t("cal.prioCritical"), high: t("cal.prioHigh"), medium: t("cal.prioMedium"), low: t("cal.prioLow"),
  };
  const STATUS_LABELS: Record<string, string> = {
    draft: t("cal.statusDraft"), proposed: t("cal.statusProposed"), review: t("cal.statusReview"),
    approved: t("cal.statusApproved"), rejected: t("cal.statusRejected"), implemented: t("cal.statusImplemented"), archived: t("cal.statusArchived"),
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="font-semibold">{t("cal.legendPriority")}</span>
      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn("w-3 h-2 rounded-sm", priorityColor[key])} />
          {label}
        </div>
      ))}
      <span className="ml-4 font-semibold">{t("cal.legendStatus")}</span>
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", statusDot[key])} />
          {label}
        </div>
      ))}
      <span className="ml-4 font-semibold flex items-center gap-1">
        <CheckSquare className="w-3 h-3" />
        {t("cal.legendTask")}
      </span>
      <span className="ml-4 font-semibold flex items-center gap-1">
        <DollarSign className="w-3 h-3 text-destructive" />
        {t("cal.legendCod", "CoD: Cost of Delay aktiv")}
      </span>
    </div>
  );
});

CalendarLegend.displayName = "CalendarLegend";

export default CalendarLegend;

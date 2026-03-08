import { useState, useEffect } from "react";
import { Shield, Users, AlertTriangle, DollarSign, Timer, Play, Pause, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  totalDecisions: number;
  criticalCount: number;
  totalRisk: number;
  participantCount: number;
  reviewedCount: number;
  riskReduction: number;
  openEscalations: number;
}

const DecisionRoomHeader = ({
  totalDecisions, criticalCount, totalRisk, participantCount,
  reviewedCount, riskReduction, openEscalations,
}: Props) => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = totalDecisions > 0 ? Math.round((reviewedCount / totalDecisions) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t("meeting.decisionRoom")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "dd. MMMM yyyy", { locale: dateFnsLocale })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              const subject = encodeURIComponent("Decision Room – " + format(new Date(), "dd.MM.yyyy"));
              window.open(`https://teams.microsoft.com/l/meeting/new?subject=${subject}`, "_blank");
              toast.success("Teams Meeting Link wird erstellt…");
            }}
          >
            <Video className="w-3.5 h-3.5" />
            Teams Meeting
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/60">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium">{formatTime(elapsed)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTimerActive(prev => !prev)}>
              {timerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t("meeting.participants")}</p>
            <p className="text-sm font-semibold">{participantCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t("meeting.decisionsLabel")}</p>
            <p className="text-sm font-semibold">{totalDecisions}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${criticalCount > 0 ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-border/60"}`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 ${criticalCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          <div>
            <p className="text-xs text-muted-foreground">{t("meeting.criticalLabel")}</p>
            <p className={`text-sm font-semibold ${criticalCount > 0 ? "text-destructive" : ""}`}>{criticalCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t("meeting.escalationsLabel")}</p>
            <p className="text-sm font-semibold">{openEscalations}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
          <DollarSign className="w-4 h-4 text-warning shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t("meeting.totalRisk")}</p>
            <p className="text-sm font-semibold">{totalRisk.toLocaleString()}€</p>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary">{t("meeting.progress")}</span>
          <span className="text-xs text-muted-foreground">
            {t("meeting.decisionsCleared", { done: reviewedCount, total: totalDecisions })}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {riskReduction > 0 && (
          <p className="text-xs text-success mt-1.5">
            {t("meeting.riskReduced", { cost: riskReduction.toLocaleString() })}
          </p>
        )}
      </div>
    </div>
  );
};

export default DecisionRoomHeader;

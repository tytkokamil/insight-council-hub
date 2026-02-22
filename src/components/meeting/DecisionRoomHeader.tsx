import { useState, useEffect } from "react";
import { Shield, Users, AlertTriangle, DollarSign, Timer, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Decision Room
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "dd. MMMM yyyy", { locale: de })}
          </p>
        </div>
        {/* Live Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono font-medium">{formatTime(elapsed)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setTimerActive(t => !t)}
            >
              {timerActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Teilnehmer</p>
            <p className="text-sm font-semibold">{participantCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Entscheidungen</p>
            <p className="text-sm font-semibold">{totalDecisions}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Kritisch</p>
            <p className="text-sm font-semibold text-destructive">{criticalCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Eskalationen</p>
            <p className="text-sm font-semibold">{openEscalations}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
          <DollarSign className="w-4 h-4 text-warning shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Gesamtrisiko</p>
            <p className="text-sm font-semibold">{totalRisk.toLocaleString("de-DE")}€</p>
          </div>
        </div>
      </div>

      {/* Decision Impact Meter */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary">Meeting-Fortschritt</span>
          <span className="text-xs text-muted-foreground">
            {reviewedCount}/{totalDecisions} Entscheidungen geklärt
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {riskReduction > 0 && (
          <p className="text-xs text-success mt-1.5">
            Risiko reduziert: −{riskReduction.toLocaleString("de-DE")}€
          </p>
        )}
      </div>
    </div>
  );
};

export default DecisionRoomHeader;

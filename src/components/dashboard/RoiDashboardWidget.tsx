import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Clock, DollarSign, Zap, CheckCircle2 } from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { differenceInDays, subDays } from "date-fns";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const RoiDashboardWidget = () => {
  const { data: allDecisions = [] } = useDecisions();
  const { data: allTasks = [] } = useTasks();
  const { selectedTeamId } = useTeamContext();
  const { user } = useAuth();

  const isPersonal = selectedTeamId === null;

  const roi = useMemo(() => {
    const now = new Date();
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id)
      : allDecisions;

    const last90 = subDays(now, 90);
    const prev90 = subDays(now, 180);

    // Current period (last 90 days)
    const currentImplemented = decisions.filter(d =>
      d.implemented_at && new Date(d.implemented_at) >= last90
    );
    const prevImplemented = decisions.filter(d =>
      d.implemented_at && new Date(d.implemented_at) >= prev90 && new Date(d.implemented_at) < last90
    );

    // Avg decision time
    const avgTimeCurrent = currentImplemented.length > 0
      ? Math.round(currentImplemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / currentImplemented.length)
      : null;
    const avgTimePrev = prevImplemented.length > 0
      ? Math.round(prevImplemented.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / prevImplemented.length)
      : null;

    const timeSaved = avgTimePrev && avgTimeCurrent ? avgTimePrev - avgTimeCurrent : 0;
    const timeSavedPercent = avgTimePrev && avgTimePrev > 0 ? Math.round((timeSaved / avgTimePrev) * 100) : 0;

    // Escalations
    const currentEscalations = decisions.filter(d =>
      (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= last90
    ).length;
    const prevEscalations = decisions.filter(d =>
      (d.escalation_level || 0) >= 1 && new Date(d.created_at) >= prev90 && new Date(d.created_at) < last90
    ).length;
    const escalationReduction = prevEscalations > 0 ? Math.round(((prevEscalations - currentEscalations) / prevEscalations) * 100) : 0;

    // Delay cost reduction
    const mult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const calcCost = (decs: typeof decisions) => decs.reduce((s, d) => {
      const days = Math.max(0, differenceInDays(new Date(d.implemented_at || now), new Date(d.created_at)));
      return s + Math.round(days * 2 * 75 * (mult[d.priority] || 1.5));
    }, 0);

    const currentCost = calcCost(currentImplemented);
    const prevCost = calcCost(prevImplemented);
    const costReduction = prevCost > 0 ? Math.round(((prevCost - currentCost) / prevCost) * 100) : 0;

    // Success rate (implemented vs rejected)
    const currentRejected = decisions.filter(d =>
      d.status === "rejected" && new Date(d.updated_at) >= last90
    ).length;
    const currentTotal = currentImplemented.length + currentRejected;
    const successRate = currentTotal > 0 ? Math.round((currentImplemented.length / currentTotal) * 100) : 0;

    const prevRejected = decisions.filter(d =>
      d.status === "rejected" && new Date(d.updated_at) >= prev90 && new Date(d.updated_at) < last90
    ).length;
    const prevTotal = prevImplemented.length + prevRejected;
    const prevSuccessRate = prevTotal > 0 ? Math.round((prevImplemented.length / prevTotal) * 100) : 0;
    const successDelta = successRate - prevSuccessRate;

    // Monthly bar data for comparison
    const months = Array.from({ length: 6 }, (_, i) => {
      const monthEnd = subDays(now, i * 30);
      const monthStart = subDays(monthEnd, 30);
      const impl = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= monthStart && new Date(d.implemented_at) < monthEnd).length;
      const avgT = (() => {
        const decs = decisions.filter(d => d.implemented_at && new Date(d.implemented_at) >= monthStart && new Date(d.implemented_at) < monthEnd);
        return decs.length > 0 ? Math.round(decs.reduce((s, d) => s + differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)), 0) / decs.length) : 0;
      })();
      return { month: `M-${i}`, implemented: impl, avgDays: avgT };
    }).reverse();

    return {
      avgTimeCurrent, avgTimePrev, timeSaved, timeSavedPercent,
      currentEscalations, prevEscalations, escalationReduction,
      currentCost, prevCost, costReduction,
      successRate, prevSuccessRate, successDelta,
      currentImplemented: currentImplemented.length,
      prevImplementedCount: prevImplemented.length,
      months,
      hasData: decisions.length >= 5,
    };
  }, [allDecisions, isPersonal, user]);

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;

  const TrendBadge = ({ value, suffix = "%", inverse = false }: { value: number; suffix?: string; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;
    return (
      <Badge variant="outline" className={`text-[10px] gap-0.5 ${isPositive ? "text-success border-success/30" : isNegative ? "text-destructive border-destructive/30" : "text-muted-foreground"}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {value > 0 ? "+" : ""}{value}{suffix}
      </Badge>
    );
  };

  if (!roi.hasData) {
    return (
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">ROI Dashboard</h2>
        <div className="border border-border rounded-lg p-8 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Mindestens 5 Entscheidungen benötigt für ROI-Analyse.</p>
        </div>
      </section>
    );
  }

  const chartTooltipStyle = { fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "none" };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ROI Dashboard</h2>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">Letzte 90 Tage vs. vorherige 90 Tage</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Time saved */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <TrendBadge value={roi.timeSavedPercent} />
            </div>
            <p className="text-2xl font-semibold tracking-tight">
              {roi.timeSaved > 0 ? `-${roi.timeSaved}d` : roi.timeSaved < 0 ? `+${Math.abs(roi.timeSaved)}d` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Zeitersparnis / Entscheidung</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
              <span>Vorher: {roi.avgTimePrev ?? "—"}d</span>
              <span>→</span>
              <span>Jetzt: {roi.avgTimeCurrent ?? "—"}d</span>
            </div>
          </CardContent>
        </Card>

        {/* Escalations reduced */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-4 h-4 text-warning" />
              <TrendBadge value={roi.escalationReduction} />
            </div>
            <p className="text-2xl font-semibold tracking-tight">
              {roi.currentEscalations}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Eskalationen (vorher: {roi.prevEscalations})</p>
          </CardContent>
        </Card>

        {/* Cost reduction */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-4 h-4 text-destructive" />
              <TrendBadge value={roi.costReduction} />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-destructive">
              {formatCost(roi.currentCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Verzögerungskosten (vorher: {formatCost(roi.prevCost)})</p>
          </CardContent>
        </Card>

        {/* Success rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <TrendBadge value={roi.successDelta} suffix="pp" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-success">{roi.successRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Erfolgsquote (vorher: {roi.prevSuccessRate}%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <div className="border border-border rounded-lg p-5">
        <div className="mb-4">
          <p className="text-sm font-medium">6-Monats Trend</p>
          <p className="text-xs text-muted-foreground">Implementierte Entscheidungen & Ø Bearbeitungszeit</p>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roi.months} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <RechartsTooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="implemented" name="Implementiert" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default RoiDashboardWidget;

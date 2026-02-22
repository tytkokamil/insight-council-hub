import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, DollarSign, TrendingDown, ShieldAlert, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  decisions: any[];
  escalated: any[];
  overdue: any[];
  teams: any[];
}

const PrimaryFocusBanner = ({ decisions, escalated, overdue, teams }: Props) => {
  const navigate = useNavigate();

  const signal = useMemo(() => {
    const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled", "superseded"].includes(d.status));
    const now = Date.now();

    // Calculate delay costs for critical/high priority overdue decisions
    const teamRateMap: Record<string, number> = {};
    teams.forEach((t: any) => { if (t.hourly_rate) teamRateMap[t.id] = t.hourly_rate; });

    let totalDelayCost = 0;
    overdue.forEach(d => {
      const daysOpen = (now - new Date(d.created_at).getTime()) / 86400000;
      const rate = d.team_id && teamRateMap[d.team_id] ? teamRateMap[d.team_id] : 75;
      const multiplier = d.priority === "critical" ? 4 : d.priority === "high" ? 2 : 1;
      totalDelayCost += Math.round(daysOpen * 2 * 2 * rate * multiplier);
    });

    const slaViolations = escalated.filter(d => (d.escalation_level || 0) >= 2).length;
    const criticalCount = active.filter(d => d.priority === "critical" && !["implemented", "rejected", "archived"].includes(d.status)).length;

    // Determine severity
    if (escalated.length >= 3 || slaViolations >= 2) {
      return {
        level: "critical" as const,
        message: `${escalated.length} kritische Entscheidungen gefährden ${totalDelayCost > 0 ? `${Math.round(totalDelayCost / 1000)}k€ Budget` : "Ihren Zeitplan"} – ${slaViolations} SLA-Verletzungen aktiv`,
        icon: ShieldAlert,
        action: "/engine",
        actionLabel: "Eskalationen öffnen",
      };
    }

    if (overdue.length >= 2) {
      return {
        level: "warning" as const,
        message: `${overdue.length} überfällige Entscheidungen – geschätzte Verzögerungskosten: ${totalDelayCost > 0 ? `${Math.round(totalDelayCost / 1000)}k€` : "steigend"}`,
        icon: AlertTriangle,
        action: "/decisions",
        actionLabel: "Überfällige anzeigen",
      };
    }

    // Check momentum decline (simple heuristic: more created than completed recently)
    const thirtyDaysAgo = now - 30 * 86400000;
    const recentCreated = decisions.filter(d => new Date(d.created_at).getTime() > thirtyDaysAgo).length;
    const recentCompleted = decisions.filter(d => d.implemented_at && new Date(d.implemented_at).getTime() > thirtyDaysAgo).length;
    if (recentCreated > 0 && recentCompleted < recentCreated * 0.4) {
      return {
        level: "info" as const,
        message: `Momentum sinkt – ${recentCreated} neue vs. ${recentCompleted} abgeschlossene Entscheidungen in 30 Tagen`,
        icon: TrendingDown,
        action: "/analytics",
        actionLabel: "Analyse öffnen",
      };
    }

    return null;
  }, [decisions, escalated, overdue, teams]);

  if (!signal) return null;

  const styles = {
    critical: {
      bg: "bg-destructive/[0.06]",
      border: "border-destructive/25",
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      textColor: "text-destructive",
      pulse: true,
    },
    warning: {
      bg: "bg-warning/[0.06]",
      border: "border-warning/25",
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
      textColor: "text-warning",
      pulse: false,
    },
    info: {
      bg: "bg-primary/[0.04]",
      border: "border-primary/20",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      textColor: "text-primary",
      pulse: false,
    },
  }[signal.level];

  const Icon = signal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 flex items-center gap-3`}
    >
      <div className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 ${styles.pulse ? "animate-pulse" : ""}`}>
        <Icon className={`w-4.5 h-4.5 ${styles.iconColor}`} />
      </div>
      <p className={`text-sm font-medium flex-1 ${styles.textColor}`}>
        {signal.message}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className={`shrink-0 text-xs ${styles.textColor} hover:${styles.textColor}`}
        onClick={() => navigate(signal.action)}
      >
        {signal.actionLabel} <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </motion.div>
  );
};

export default PrimaryFocusBanner;

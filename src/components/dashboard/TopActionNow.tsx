import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, Eye, Link2, ArrowRight,
  CheckCircle2, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TopAction {
  urgency: "critical" | "warning" | "info" | "success";
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  path: string;
  actionLabel: string;
}

interface Props {
  overdue: any[];
  escalated: any[];
  pendingReviews: any[];
  blockedTasks: any[];
}

const TopActionNow = ({ overdue, escalated, pendingReviews, blockedTasks }: Props) => {
  const navigate = useNavigate();

  const action = useMemo<TopAction | null>(() => {
    if (escalated.length > 0) {
      const maxLevel = Math.max(...escalated.map(d => d.escalation_level || 0));
      if (maxLevel >= 2) {
        return {
          urgency: "critical",
          icon: ShieldAlert,
          title: `${escalated.length} Eskalation${escalated.length > 1 ? "en" : ""} erfordern Aktion`,
          description: `Höchste Stufe: L${maxLevel} – "${escalated[0]?.title?.slice(0, 60)}"`,
          path: "/governance",
          actionLabel: "Eskalation lösen",
        };
      }
    }

    if (overdue.length > 0) {
      const critical = overdue.filter(d => d.priority === "critical" || d.priority === "high");
      const target = critical[0] || overdue[0];
      return {
        urgency: "warning",
        icon: Clock,
        title: `${overdue.length} überfällige Entscheidung${overdue.length > 1 ? "en" : ""}`,
        description: `Dringendste: "${target?.title?.slice(0, 60)}"`,
        path: `/decisions/${target?.id}`,
        actionLabel: "Jetzt entscheiden",
      };
    }

    if (pendingReviews.length > 0) {
      return {
        urgency: "info",
        icon: Eye,
        title: `${pendingReviews.length} Review${pendingReviews.length > 1 ? "s" : ""} warten auf dich`,
        description: "Offene Reviews verzögern Entscheidungen im Team.",
        path: pendingReviews[0]?.decision_id ? `/decisions/${pendingReviews[0].decision_id}` : "/decisions",
        actionLabel: "Review starten",
      };
    }

    if (blockedTasks.length > 0) {
      return {
        urgency: "info",
        icon: Link2,
        title: `${blockedTasks.length} Aufgabe${blockedTasks.length > 1 ? "n" : ""} blockiert`,
        description: "Abhängige Entscheidungen verhindern den Fortschritt.",
        path: "/tasks",
        actionLabel: "Blockaden lösen",
      };
    }

    return null;
  }, [overdue, escalated, pendingReviews, blockedTasks]);

  // All clear — calm, minimal
  if (!action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="cmd-card p-8 flex items-center gap-5"
      >
        <div className="w-12 h-12 rounded-2xl bg-success/8 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6 text-success" />
        </div>
        <div>
          <p className="system-status text-success mb-1">System Status: Stable</p>
          <p className="text-sm text-muted-foreground">Keine offenen Eskalationen, Reviews oder überfällige Entscheidungen.</p>
        </div>
      </motion.div>
    );
  }

  const styles = {
    critical: {
      border: "border-destructive/15",
      iconBg: "bg-destructive/8",
      iconColor: "text-destructive",
      statusLabel: "Attention Required",
      statusColor: "text-destructive",
    },
    warning: {
      border: "border-warning/15",
      iconBg: "bg-warning/8",
      iconColor: "text-warning",
      statusLabel: "Attention Required",
      statusColor: "text-warning",
    },
    info: {
      border: "border-primary/10",
      iconBg: "bg-primary/8",
      iconColor: "text-primary",
      statusLabel: "Action Needed",
      statusColor: "text-primary",
    },
    success: {
      border: "border-success/15",
      iconBg: "bg-success/8",
      iconColor: "text-success",
      statusLabel: "Stable",
      statusColor: "text-success",
    },
  }[action.urgency];

  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`cmd-card ${styles.border} p-8 flex items-center gap-5`}
    >
      <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${styles.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`system-status ${styles.statusColor} mb-1.5`}>
          {styles.statusLabel}
        </p>
        <p className="text-base font-semibold tracking-tight mb-0.5">{action.title}</p>
        <p className="text-sm text-muted-foreground">{action.description}</p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-2 rounded-xl px-5 h-10 press-scale"
        onClick={() => navigate(action.path)}
      >
        {action.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
};

export default TopActionNow;

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, Eye, Link2, ArrowRight,
  CheckCircle2, ShieldAlert, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const action = useMemo<TopAction | null>(() => {
    // Priority 1: Critical escalations
    if (escalated.length > 0) {
      const maxLevel = Math.max(...escalated.map(d => d.escalation_level || 0));
      if (maxLevel >= 2) {
        return {
          urgency: "critical",
          icon: ShieldAlert,
          title: `${escalated.length} Eskalation${escalated.length > 1 ? "en" : ""} erfordern sofortige Aktion`,
          description: `Höchste Stufe: L${maxLevel} – "${escalated[0]?.title?.slice(0, 50)}..."`,
          path: "/engine",
          actionLabel: "Eskalation lösen",
        };
      }
    }

    // Priority 2: Overdue decisions
    if (overdue.length > 0) {
      const critical = overdue.filter(d => d.priority === "critical" || d.priority === "high");
      const target = critical[0] || overdue[0];
      return {
        urgency: "warning",
        icon: Clock,
        title: `${overdue.length} überfällige Entscheidung${overdue.length > 1 ? "en" : ""}`,
        description: `Dringendste: "${target?.title?.slice(0, 50)}..."`,
        path: `/decisions/${target?.id}`,
        actionLabel: "Jetzt entscheiden",
      };
    }

    // Priority 3: Pending reviews
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

    // Priority 4: Blocked tasks
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

    // All clear
    return null;
  }, [overdue, escalated, pendingReviews, blockedTasks]);

  if (!action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-success/20 bg-success/[0.04] p-5 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-sm font-semibold text-success">Alles auf Kurs</p>
          <p className="text-xs text-muted-foreground">Keine offenen Eskalationen, Reviews oder überfällige Entscheidungen.</p>
        </div>
      </motion.div>
    );
  }

  const styles = {
    critical: {
      border: "border-destructive/25",
      bg: "bg-destructive/[0.05]",
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
      titleColor: "text-destructive",
      pulse: true,
    },
    warning: {
      border: "border-warning/25",
      bg: "bg-warning/[0.05]",
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
      titleColor: "text-warning",
      pulse: false,
    },
    info: {
      border: "border-primary/20",
      bg: "bg-primary/[0.04]",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      titleColor: "text-foreground",
      pulse: false,
    },
    success: {
      border: "border-success/20",
      bg: "bg-success/[0.04]",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      titleColor: "text-success",
      pulse: false,
    },
  }[action.urgency];

  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border ${styles.border} ${styles.bg} p-5 flex items-center gap-4`}
    >
      <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0 ${styles.pulse ? "animate-pulse" : ""}`}>
        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            👉 Top Action Now
          </span>
        </div>
        <p className={`text-sm font-semibold ${styles.titleColor}`}>{action.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => navigate(action.path)}
      >
        {action.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
};

export default TopActionNow;

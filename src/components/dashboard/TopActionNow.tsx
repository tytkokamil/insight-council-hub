import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, Eye, Link2, ArrowRight,
  CheckCircle2, ShieldAlert, Zap, Plus, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PredictiveSlaEntry } from "@/components/decisions/PredictiveSlaWarning";

interface TopAction {
  urgency: "critical" | "warning" | "info" | "success" | "predictive";
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
  hasData?: boolean;
  slaPredictions?: PredictiveSlaEntry[];
}

const TopActionNow = ({ overdue, escalated, pendingReviews, blockedTasks, hasData = true, slaPredictions = [] }: Props) => {
  const [seedingDemo, setSeedingDemo] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const actions = useMemo<TopAction[]>(() => {
    const items: TopAction[] = [];

    if (escalated.length > 0) {
      const maxLevel = Math.max(...escalated.map(d => d.escalation_level || 0));
      if (maxLevel >= 2) {
        items.push({
          urgency: "critical",
          icon: ShieldAlert,
          title: t("widgets.escalationsNeedAction", { count: escalated.length }),
          description: t("widgets.highestLevel", { level: maxLevel, title: escalated[0]?.title?.slice(0, 50) }),
          path: "/engine",
          actionLabel: t("widgets.resolveEscalation"),
        });
      }
    }

    if (overdue.length > 0) {
      const critical = overdue.filter(d => d.priority === "critical" || d.priority === "high");
      const target = critical[0] || overdue[0];
      items.push({
        urgency: "warning",
        icon: Clock,
        title: t("widgets.overdueDecisions", { count: overdue.length }),
        description: t("widgets.mostUrgent", { title: target?.title?.slice(0, 50) }),
        path: `/decisions/${target?.id}`,
        actionLabel: t("widgets.decideNow"),
      });
    }

    // Predictive SLA warnings — orange, between overdue and reviews
    if (slaPredictions.length > 0) {
      const minDays = Math.min(...slaPredictions.map(p => p.remaining_days));
      const maxDays = Math.max(...slaPredictions.map(p => p.remaining_days));
      const range = minDays === maxDays ? `${minDays}` : `${minDays}–${maxDays}`;
      items.push({
        urgency: "predictive",
        icon: Clock,
        title: t("predictiveSla.topActionTitle", {
          count: slaPredictions.length,
          defaultValue: `⏰ ${slaPredictions.length} Entscheidungen drohen SLA zu verletzen`,
        }),
        description: t("predictiveSla.topActionDesc", {
          range,
          defaultValue: `— in ${range} Tagen`,
        }),
        path: "/process",
        actionLabel: t("predictiveSla.topActionCta", { defaultValue: "Prüfen" }),
      });
    }

    if (pendingReviews.length > 0) {
      items.push({
        urgency: "info",
        icon: Eye,
        title: t("widgets.reviewsWaiting", { count: pendingReviews.length }),
        description: t("widgets.reviewsDelay"),
        path: pendingReviews[0]?.decision_id ? `/decisions/${pendingReviews[0].decision_id}` : "/decisions",
        actionLabel: t("widgets.startReview"),
      });
    }

    if (blockedTasks.length > 0) {
      items.push({
        urgency: "info",
        icon: Link2,
        title: t("widgets.tasksBlocked", { count: blockedTasks.length }),
        description: t("widgets.blockedDesc"),
        path: "/tasks",
        actionLabel: t("widgets.resolveBlocks"),
      });
    }

    return items;
  }, [overdue, escalated, pendingReviews, blockedTasks, slaPredictions, t]);

  const action = actions[0] || null;

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    toast.info(t("decisions.demoCreating", { defaultValue: "Beispieldaten werden erstellt…" }));
    const { data, error } = await supabase.functions.invoke("seed-demo-data");
    setSeedingDemo(false);
    if (error || data?.error) { toast.error(data?.error || t("settings.error")); return; }
    toast.success(t("decisions.demoCreated", { defaultValue: "Beispieldaten erstellt!" }));
    window.location.reload();
  };

  if (!action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border ${hasData ? "border-success/20 bg-success/[0.04]" : "border-border bg-muted/30"} p-5`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${hasData ? "bg-success/10" : "bg-muted"} flex items-center justify-center shrink-0`}>
            <CheckCircle2 className={`w-5 h-5 ${hasData ? "text-success" : "text-muted-foreground/50"}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${hasData ? "text-success" : "text-muted-foreground"}`}>
              {hasData ? t("widgets.allOnTrack") : t("widgets.noDataYet", { defaultValue: "Noch keine Daten" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasData ? t("widgets.noOpenItems") : t("widgets.noDataYetDesc", { defaultValue: "Erstelle deine erste Entscheidung, um das Dashboard mit Daten zu füllen." })}
            </p>
          </div>
        </div>

        {!hasData && (
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pl-14">
            <Button size="sm" className="gap-1.5" onClick={() => navigate("/decisions")}>
              <Plus className="w-3.5 h-3.5" />
              {t("widgets.firstDecision", { defaultValue: "Erste Entscheidung anlegen" })}
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">{t("common.or", { defaultValue: "oder" })}</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleSeedDemo}
              disabled={seedingDemo}
            >
              {seedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {t("decisions.loadDemo", { defaultValue: "Beispieldaten laden" })}
            </Button>
          </div>
        )}
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
    predictive: {
      border: "border-warning/25",
      bg: "bg-warning/[0.05]",
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
      titleColor: "text-warning",
      pulse: false,
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
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border ${styles.border} ${styles.bg} p-5 flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => navigate(action.path)}
    >
      <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0 ${styles.pulse ? "animate-pulse" : ""}`}>
        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("widgets.topActionNow")}
          </span>
        </div>
        <p className={`text-sm font-semibold ${styles.titleColor}`}>{action.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={(e) => { e.stopPropagation(); navigate(action.path); }}
      >
        {action.actionLabel} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </motion.div>
  );
};

export default TopActionNow;

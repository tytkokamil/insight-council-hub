import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3, FileText, Users, TrendingUp, Settings, GitBranch, Radar, Dna,
  Zap, Trophy, FlaskConical, Target, Calendar, Crosshair, Shield, Sun, Brain,
  Plus, ListTodo, Clock, UserPlus, Moon, Bell, Globe, Check, MessageSquare,
  AlertTriangle, ArrowUp, Eye,
} from "lucide-react";
import { useDecisions, useReviews, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { useTheme } from "@/hooks/useTheme";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CommandAction } from "./types";

interface UseCommandActionsProps {
  close: () => void;
  trackAction: (label: string, path?: string) => void;
  setShowNewDecision: (v: boolean) => void;
}

export const useCommandActions = ({ close, trackAction, setShowNewDecision }: UseCommandActionsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { data: decisions = [] } = useDecisions();
  const { data: reviews = [] } = useReviews();
  const { data: teams = [] } = useTeams();
  const { data: tasks = [] } = useTasks();
  const { data: risks = [] } = useRisks();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();
  const { user } = useAuth();

  const go = (path: string, label: string) => {
    close();
    trackAction(label, path);
    // Store recent paths
    try {
      const paths = JSON.parse(localStorage.getItem("cmd-recent") || "[]");
      const updated = [path, ...paths.filter((p: string) => p !== path)].slice(0, 5);
      localStorage.setItem("cmd-recent", JSON.stringify(updated));
    } catch {}
    navigate(path);
  };

  // My open reviews
  const myOpenReviews = useMemo(() => {
    if (!user) return [];
    return reviews.filter(r => r.reviewer_id === user.id && !r.reviewed_at);
  }, [reviews, user]);

  // Context-aware actions based on current route
  const contextActions = useMemo<CommandAction[]>(() => {
    const match = location.pathname.match(/^\/decisions\/([a-f0-9-]+)$/);
    if (!match) return [];
    const decId = match[1];
    const dec = decisions.find(d => d.id === decId);
    if (!dec) return [];

    const actions: CommandAction[] = [];

    if (dec.status !== "approved" && dec.status !== "implemented") {
      actions.push({
        id: "ctx-approve",
        label: `"${dec.title}" genehmigen`,
        icon: Check,
        group: "context",
        color: "text-green-500",
        onSelect: async () => {
          const { error } = await supabase.from("decisions").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", decId);
          if (error) { toast.error("Fehler"); } else { toast.success("Genehmigt!"); }
          close();
          trackAction(`"${dec.title}" genehmigt`);
        },
      });
    }

    actions.push({
      id: "ctx-priority-critical",
      label: `Priorität auf Critical setzen`,
      icon: ArrowUp,
      group: "context",
      color: "text-destructive",
      onSelect: async () => {
        await supabase.from("decisions").update({ priority: "critical", updated_at: new Date().toISOString() }).eq("id", decId);
        toast.success("Priorität → Critical");
        close();
        trackAction("Priorität geändert");
      },
    });

    actions.push({
      id: "ctx-comment",
      label: "Kommentar hinzufügen",
      icon: MessageSquare,
      group: "context",
      color: "text-primary",
      onSelect: () => { go(`/decisions/${decId}?tab=discussion`, "Kommentar hinzufügen"); },
    });

    return actions;
  }, [location.pathname, decisions, user]);

  // Navigation actions
  const navigationActions = useMemo<CommandAction[]>(() => {
    const pages = [
      { label: "Executive", path: "/executive", icon: Target },
      { label: t("nav.dashboard"), path: "/dashboard", icon: BarChart3, shortcut: "D" },
      { label: t("nav.decisions"), path: "/decisions", icon: FileText },
      { label: "Briefing", path: "/briefing", icon: Sun },
      { label: "Graph", path: "/decision-graph", icon: GitBranch },
      { label: t("nav.analyticsHub"), path: "/analytics", icon: TrendingUp },
      { label: "DNA", path: "/analytics/decision-dna", icon: Dna },
      { label: "Bottlenecks", path: "/analytics/bottleneck-intelligence", icon: Radar },
      { label: t("nav.benchmarking"), path: "/analytics/decision-benchmarking", icon: Trophy },
      { label: t("nav.scenarios"), path: "/analytics/scenario-engine", icon: FlaskConical },
      { label: t("nav.strategy"), path: "/strategy", icon: Crosshair },
      { label: t("nav.teamsNav"), path: "/teams", icon: Users },
      { label: t("nav.calendar"), path: "/calendar", icon: Calendar },
      { label: t("nav.tasks"), path: "/tasks", icon: ListTodo },
      { label: t("nav.settings"), path: "/settings", icon: Settings },
      { label: t("nav.users"), path: "/admin/users", icon: Shield },
      { label: t("nav.escalationCenter"), path: "/engine", icon: Zap },
    ];
    return pages.map(p => ({
      id: `nav-${p.path}`,
      label: p.label,
      icon: p.icon,
      group: "navigation" as const,
      shortcut: p.shortcut,
      color: "text-blue-500",
      onSelect: () => go(p.path, p.label),
    }));
  }, [t]);

  // Decision actions
  const decisionActions = useMemo<CommandAction[]>(() => [
    {
      id: "act-new-decision",
      label: t("cmd.newDecision"),
      icon: Plus,
      group: "decisions",
      shortcut: "N",
      color: "text-emerald-500",
      onSelect: () => {
        close();
        setShowNewDecision(true);
        trackAction(t("cmd.newDecision"));
      },
    },
    {
      id: "act-new-task",
      label: t("cmd.newTask"),
      icon: ListTodo,
      group: "decisions",
      shortcut: "T",
      color: "text-emerald-500",
      onSelect: () => { go("/tasks?new=true", t("cmd.newTask")); },
    },
  ], [t]);

  // Review actions
  const reviewActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [{
      id: "act-my-reviews",
      label: `Meine offenen Reviews (${myOpenReviews.length})`,
      icon: Eye,
      group: "reviews",
      color: "text-orange-500",
      keywords: "review genehmigen approval",
      onSelect: () => { go("/decisions?filter=my-reviews", "Meine offenen Reviews"); },
    }];

    // Quick-approve actions for each open review
    myOpenReviews.slice(0, 5).forEach(r => {
      const dec = decisions.find(d => d.id === r.decision_id);
      if (dec) {
        actions.push({
          id: `review-approve-${r.id}`,
          label: `"${dec.title}" genehmigen`,
          icon: Check,
          group: "reviews",
          color: "text-orange-500",
          keywords: `review ${dec.title}`,
          onSelect: async () => {
            await supabase.from("decision_reviews").update({ status: "approved", reviewed_at: new Date().toISOString(), feedback: "Über Command Palette genehmigt" }).eq("id", r.id);
            toast.success(`"${dec.title}" genehmigt`);
            close();
            trackAction(`"${dec.title}" genehmigt`);
          },
        });
      }
    });

    return actions;
  }, [myOpenReviews, decisions]);

  // Team actions
  const teamActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [{
      id: "act-invite-team",
      label: t("cmd.inviteTeam"),
      icon: UserPlus,
      group: "team",
      color: "text-violet-500",
      onSelect: () => { go("/teams?invite=true", t("cmd.inviteTeam")); },
    }];

    // Team switching
    if (teams.length > 0) {
      actions.push({
        id: "team-personal",
        label: `Persönlich${!selectedTeamId ? " ✓" : ""}`,
        icon: Users,
        group: "team",
        color: "text-violet-500",
        onSelect: () => { setSelectedTeamId(null); close(); trackAction("Team → Persönlich"); },
      });
      teams.forEach(tm => {
        actions.push({
          id: `team-switch-${tm.id}`,
          label: `${tm.name}${selectedTeamId === tm.id ? " ✓" : ""}`,
          icon: Users,
          group: "team",
          color: "text-violet-500",
          keywords: `team wechseln ${tm.name}`,
          onSelect: () => { setSelectedTeamId(tm.id); close(); trackAction(`Team → ${tm.name}`); },
        });
      });
    }

    return actions;
  }, [t, teams, selectedTeamId]);

  // Settings actions
  const settingsActions = useMemo<CommandAction[]>(() => [
    {
      id: "act-toggle-theme",
      label: theme === "dark" ? "Light Mode aktivieren" : "Dark Mode aktivieren",
      icon: theme === "dark" ? Sun : Moon,
      group: "settings",
      shortcut: "⇧D",
      color: "text-muted-foreground",
      onSelect: () => { toggleTheme(); close(); trackAction("Theme umgeschaltet"); },
    },
    {
      id: "act-notifications",
      label: "Notifications konfigurieren",
      icon: Bell,
      group: "settings",
      color: "text-muted-foreground",
      onSelect: () => { go("/settings?tab=notifications", "Notifications konfigurieren"); },
    },
    {
      id: "act-language",
      label: i18n.language === "de" ? "Switch to English" : "Auf Deutsch wechseln",
      icon: Globe,
      group: "settings",
      color: "text-muted-foreground",
      onSelect: () => {
        const newLang = i18n.language === "de" ? "en" : "de";
        i18n.changeLanguage(newLang);
        close();
        trackAction("Sprache gewechselt");
      },
    },
  ], [theme, i18n.language]);

  // Decision search items
  const decisionItems = useMemo<CommandAction[]>(() => {
    return decisions.slice(0, 15).map(d => ({
      id: `dec-${d.id}`,
      label: d.title,
      icon: FileText,
      group: "decisions" as const,
      keywords: `decision ${d.title} ${d.category} ${d.status}`,
      onSelect: () => { go(`/decisions/${d.id}`, d.title); },
    }));
  }, [decisions]);

  // Task search items
  const taskItems = useMemo<CommandAction[]>(() => {
    return tasks.filter(tk => tk.status !== "done").slice(0, 10).map(tk => ({
      id: `task-${tk.id}`,
      label: tk.title,
      icon: ListTodo,
      group: "decisions" as const,
      keywords: `task ${tk.title} ${tk.status}`,
      onSelect: () => { go("/tasks", tk.title); },
    }));
  }, [tasks]);

  // Risk search items
  const riskItems = useMemo<CommandAction[]>(() => {
    return risks.slice(0, 10).map(r => ({
      id: `risk-${r.id}`,
      label: r.title,
      icon: AlertTriangle,
      group: "decisions" as const,
      keywords: `risk ${r.title} ${r.status}`,
      color: "text-destructive",
      onSelect: () => { go("/risks", r.title); },
    }));
  }, [risks]);

  return {
    contextActions,
    navigationActions,
    decisionActions,
    reviewActions,
    teamActions,
    settingsActions,
    decisionItems,
    taskItems,
    riskItems,
    decisions,
    tasks,
    risks,
  };
};

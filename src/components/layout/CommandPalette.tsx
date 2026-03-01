import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, Dna, Zap, Trophy, FlaskConical, Target, Calendar, Crosshair, Shield, Sun, Brain,
  Plus, ListTodo, Clock, AlertTriangle, UserPlus,
} from "lucide-react";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useRisks } from "@/hooks/useRisks";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslation } from "react-i18next";

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: decisions = [] } = useDecisions();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: risks = [] } = useRisks();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();
  const { t } = useTranslation();

  const pages = useMemo(() => [
    { label: "Executive", path: "/executive", icon: Target },
    { label: t("nav.dashboard"), path: "/dashboard", icon: BarChart3 },
    { label: t("nav.decisions"), path: "/decisions", icon: FileText },
    { label: "Briefing", path: "/briefing", icon: Sun },
    { label: "Graph", path: "/graph", icon: GitBranch },
    { label: "Bottlenecks", path: "/bottlenecks", icon: Radar },
    { label: t("nav.analyticsHub"), path: "/analytics", icon: TrendingUp },
    { label: "DNA", path: "/dna", icon: Dna },
    { label: t("nav.escalationCenter"), path: "/engine", icon: Zap },
    { label: t("nav.benchmarking"), path: "/benchmarking", icon: Trophy },
    { label: t("nav.scenarios"), path: "/scenarios", icon: FlaskConical },
    { label: t("nav.strategy"), path: "/strategy", icon: Crosshair },
    { label: t("nav.teamsNav"), path: "/teams", icon: Users },
    { label: t("nav.calendar"), path: "/calendar", icon: Calendar },
    { label: t("nav.tasks"), path: "/tasks", icon: ListTodo },
    { label: t("nav.settings"), path: "/settings", icon: Settings },
    { label: t("nav.users"), path: "/admin/users", icon: Shield },
  ], [t]);

  const quickActions = useMemo(() => [
    { label: t("cmd.newDecision"), path: "/decisions?new=true", icon: Plus, shortcut: "N" },
    { label: t("cmd.newTask"), path: "/tasks?new=true", icon: ListTodo, shortcut: "T" },
    { label: t("cmd.inviteTeam"), path: "/teams?invite=true", icon: UserPlus },
    { label: t("cmd.openDashboard"), path: "/dashboard", icon: BarChart3, shortcut: "D" },
    { label: t("cmd.openEscalation"), path: "/engine", icon: Zap },
    { label: t("cmd.openAnalytics"), path: "/analytics", icon: TrendingUp },
  ], [t]);

  const [recentPaths, setRecentPaths] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cmd-recent") || "[]");
    } catch { return []; }
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    const updated = [path, ...recentPaths.filter(p => p !== path)].slice(0, 5);
    setRecentPaths(updated);
    localStorage.setItem("cmd-recent", JSON.stringify(updated));
    navigate(path);
  };

  const recentPages = useMemo(() => {
    return recentPaths
      .map(p => pages.find(pg => pg.path === p))
      .filter(Boolean)
      .slice(0, 5) as typeof pages;
  }, [recentPaths, pages]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("cmd.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("cmd.noResults")}</CommandEmpty>

        <CommandGroup heading={t("cmd.quickActions")}>
          {quickActions.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.path)} className="gap-2.5">
              <a.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1">{a.label}</span>
              {a.shortcut && (
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground font-mono">
                  {a.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {recentPages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.recentlyVisited")}>
              {recentPages.map((p) => (
                <CommandItem key={`recent-${p.path}`} onSelect={() => go(p.path)} className="gap-2.5">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{p.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {teams.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.switchTeam")}>
              <CommandItem
                onSelect={() => { setSelectedTeamId(null); setOpen(false); }}
                className="gap-2.5"
              >
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{t("cmd.personal")}</span>
                {!selectedTeamId && <span className="text-[10px] text-primary ml-auto">{t("cmd.active")}</span>}
              </CommandItem>
              {teams.map((tm) => (
                <CommandItem
                  key={tm.id}
                  onSelect={() => { setSelectedTeamId(tm.id); setOpen(false); }}
                  className="gap-2.5"
                >
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{tm.name}</span>
                  {selectedTeamId === tm.id && <span className="text-[10px] text-primary ml-auto">{t("cmd.active")}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading={t("cmd.pages")}>
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2.5">
              <p.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {decisions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.decisions")}>
              {decisions.slice(0, 15).map((d) => (
                <CommandItem
                  key={d.id}
                  value={`decision ${d.title} ${d.category} ${d.status}`}
                  onSelect={() => go(`/decisions/${d.id}`)}
                  className="gap-2.5"
                >
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{d.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{d.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.tasks")}>
              {tasks.filter(tk => tk.status !== "done").slice(0, 10).map((tk) => (
                <CommandItem
                  key={tk.id}
                  value={`task ${tk.title} ${tk.status}`}
                  onSelect={() => go("/tasks")}
                  className="gap-2.5"
                >
                  <ListTodo className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{tk.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{tk.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {risks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.risks")}>
              {risks.slice(0, 10).map((r) => (
                <CommandItem
                  key={r.id}
                  value={`risk ${r.title} ${r.status}`}
                  onSelect={() => go("/risks")}
                  className="gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{r.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{r.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;

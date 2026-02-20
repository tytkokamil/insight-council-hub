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
  GitBranch, Radar, DollarSign, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Calendar, Crosshair, Shield, Sun, LayoutDashboard, Brain,
  Plus, ListTodo, Search, Clock, ArrowRight,
} from "lucide-react";
import { useDecisions, useTeams } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useTeamContext } from "@/hooks/useTeamContext";

const pages = [
  { label: "Executive", path: "/executive", icon: Target },
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "Entscheidungen", path: "/decisions", icon: FileText },
  { label: "Briefing", path: "/briefing", icon: Sun },
  { label: "Graph", path: "/graph", icon: GitBranch },
  { label: "Bottlenecks", path: "/bottlenecks", icon: Radar },
  { label: "Kosten", path: "/costs", icon: DollarSign },
  { label: "Friction", path: "/friction", icon: Flame },
  { label: "Health", path: "/health", icon: Activity },
  { label: "Analytics", path: "/analytics", icon: TrendingUp },
  { label: "DNA", path: "/dna", icon: Dna },
  { label: "Engine", path: "/engine", icon: Zap },
  { label: "Benchmark", path: "/benchmarking", icon: Trophy },
  { label: "Szenarien", path: "/scenarios", icon: FlaskConical },
  { label: "Timeline", path: "/timeline", icon: Calendar },
  { label: "Strategie", path: "/strategy", icon: Crosshair },
  { label: "War Room", path: "/warroom", icon: Shield },
  { label: "Patterns", path: "/patterns", icon: Brain },
  { label: "Teams", path: "/teams", icon: Users },
  { label: "Kalender", path: "/calendar", icon: Calendar },
  { label: "Aufgaben", path: "/tasks", icon: ListTodo },
  { label: "Einstellungen", path: "/settings", icon: Settings },
  { label: "Admin", path: "/admin/users", icon: Shield },
];

const quickActions = [
  { label: "Neue Entscheidung erstellen", path: "/decisions?new=true", icon: Plus, shortcut: "N" },
  { label: "Neue Aufgabe erstellen", path: "/tasks?new=true", icon: ListTodo, shortcut: "T" },
  { label: "Escalation Center öffnen", path: "/engine", icon: Zap },
  { label: "Analytics öffnen", path: "/analytics", icon: TrendingUp },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: decisions = [] } = useDecisions();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();

  // Track recent navigations
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
    // Track recent
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
  }, [recentPaths]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Suche nach Seiten, Entscheidungen, Aufgaben oder Teams..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Schnellaktionen">
          {quickActions.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.path)} className="gap-2.5">
              <a.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1">{a.label}</span>
              {a.shortcut && (
                <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-mono">
                  {a.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Recent */}
        {recentPages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Zuletzt besucht">
              {recentPages.map((p) => (
                <CommandItem key={`recent-${p.path}`} onSelect={() => go(p.path)} className="gap-2.5">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{p.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Team Switch */}
        {teams.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Team wechseln">
              <CommandItem
                onSelect={() => { setSelectedTeamId(null); setOpen(false); }}
                className="gap-2.5"
              >
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Persönlich</span>
                {!selectedTeamId && <span className="text-[10px] text-primary ml-auto">aktiv</span>}
              </CommandItem>
              {teams.map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() => { setSelectedTeamId(t.id); setOpen(false); }}
                  className="gap-2.5"
                >
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{t.name}</span>
                  {selectedTeamId === t.id && <span className="text-[10px] text-primary ml-auto">aktiv</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Pages */}
        <CommandGroup heading="Seiten">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2.5">
              <p.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Decisions */}
        {decisions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Entscheidungen">
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

        {/* Tasks */}
        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Aufgaben">
              {tasks.filter(t => t.status !== "done").slice(0, 10).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`task ${t.title} ${t.status}`}
                  onSelect={() => go("/tasks")}
                  className="gap-2.5"
                >
                  <ListTodo className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">{t.status}</span>
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

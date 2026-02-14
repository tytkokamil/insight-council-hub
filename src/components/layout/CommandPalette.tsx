import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, DollarSign, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Calendar, Crosshair, Shield, Sun, LayoutDashboard,
} from "lucide-react";
import { useDecisions } from "@/hooks/useDecisions";

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
  { label: "Teams", path: "/teams", icon: Users },
  { label: "Einstellungen", path: "/settings", icon: Settings },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: decisions = [] } = useDecisions();

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
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Suche nach Seiten oder Entscheidungen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
        <CommandGroup heading="Seiten">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-2.5">
              <p.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {decisions.length > 0 && (
          <CommandGroup heading="Entscheidungen">
            {decisions.slice(0, 20).map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.title} ${d.category} ${d.status}`}
                onSelect={() => go(`/decisions`)}
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
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;

import { memo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, DollarSign, Shield, Calendar, CalendarDays, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Sun, LayoutDashboard, UserCog, History, Beaker, Brain,
  ListTodo,
} from "lucide-react";

const navGroups = [
  {
    label: "ÜBERSICHT",
    items: [
      { icon: Target, label: "Executive", path: "/executive", featureKey: "executive" },
      { icon: BarChart3, label: "Dashboard", path: "/dashboard", featureKey: "dashboard" },
      { icon: FileText, label: "Entscheidungen", path: "/decisions", featureKey: "decisions" },
      { icon: ListTodo, label: "Aufgaben", path: "/tasks", featureKey: "tasks" },
      { icon: Calendar, label: "Kalender", path: "/calendar", featureKey: "calendar" },
      { icon: Sun, label: "Briefing", path: "/briefing", featureKey: "briefing" },
    ],
  },
  {
    label: "ANALYSE",
    items: [
      { icon: GitBranch, label: "Graph", path: "/graph", featureKey: "graph" },
      { icon: Radar, label: "Bottlenecks", path: "/bottlenecks", featureKey: "bottlenecks" },
      { icon: DollarSign, label: "Kosten", path: "/costs", featureKey: "costs" },
      { icon: Flame, label: "Friction", path: "/friction", featureKey: "friction" },
      { icon: Activity, label: "Health", path: "/health", featureKey: "health" },
      { icon: TrendingUp, label: "Analytics", path: "/analytics", featureKey: "analytics" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { icon: Dna, label: "DNA", path: "/dna", featureKey: "dna" },
      { icon: Zap, label: "Engine", path: "/engine", featureKey: "engine" },
      { icon: Trophy, label: "Benchmark", path: "/benchmarking", featureKey: "benchmarking" },
      { icon: FlaskConical, label: "Szenarien", path: "/scenarios", featureKey: "scenarios" },
      { icon: CalendarDays, label: "Timeline", path: "/timeline", featureKey: "timeline" },
      { icon: Crosshair, label: "Strategie", path: "/strategy", featureKey: "strategy" },
      { icon: Brain, label: "Patterns", path: "/patterns", featureKey: "patterns" },
    ],
  },
  {
    label: "VERWALTUNG",
    items: [
      { icon: Shield, label: "War Room", path: "/warroom", adminOnly: true, featureKey: "warroom" },
      { icon: UserCog, label: "Nutzer", path: "/admin/users", adminOnly: true },
      { icon: Beaker, label: "Pilot-Modus", path: "/pilot", adminOnly: true },
      { icon: History, label: "Audit Trail", path: "/audit", featureKey: "audit" },
      { icon: Users, label: "Teams", path: "/teams", featureKey: "teams" },
      { icon: Settings, label: "Einstellungen", path: "/settings" },
    ],
  },
];

interface SidebarNavProps {
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
}

const SidebarNav = memo(({
  collapsed,
  isAdmin,
  isFeatureEnabled,
  pathname,
  onNavigate,
  onPrefetch,
}: SidebarNavProps) => (
  <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
    {navGroups.map((group) => {
      const visibleItems = group.items.filter(item => {
        if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
        if ("featureKey" in item && item.featureKey && !isFeatureEnabled(item.featureKey)) return false;
        return true;
      });
      if (visibleItems.length === 0) return null;
      return (
        <div key={group.label}>
          {!collapsed && (
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  onMouseEnter={() => onPrefetch?.(item.path)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      );
    })}
  </nav>
));

SidebarNav.displayName = "SidebarNav";

export { navGroups };
export default SidebarNav;

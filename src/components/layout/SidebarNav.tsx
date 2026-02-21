import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, DollarSign, Shield, Calendar, CalendarDays, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Sun, LayoutDashboard, UserCog, History, Beaker, Brain,
  ListTodo, ChevronDown, ChevronRight, Briefcase, Cpu, Lightbulb, AlertTriangle, BookOpen, Clock,
  Archive, Search as SearchIcon, Settings2, Compass,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  featureKey?: string;
  adminOnly?: boolean;
}

interface NavSubGroup {
  icon: React.ElementType;
  label: string;
  featureKey?: string;
  children: NavItem[];
}

interface NavGroup {
  label: string;
  items: (NavItem | NavSubGroup)[];
  defaultCollapsed?: boolean;
}

function isSubGroup(item: NavItem | NavSubGroup): item is NavSubGroup {
  return "children" in item;
}

const navGroups: NavGroup[] = [
  {
    label: "CORE",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", featureKey: "dashboard" },
      { icon: FileText, label: "Decisions", path: "/decisions", featureKey: "decisions" },
      { icon: ListTodo, label: "Tasks", path: "/tasks", featureKey: "tasks" },
      { icon: Calendar, label: "Calendar", path: "/calendar", featureKey: "calendar" },
      { icon: Users, label: "Teams", path: "/teams", featureKey: "teams" },
      
      { icon: SearchIcon, label: "Suche", path: "/search" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      {
        icon: TrendingUp,
        label: "Analytics Hub",
        children: [
          { icon: BarChart3, label: "Analytics", path: "/analytics", featureKey: "analytics" },
          { icon: Trophy, label: "Team-Performance", path: "/team-performance" },
          { icon: GitBranch, label: "Decision Graph", path: "/graph", featureKey: "graph" },
          { icon: Crosshair, label: "Strategy", path: "/strategy", featureKey: "strategy" },
        ],
      },
      {
        icon: Cpu,
        label: "Process Hub",
        children: [
          { icon: Radar, label: "Bottlenecks", path: "/bottlenecks", featureKey: "bottlenecks" },
          { icon: Flame, label: "Friction Map", path: "/friction", featureKey: "friction" },
          { icon: Activity, label: "Health Heatmap", path: "/health", featureKey: "health" },
          { icon: Brain, label: "Pattern Engine", path: "/patterns", featureKey: "patterns" },
        ],
      },
      {
        icon: Briefcase,
        label: "Executive Hub",
        featureKey: "executive",
        children: [
          { icon: Target, label: "Executive Dashboard", path: "/executive", featureKey: "executive" },
          { icon: Sun, label: "CEO Briefing", path: "/briefing", featureKey: "briefing" },
          { icon: CalendarDays, label: "Predictive Timeline", path: "/timeline", featureKey: "timeline" },
          { icon: Dna, label: "Decision DNA", path: "/dna", featureKey: "dna" },
          { icon: Trophy, label: "Benchmarking", path: "/benchmarking", featureKey: "benchmarking" },
          { icon: DollarSign, label: "Economic Impact", path: "/costs", featureKey: "costs" },
          { icon: FlaskConical, label: "Scenario Engine", path: "/scenarios", featureKey: "scenarios" },
        ],
      },
    ],
  },
  {
    label: "GOVERNANCE",
    defaultCollapsed: true,
    items: [
      { icon: Zap, label: "Escalation Center", path: "/engine", featureKey: "engine" },
      { icon: Shield, label: "War Room", path: "/warroom", featureKey: "warroom" },
      { icon: Shield, label: "Risk Register", path: "/risks" },
      { icon: History, label: "Audit Trail", path: "/audit", featureKey: "audit" },
      { icon: Zap, label: "Automations", path: "/automations", adminOnly: true },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { icon: BookOpen, label: "Knowledge Base", path: "/knowledge" },
      { icon: Settings2, label: "Template Editor", path: "/template-editor" },
      { icon: Archive, label: "Archive", path: "/archive" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: UserCog, label: "Users", path: "/admin/users", adminOnly: true },
      { icon: Beaker, label: "Pilot Mode", path: "/pilot", adminOnly: true },
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

/* ── Sub-group (collapsible) ── */
const SubGroupItem = ({
  subGroup, collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch,
}: {
  subGroup: NavSubGroup;
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
}) => {
  const visibleChildren = subGroup.children.filter(child => {
    if (child.adminOnly && !isAdmin) return false;
    if (child.featureKey && !isFeatureEnabled(child.featureKey)) return false;
    return true;
  });

  const hasActiveChild = visibleChildren.some(c => pathname === c.path);
  const [open, setOpen] = useState(hasActiveChild);

  if (visibleChildren.length === 0) return null;

  if (collapsed) {
    return (
      <div className="space-y-px">
        {visibleChildren.map(child => (
          <Link
            key={child.path}
            to={child.path}
            onClick={onNavigate}
            onMouseEnter={() => onPrefetch?.(child.path)}
            className={`w-full flex items-center justify-center h-8 rounded-md text-[13px] transition-colors ${
              pathname === child.path
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
            }`}
            title={child.label}
          >
            <child.icon className="w-4 h-4 shrink-0" />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium transition-colors ${
          hasActiveChild
            ? "text-foreground"
            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
        }`}
      >
        <subGroup.icon className="w-4 h-4 shrink-0 opacity-60" />
        <span className="whitespace-nowrap flex-1 text-left">{subGroup.label}</span>
        {open ? (
          <ChevronDown className="w-3 h-3 shrink-0 opacity-40" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
        )}
      </button>
      {open && (
        <div className="ml-[18px] pl-2 border-l border-border/30 space-y-px mt-px">
          {visibleChildren.map(child => (
            <Link
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              onMouseEnter={() => onPrefetch?.(child.path)}
              className={`w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12px] font-medium transition-colors ${
                pathname === child.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              }`}
            >
              <child.icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="whitespace-nowrap">{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main nav ── */
const SidebarNav = memo(({
  collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch,
}: SidebarNavProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(g => {
      if (g.defaultCollapsed) initial[g.label] = true;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto overflow-x-hidden">
      {navGroups.map((group) => {
        const visibleItems = group.items.filter(item => {
          if (isSubGroup(item)) {
            if (item.featureKey && !isFeatureEnabled(item.featureKey)) return false;
            return item.children.some(c => {
              if (c.adminOnly && !isAdmin) return false;
              if (c.featureKey && !isFeatureEnabled(c.featureKey)) return false;
              return true;
            });
          }
          if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
          if ("featureKey" in item && item.featureKey && !isFeatureEnabled(item.featureKey)) return false;
          return true;
        });
        if (visibleItems.length === 0) return null;

        const isGroupCollapsed = collapsedGroups[group.label] ?? false;
        const hasActiveItem = visibleItems.some(item => {
          if (isSubGroup(item)) return item.children.some(c => pathname === c.path);
          return pathname === item.path;
        });

        return (
          <div key={group.label}>
            {!collapsed && (
              <button
                onClick={group.defaultCollapsed !== undefined ? () => toggleGroup(group.label) : undefined}
                className={`w-full flex items-center px-2 mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/40 ${
                  group.defaultCollapsed !== undefined ? "hover:text-muted-foreground/70 cursor-pointer" : "cursor-default"
                }`}
              >
                <span className="flex-1 text-left">{group.label}</span>
                {group.defaultCollapsed !== undefined && (
                  isGroupCollapsed && !hasActiveItem ? (
                    <ChevronRight className="w-3 h-3 opacity-40" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-40" />
                  )
                )}
              </button>
            )}
            {(!isGroupCollapsed || hasActiveItem || collapsed) && (
              <div className="space-y-px">
                {visibleItems.map((item) => {
                  if (isSubGroup(item)) {
                    return (
                      <SubGroupItem
                        key={item.label}
                        subGroup={item}
                        collapsed={collapsed}
                        isAdmin={isAdmin}
                        isFeatureEnabled={isFeatureEnabled}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        onPrefetch={onPrefetch}
                      />
                    );
                  }

                  const active = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      onMouseEnter={() => onPrefetch?.(item.path)}
                      className={`w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="w-4 h-4 shrink-0 opacity-60" />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
});

SidebarNav.displayName = "SidebarNav";

export { navGroups };
export default SidebarNav;

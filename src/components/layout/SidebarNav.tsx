import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, DollarSign, Shield, Calendar, CalendarDays, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Sun, LayoutDashboard, UserCog, History, Beaker, Brain,
  ListTodo, ChevronDown, ChevronRight, Briefcase, Cpu, Lightbulb, AlertTriangle, BookOpen, Clock,
  Archive, Search as SearchIcon, Settings2, Compass, Video, Lock,
} from "lucide-react";
import { useGuidedMode, BASIC_MODE_PATHS } from "@/hooks/useGuidedMode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import type { OrgRoleKey } from "@/hooks/usePermissions";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  featureKey?: string;
  adminOnly?: boolean;
  minRole?: OrgRoleKey;
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

/* nav group keys map to i18n keys */
const navGroupKey = (label: string) => label;

interface NavGroupDef {
  labelKey: string;
  items: (NavItem | NavSubGroup)[];
  defaultCollapsed?: boolean;
  progressive?: boolean; // requires threshold of decisions
}

const navGroupsDef: NavGroupDef[] = [
  {
    labelKey: "core",
    items: [
      { icon: LayoutDashboard, label: "nav.dashboard", path: "/dashboard", featureKey: "dashboard" },
      { icon: FileText, label: "nav.decisions", path: "/decisions", featureKey: "decisions" },
      { icon: ListTodo, label: "nav.tasks", path: "/tasks", featureKey: "tasks" },
      { icon: Calendar, label: "nav.calendar", path: "/calendar", featureKey: "calendar" },
      { icon: SearchIcon, label: "nav.search", path: "/search" },
    ],
  },
  {
    labelKey: "teams",
    items: [
      { icon: Users, label: "nav.teamsNav", path: "/teams", featureKey: "teams" },
      { icon: Video, label: "nav.meeting", path: "/meeting" },
    ],
  },
  {
    labelKey: "governance",
    items: [
      { icon: Shield, label: "nav.escalationCenter", path: "/engine", featureKey: "engine", minRole: "org_member" },
      { icon: AlertTriangle, label: "nav.riskRegister", path: "/risks", minRole: "org_member" },
      { icon: Zap, label: "nav.automations", path: "/automations", minRole: "org_admin" },
      { icon: History, label: "nav.auditTrail", path: "/audit", featureKey: "audit", minRole: "org_admin" },
    ],
  },
  {
    labelKey: "intelligence",
    progressive: true, // requires 15+ decisions
    items: [
      { icon: Brain, label: "nav.executiveHub", path: "/executive", featureKey: "executive", minRole: "org_executive" },
      { icon: BarChart3, label: "nav.analyticsHub", path: "/analytics", featureKey: "analytics", minRole: "org_executive" },
      { icon: Cpu, label: "nav.processHub", path: "/process", featureKey: "bottlenecks", minRole: "org_executive" },
      { icon: BookOpen, label: "nav.knowledgeBase", path: "/knowledge", minRole: "org_member" },
      {
        icon: Compass, label: "nav.advancedAnalytics", featureKey: "analytics", minRole: "org_executive",
        children: [
          { icon: GitBranch, label: "nav.decisionGraph", path: "/graph" },
          { icon: Dna, label: "nav.decisionDna", path: "/dna" },
          { icon: Trophy, label: "nav.benchmarking", path: "/benchmarking" },
          { icon: Activity, label: "nav.healthHeatmap", path: "/health-heatmap" },
          { icon: Clock, label: "nav.predictiveTimeline", path: "/predictive-timeline" },
          { icon: FlaskConical, label: "nav.scenarios", path: "/scenarios" },
        ],
      } as NavSubGroup,
    ],
  },
  {
    labelKey: "system",
    items: [
      { icon: Settings2, label: "nav.templates", path: "/template-editor", minRole: "org_member" },
      { icon: Target, label: "nav.strategy", path: "/strategy", minRole: "org_member" },
      { icon: Archive, label: "nav.archive", path: "/archive" },
      { icon: Settings, label: "nav.settings", path: "/settings" },
      { icon: UserCog, label: "nav.users", path: "/admin/users", adminOnly: true },
      { icon: Beaker, label: "nav.featureManagement", path: "/feature-management", adminOnly: true },
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
  userRole?: OrgRoleKey;
}

const ROLE_HIERARCHY: OrgRoleKey[] = [
  "org_viewer", "org_reviewer", "org_member", "org_executive", "org_admin", "org_owner",
];

function meetsMinRole(current: OrgRoleKey, min?: OrgRoleKey): boolean {
  if (!min) return true;
  return ROLE_HIERARCHY.indexOf(current) >= ROLE_HIERARCHY.indexOf(min);
}

/* ── Sub-group (collapsible) ── */
const SubGroupItem = ({
  subGroup, collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
}: {
  subGroup: NavSubGroup;
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
  userRole?: OrgRoleKey;
}) => {
  const { t } = useTranslation();

  const visibleChildren = subGroup.children.filter(child => {
    if (child.adminOnly && !isAdmin) return false;
    if (child.featureKey && !isFeatureEnabled(child.featureKey)) return false;
    if (child.minRole && !meetsMinRole(userRole, child.minRole)) return false;
    return true;
  });

  const hasActiveChild = visibleChildren.some(c => pathname === c.path);
  const [open, setOpen] = useState(hasActiveChild);

  // Check subgroup-level minRole
  if ((subGroup as any).minRole && !meetsMinRole(userRole, (subGroup as any).minRole)) return null;

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
            title={t(child.label)}
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
        <span className="whitespace-nowrap flex-1 text-left">{t(subGroup.label)}</span>
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
              <span className="whitespace-nowrap">{t(child.label)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main nav ── */
const SidebarNav = memo(({
  collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
}: SidebarNavProps) => {
  const { mode, setMode, shouldShowAdvanced, decisionCount } = useGuidedMode();
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroupsDef.forEach(g => {
      if (g.defaultCollapsed) initial[g.labelKey] = true;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto overflow-x-hidden">
      {/* Guided Mode Toggle */}
      {!collapsed && (
        <div className="px-2 pb-1">
          <div className="flex items-center rounded-md border border-border p-0.5">
            {(["basic", "advanced"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "basic" ? t("nav.basic") : t("nav.advanced")}
              </button>
            ))}
          </div>
        </div>
      )}
      {navGroupsDef.map((group) => {
        const groupLabel = t(`nav.${group.labelKey}`);
        // Color coding per section
        const groupAccent: Record<string, string> = {
          core: "",
          teams: "text-accent-blue/70",
          governance: "text-accent-rose/70",
          intelligence: "text-accent-teal/70",
          system: "text-muted-foreground/40",
        };
        const groupDot: Record<string, string> = {
          core: "bg-foreground/20",
          teams: "bg-accent-blue/50",
          governance: "bg-accent-rose/50",
          intelligence: "bg-accent-teal/50",
          system: "bg-muted-foreground/30",
        };

        // Progressive hint: Intelligence recommends 25+ decisions but is always accessible
        const PROGRESSIVE_THRESHOLD = 25;
        const showProgressiveHint = group.progressive && decisionCount < PROGRESSIVE_THRESHOLD;
        // In basic mode, collect locked items for teaser display
        const lockedItems: NavItem[] = [];
        const visibleItems = group.items.filter(item => {
          if (isSubGroup(item)) {
            if (item.featureKey && !isFeatureEnabled(item.featureKey)) return false;
            if ((item as any).minRole && !meetsMinRole(userRole, (item as any).minRole)) return false;
            return item.children.some(c => {
              if (c.adminOnly && !isAdmin) return false;
              if (c.featureKey && !isFeatureEnabled(c.featureKey)) return false;
              if (c.minRole && !meetsMinRole(userRole, c.minRole)) return false;
              if (mode === "basic" && !BASIC_MODE_PATHS.has(c.path)) return false;
              return true;
            });
          }
          if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
          if ("featureKey" in item && item.featureKey && !isFeatureEnabled(item.featureKey)) return false;
          if ("minRole" in item && item.minRole && !meetsMinRole(userRole, item.minRole)) return false;
          if (mode === "basic" && !BASIC_MODE_PATHS.has(item.path)) {
            lockedItems.push(item as NavItem);
            return false;
          }
          return true;
        });
        if (visibleItems.length === 0 && lockedItems.length === 0) return null;
        if (visibleItems.length === 0 && lockedItems.length > 0 && !collapsed) {
          const teaserKeys: Record<string, string> = {
            insights: "nav.teaserInsights",
            governance: "nav.teaserGovernance",
          };
          return (
            <div key={group.labelKey}>
              <p className={`px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${groupAccent[group.labelKey] || "text-muted-foreground/40"}`}>
                {groupLabel}
              </p>
              <button
                onClick={() => setMode("advanced")}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/[0.02] transition-colors group"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-60" />
                <span className="text-left flex-1">
                  <span className="block text-[11px] font-medium">{teaserKeys[group.labelKey] ? t(teaserKeys[group.labelKey]) : `${lockedItems.length} Features`}</span>
                  <span className="block text-[10px] opacity-60">{t("nav.switchToAdvanced")}</span>
                </span>
              </button>
            </div>
          );
        }
        if (visibleItems.length === 0) return null;

        const isGroupCollapsed = collapsedGroups[group.labelKey] ?? false;
        const hasActiveItem = visibleItems.some(item => {
          if (isSubGroup(item)) return item.children.some(c => pathname === c.path);
          return pathname === item.path;
        });

        return (
          <div key={group.labelKey}>
            {!collapsed && (
              <button
                onClick={group.defaultCollapsed !== undefined ? () => toggleGroup(group.labelKey) : undefined}
                className={`w-full flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${groupAccent[group.labelKey] || "text-muted-foreground/60"} ${
                  group.defaultCollapsed !== undefined ? "hover:text-muted-foreground/80 cursor-pointer" : "cursor-default"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${groupDot[group.labelKey] || "bg-muted-foreground/30"}`} />
                <span className="flex-1 text-left">{groupLabel}</span>
                {group.defaultCollapsed !== undefined && (
                  isGroupCollapsed && !hasActiveItem ? (
                    <ChevronRight className="w-3 h-3 opacity-40" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-40" />
                  )
                )}
              </button>
            )}
            {showProgressiveHint && !collapsed && (
              <div className="px-2 py-1.5 mb-1 rounded-md">
                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3 shrink-0 text-accent-teal/50" />
                  <span className="text-[10px] text-muted-foreground/50">{t("nav.intelligenceRecommended", { count: PROGRESSIVE_THRESHOLD - decisionCount })}</span>
                </div>
                <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-accent-teal/40 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (decisionCount / PROGRESSIVE_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
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
                        userRole={userRole}
                      />
                    );
                  }

                  const active = pathname === item.path;
                  const isMeeting = item.path === "/meeting";
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      onMouseEnter={() => onPrefetch?.(item.path)}
                      className={`w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : isMeeting
                            ? "text-primary/80 hover:bg-primary/5 hover:text-primary"
                            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                      }`}
                      title={collapsed ? t(item.label) : undefined}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isMeeting ? "opacity-80" : "opacity-60"}`} />
                      {!collapsed && (
                        <span className="whitespace-nowrap flex items-center gap-1.5">
                          {t(item.label)}
                          {isMeeting && (
                            <span className="inline-flex h-4 items-center px-1 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                              {t("nav.live")}
                            </span>
                          )}
                        </span>
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

export { navGroupsDef as navGroups };
export default SidebarNav;

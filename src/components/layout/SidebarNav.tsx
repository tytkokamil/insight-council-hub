import { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, FileText, Users, TrendingUp, Settings,
  GitBranch, Radar, DollarSign, Shield, Calendar, CalendarDays, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, Sun, LayoutDashboard, UserCog, History, Beaker, Brain,
  ListTodo, ChevronDown, ChevronRight, Briefcase, Cpu, Lightbulb, AlertTriangle, BookOpen, Clock,
  Archive, Search as SearchIcon, Settings2, Compass, Video, Lock, Sparkles, Crown,
} from "lucide-react";
import { useGuidedMode, BASIC_MODE_PATHS } from "@/hooks/useGuidedMode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import FeatureUpgradeModal from "@/components/layout/FeatureUpgradeModal";
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
  progressive?: boolean;
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
    progressive: true,
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
          { icon: Activity, label: "nav.healthHeatmap", path: "/health" },
          { icon: Clock, label: "nav.predictiveTimeline", path: "/timeline" },
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
  "org_viewer", "org_member", "org_lead", "org_executive", "org_admin", "org_owner",
];

function meetsMinRole(current: OrgRoleKey, min?: OrgRoleKey): boolean {
  if (!min) return true;
  return ROLE_HIERARCHY.indexOf(current) >= ROLE_HIERARCHY.indexOf(min);
}

const PLAN_BADGE: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

/* ── Locked nav item (greyed out with plan badge) ── */
const LockedNavItem = ({
  item, collapsed, onUpgradeClick, minPlan,
}: {
  item: NavItem;
  collapsed: boolean;
  onUpgradeClick: (featureKey: string, label: string, minPlan: string) => void;
  minPlan: string;
}) => {
  const { t } = useTranslation();
  const badge = PLAN_BADGE[minPlan] || "Pro";

  return (
    <button
      onClick={() => onUpgradeClick(item.featureKey || "", t(item.label), minPlan)}
      className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.02] transition-all duration-150 cursor-pointer group"
      title={collapsed ? `${t(item.label)} (${badge})` : undefined}
    >
      <item.icon className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-40" />
      {!collapsed && (
        <>
          <span className="whitespace-nowrap flex-1 text-left">{t(item.label)}</span>
          <span className="inline-flex h-4 items-center px-1.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/8 text-primary/50 border border-primary/10">
            {badge}
          </span>
        </>
      )}
      {collapsed && (
        <span className="sr-only">{t(item.label)} ({badge})</span>
      )}
    </button>
  );
};

/* ── Sub-group (collapsible) ── */
const SubGroupItem = ({
  subGroup, collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
  onUpgradeClick, getMinPlan,
}: {
  subGroup: NavSubGroup;
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
  userRole?: OrgRoleKey;
  onUpgradeClick: (featureKey: string, label: string, minPlan: string) => void;
  getMinPlan: (featureKey: string) => string;
}) => {
  const { t } = useTranslation();

  // Check if the entire subgroup is plan-locked
  const subGroupFeatureKey = subGroup.featureKey;
  const isSubGroupLocked = subGroupFeatureKey ? !isFeatureEnabled(subGroupFeatureKey) : false;

  const visibleChildren = subGroup.children.filter(child => {
    if (child.adminOnly && !isAdmin) return false;
    if (child.minRole && !meetsMinRole(userRole, child.minRole)) return false;
    return true;
  });

  const enabledChildren = visibleChildren.filter(c => !c.featureKey || isFeatureEnabled(c.featureKey));
  const lockedChildren = visibleChildren.filter(c => c.featureKey && !isFeatureEnabled(c.featureKey));
  const hasActiveChild = enabledChildren.some(c => pathname === c.path);
  const [open, setOpen] = useState(hasActiveChild);

  // Check subgroup-level minRole
  if ((subGroup as any).minRole && !meetsMinRole(userRole, (subGroup as any).minRole)) return null;

  if (isSubGroupLocked) {
    const minPlan = getMinPlan(subGroupFeatureKey || "");
    const badge = PLAN_BADGE[minPlan] || "Pro";
    if (collapsed) return null;
    return (
      <button
        onClick={() => onUpgradeClick(subGroupFeatureKey || "", t(subGroup.label), minPlan)}
        className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.02] transition-all duration-150 cursor-pointer group"
      >
        <subGroup.icon className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-40" />
        <span className="whitespace-nowrap flex-1 text-left">{t(subGroup.label)}</span>
        <span className="inline-flex h-4 items-center px-1.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/8 text-primary/50 border border-primary/10">
          {badge}
        </span>
      </button>
    );
  }

  if (enabledChildren.length === 0 && lockedChildren.length === 0) return null;

  if (collapsed) {
    return (
      <div className="space-y-px">
        {enabledChildren.map(child => (
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
        className={`w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium transition-all duration-150 ${
          hasActiveChild
            ? "text-foreground"
            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
        }`}
      >
        <subGroup.icon className="w-4 h-4 shrink-0 opacity-60" />
        <span className="whitespace-nowrap flex-1 text-left">{t(subGroup.label)}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 opacity-40 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-[18px] pl-2 border-l border-border/30 space-y-px mt-px">
              {enabledChildren.map(child => (
                <Link
                  key={child.path}
                  to={child.path}
                  onClick={onNavigate}
                  onMouseEnter={() => onPrefetch?.(child.path)}
                  className={`w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12px] font-medium transition-all duration-150 ${
                    pathname === child.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                  }`}
                >
                  <child.icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="whitespace-nowrap">{t(child.label)}</span>
                </Link>
              ))}
              {lockedChildren.map(child => {
                const mp = getMinPlan(child.featureKey || "");
                return (
                  <button
                    key={child.path}
                    onClick={() => onUpgradeClick(child.featureKey || "", t(child.label), mp)}
                    className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.02] transition-all duration-150 cursor-pointer group"
                  >
                    <child.icon className="w-3.5 h-3.5 shrink-0 opacity-30 group-hover:opacity-40" />
                    <span className="whitespace-nowrap flex-1 text-left">{t(child.label)}</span>
                    <span className="inline-flex h-3.5 items-center px-1 rounded text-[8px] font-semibold uppercase tracking-wider bg-primary/8 text-primary/50 border border-primary/10">
                      {PLAN_BADGE[mp] || "Pro"}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main nav ── */
const SidebarNav = memo(({
  collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
}: SidebarNavProps) => {
  const { mode, setMode, shouldShowAdvanced, decisionCount } = useGuidedMode();
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();
  const [intelligenceUnlocked, setIntelligenceUnlocked] = useState(() => localStorage.getItem("intelligence-unlocked") === "true");
  const [hasActiveMeeting, setHasActiveMeeting] = useState(false);

  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; featureKey: string; label: string; minPlan: string }>({
    open: false, featureKey: "", label: "", minPlan: "pro",
  });

  const openUpgradeModal = (featureKey: string, label: string, minPlan: string) => {
    setUpgradeModal({ open: true, featureKey, label, minPlan });
  };

  const getMinPlan = (featureKey: string): string => {
    const flag = flags.find(f => f.feature_key === featureKey);
    return flag?.min_plan || "pro";
  };

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.from("meeting_sessions").select("id").eq("status", "active").limit(1)
        .then(({ data }) => setHasActiveMeeting((data?.length ?? 0) > 0));
    });
  }, [pathname]);
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
    <>
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
          const groupAccent: Record<string, string> = {
            core: "text-accent-violet/70",
            teams: "text-accent-blue/70",
            governance: "text-accent-rose/70",
            intelligence: "text-accent-teal/70",
            system: "text-accent-amber/70",
          };
          const groupDot: Record<string, string> = {
            core: "bg-accent-violet/50",
            teams: "bg-accent-blue/50",
            governance: "bg-accent-rose/50",
            intelligence: "bg-accent-teal/50",
            system: "bg-accent-amber/50",
          };

          // Progressive group: show unlock teaser when not yet unlocked
          if (group.progressive && !intelligenceUnlocked && !collapsed) {
            return (
              <div key={group.labelKey}>
                <p className={`px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${groupAccent[group.labelKey] || "text-muted-foreground/40"}`}>
                  {groupLabel}
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem("intelligence-unlocked", "true");
                    setIntelligenceUnlocked(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/[0.02] transition-colors group"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-60" />
                  <span className="text-left flex-1">
                    <span className="block text-[11px] font-medium">{t("nav.unlockIntelligence", { defaultValue: "Intelligence freischalten" })}</span>
                    <span className="block text-[10px] opacity-60">{t("nav.unlockIntelligenceHint", { defaultValue: "Empfohlen ab 25 Entscheidungen", count: 25 })}</span>
                  </span>
                </button>
              </div>
            );
          }
          if (group.progressive && !intelligenceUnlocked && collapsed) {
            return null;
          }

          // Separate items into: visible (enabled), locked (feature-gated), and hidden (role/admin)
          const lockedByPlan: NavItem[] = [];
          const lockedItems: NavItem[] = []; // basic-mode locked
          const visibleItems = group.items.filter(item => {
            if (isSubGroup(item)) {
              // SubGroups handle their own locking internally
              if ((item as any).minRole && !meetsMinRole(userRole, (item as any).minRole)) return false;
              return true; // Let SubGroupItem handle feature gating
            }
            if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
            if ("minRole" in item && item.minRole && !meetsMinRole(userRole, item.minRole)) return false;
            // Feature-gated: show as locked instead of hiding
            if ("featureKey" in item && item.featureKey && !isFeatureEnabled(item.featureKey)) {
              lockedByPlan.push(item as NavItem);
              return false;
            }
            if (!group.progressive && mode === "basic" && !BASIC_MODE_PATHS.has(item.path)) {
              lockedItems.push(item as NavItem);
              return false;
            }
            return true;
          });

          const allItems = [...visibleItems];
          const hasAnyContent = visibleItems.length > 0 || lockedByPlan.length > 0 || lockedItems.length > 0;
          if (!hasAnyContent) return null;

          // Only basic-mode locked teaser (no plan-locked items)
          if (visibleItems.length === 0 && lockedByPlan.length === 0 && lockedItems.length > 0 && !collapsed) {
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

          if (visibleItems.length === 0 && lockedByPlan.length === 0) return null;

          const isGroupCollapsed = collapsedGroups[group.labelKey] ?? false;
          const hasActiveItem = visibleItems.some(item => {
            if (isSubGroup(item)) return item.children.some(c => pathname === c.path);
            return pathname === item.path;
          });

          return (
            <div key={group.labelKey}>
              {!collapsed && (
                <div className="flex items-center gap-1 px-2 mb-1.5">
                  <button
                    onClick={group.defaultCollapsed !== undefined ? () => toggleGroup(group.labelKey) : undefined}
                    className={`flex-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${groupAccent[group.labelKey] || "text-muted-foreground/60"} ${
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
                  {group.progressive && intelligenceUnlocked && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            localStorage.removeItem("intelligence-unlocked");
                            setIntelligenceUnlocked(false);
                          }}
                          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p>{t("nav.hideIntelligence")}</p>
                        <p className="text-muted-foreground text-[10px]">{t("nav.hideIntelligenceHint", { count: 25 })}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
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
                          onUpgradeClick={openUpgradeModal}
                          getMinPlan={getMinPlan}
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
                        className={`relative w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium transition-all duration-150 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : isMeeting
                              ? "text-primary/80 hover:bg-primary/5 hover:text-primary"
                              : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                        }`}
                        title={collapsed ? t(item.label) : undefined}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active-indicator"
                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={`w-4 h-4 shrink-0 ${isMeeting ? "opacity-80" : "opacity-60"}`} />
                        {!collapsed && (
                          <span className="whitespace-nowrap flex items-center gap-1.5">
                            {t(item.label)}
                            {isMeeting && hasActiveMeeting && (
                              <span className="inline-flex h-4 items-center px-1 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary animate-pulse">
                                {t("nav.live")}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {/* Plan-locked items: visible but greyed out with badge */}
                  {lockedByPlan.map((item) => (
                    <LockedNavItem
                      key={item.path}
                      item={item}
                      collapsed={collapsed}
                      onUpgradeClick={openUpgradeModal}
                      minPlan={getMinPlan(item.featureKey || "")}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Upgrade Modal */}
      <FeatureUpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) => setUpgradeModal(prev => ({ ...prev, open }))}
        featureKey={upgradeModal.featureKey}
        featureLabel={upgradeModal.label}
        minPlan={upgradeModal.minPlan}
      />
    </>
  );
});

SidebarNav.displayName = "SidebarNav";

export { navGroupsDef as navGroups };
export default SidebarNav;

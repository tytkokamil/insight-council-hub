import { memo, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, FileText, Users, Settings, Shield, Calendar, Activity,
  Dna, Zap, Target, LayoutDashboard, UserCog, History, Brain,
  ListTodo, ChevronDown, ChevronRight, Cpu, AlertTriangle, BookOpen, Clock,
  Archive, Search as SearchIcon, Settings2, Compass, Video, Lock, Sparkles,
  GitBranch, Trophy, FlaskConical, Plus, Radar,
} from "lucide-react";
import { useGuidedMode, LEVEL_1_PATHS, LEVEL_2_PATHS, type ProgressiveLevel } from "@/hooks/useGuidedMode";
import { useDecisions } from "@/hooks/useDecisions";
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
  badge?: "decisions" | "reviews";
}

interface NavSubGroup {
  icon: React.ElementType;
  label: string;
  featureKey?: string;
  minRole?: OrgRoleKey;
  children: NavItem[];
}

interface NavGroupDef {
  labelKey: string;
  items: (NavItem | NavSubGroup)[];
  defaultCollapsed?: boolean;
  progressive?: boolean;
}

function isSubGroup(item: NavItem | NavSubGroup): item is NavSubGroup {
  return "children" in item;
}

/* ── Role-based nav definitions ── */

const WORKSPACE_GROUP: NavGroupDef = {
  labelKey: "workspace",
  items: [
    { icon: LayoutDashboard, label: "nav.dashboard", path: "/dashboard", featureKey: "dashboard" },
    { icon: FileText, label: "nav.decisions", path: "/decisions", featureKey: "decisions", badge: "decisions" },
    { icon: ListTodo, label: "nav.tasks", path: "/tasks", featureKey: "tasks" },
    { icon: Calendar, label: "nav.calendar", path: "/calendar", featureKey: "calendar" },
  ],
};

const INTELLIGENCE_GROUP: NavGroupDef = {
  labelKey: "intelligence",
  progressive: true,
  items: [
    { icon: Brain, label: "nav.executiveHub", path: "/executive", featureKey: "executive", minRole: "org_executive" },
    { icon: BarChart3, label: "nav.analyticsHub", path: "/analytics", featureKey: "analytics", minRole: "org_executive" },
    { icon: Cpu, label: "nav.processHub", path: "/process", featureKey: "bottlenecks", minRole: "org_executive" },
    {
      icon: Compass, label: "nav.advancedAnalytics", featureKey: "analytics", minRole: "org_executive",
      children: [
        { icon: Dna, label: "nav.decisionDna", path: "/analytics/decision-dna" },
        { icon: GitBranch, label: "nav.decisionGraph", path: "/decision-graph" },
        { icon: Trophy, label: "nav.benchmarking", path: "/analytics/decision-benchmarking" },
        { icon: Activity, label: "nav.healthHeatmap", path: "/analytics/health-heatmap" },
        { icon: Clock, label: "nav.predictiveTimeline", path: "/analytics/predictive-timeline" },
        { icon: FlaskConical, label: "nav.scenarios", path: "/analytics/scenario-engine" },
        { icon: Brain, label: "nav.patternEngine", path: "/analytics/pattern-engine" },
        { icon: Radar, label: "nav.bottleneckIntelligence", path: "/analytics/bottleneck-intelligence" },
        { icon: Target, label: "nav.opportunityCost", path: "/analytics/opportunity-cost-radar" },
        { icon: Zap, label: "nav.frictionMap", path: "/analytics/friction-map" },
        { icon: Users, label: "nav.teamPerformance", path: "/analytics/team-performance" },
      ],
    } as NavSubGroup,
  ],
};

const GOVERNANCE_GROUP: NavGroupDef = {
  labelKey: "governance",
  items: [
    {
      icon: Shield, label: "nav.governanceHub", featureKey: "engine", minRole: "org_member",
      children: [
        { icon: Shield, label: "nav.escalationCenter", path: "/engine", featureKey: "engine", minRole: "org_member" },
        { icon: AlertTriangle, label: "nav.riskRegister", path: "/risks", minRole: "org_member" },
        { icon: Zap, label: "nav.automations", path: "/automation-rules", minRole: "org_admin" },
        { icon: History, label: "nav.auditTrail", path: "/audit-trail", featureKey: "audit", minRole: "org_lead" },
      ],
    } as NavSubGroup,
  ],
};

const SETTINGS_GROUP: NavGroupDef = {
  labelKey: "system",
  items: [
    { icon: Settings, label: "nav.settings", path: "/settings" },
    {
      icon: Settings2, label: "nav.moreTools", minRole: "org_member",
      children: [
        { icon: Settings2, label: "nav.templates", path: "/template-editor", minRole: "org_member" },
        { icon: Target, label: "nav.strategy", path: "/strategy", minRole: "org_member" },
        { icon: Archive, label: "nav.archive", path: "/archive" },
        { icon: BookOpen, label: "nav.knowledgeBase", path: "/knowledge-base", minRole: "org_member" },
      ],
    } as NavSubGroup,
    { icon: UserCog, label: "nav.users", path: "/admin/users", adminOnly: true },
  ],
};

/** Full sidebar for Owner/Admin */
const FULL_GROUPS: NavGroupDef[] = [WORKSPACE_GROUP, INTELLIGENCE_GROUP, GOVERNANCE_GROUP, SETTINGS_GROUP];

/** Role-specific sidebar configs */
function getGroupsForRole(role: OrgRoleKey): NavGroupDef[] {
  switch (role) {
    case "org_viewer":
      return [{
        labelKey: "workspace",
        items: [
          { icon: FileText, label: "nav.decisions", path: "/decisions", featureKey: "decisions" },
        ],
      }];
    case "org_executive":
      return [
        {
          labelKey: "workspace",
          items: [
            { icon: Brain, label: "nav.executiveHub", path: "/executive", featureKey: "executive" },
            { icon: BarChart3, label: "nav.analyticsHub", path: "/analytics", featureKey: "analytics" },
            { icon: FileText, label: "nav.decisions", path: "/decisions", featureKey: "decisions" },
            { icon: History, label: "nav.auditTrail", path: "/audit-trail", featureKey: "audit" },
          ],
        },
      ];
    case "org_member":
      return [
        {
          labelKey: "workspace",
          items: [
            { icon: LayoutDashboard, label: "nav.dashboard", path: "/dashboard", featureKey: "dashboard" },
            { icon: FileText, label: "nav.decisions", path: "/decisions", featureKey: "decisions", badge: "decisions" },
            { icon: ListTodo, label: "nav.tasks", path: "/tasks", featureKey: "tasks" },
            { icon: Calendar, label: "nav.calendar", path: "/calendar", featureKey: "calendar" },
          ],
        },
        {
          labelKey: "system",
          items: [
            { icon: Settings, label: "nav.settings", path: "/settings" },
          ],
        },
      ];
    default:
      return FULL_GROUPS;
  }
}

const ROLE_HIERARCHY: OrgRoleKey[] = [
  "org_viewer", "org_member", "org_lead", "org_executive", "org_admin", "org_owner",
];

function meetsMinRole(current: OrgRoleKey, min?: OrgRoleKey): boolean {
  if (!min) return true;
  return ROLE_HIERARCHY.indexOf(current) >= ROLE_HIERARCHY.indexOf(min);
}

const PLAN_BADGE: Record<string, string> = {
  starter: "Starter", professional: "Professional", business: "Business", enterprise: "Enterprise",
};

/* ── Section accent colors ── */
const GROUP_ACCENT: Record<string, string> = {
  workspace: "text-accent-violet/70",
  teams: "text-accent-blue/70",
  governance: "text-accent-rose/70",
  intelligence: "text-accent-teal/70",
  system: "text-accent-amber/70",
};

const GROUP_DOT: Record<string, string> = {
  workspace: "bg-accent-violet/50",
  teams: "bg-accent-blue/50",
  governance: "bg-accent-rose/50",
  intelligence: "bg-accent-teal/50",
  system: "bg-accent-amber/50",
};

/* ── Locked nav item ── */
const LockedNavItem = ({
  item, collapsed, onUpgradeClick, minPlan,
}: {
  item: NavItem; collapsed: boolean;
  onUpgradeClick: (featureKey: string, label: string, minPlan: string) => void;
  minPlan: string;
}) => {
  const { t } = useTranslation();
  const badge = PLAN_BADGE[minPlan] || "Professional";
  return (
    <button
      onClick={() => onUpgradeClick(item.featureKey || "", t(item.label), minPlan)}
      className="w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.02] transition-all duration-150 cursor-pointer group"
      title={collapsed ? `${t(item.label)} (${badge})` : undefined}
    >
      <item.icon className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-40" />
      {!collapsed && (
        <>
          <span className="whitespace-nowrap flex-1 text-left">{t(item.label)}</span>
          <span className="inline-flex h-4 items-center px-1.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
            {badge}
          </span>
        </>
      )}
    </button>
  );
};

/* ── Sub-group (collapsible) ── */
const SubGroupItem = ({
  subGroup, collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
  onUpgradeClick, getMinPlan,
}: {
  subGroup: NavSubGroup; collapsed: boolean; isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean; pathname: string;
  onNavigate?: () => void; onPrefetch?: (path: string) => void;
  userRole?: OrgRoleKey;
  onUpgradeClick: (featureKey: string, label: string, minPlan: string) => void;
  getMinPlan: (featureKey: string) => string;
}) => {
  const { t } = useTranslation();
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

  if (subGroup.minRole && !meetsMinRole(userRole, subGroup.minRole)) return null;

  if (isSubGroupLocked) {
    const minPlan = getMinPlan(subGroupFeatureKey || "");
    const badge = PLAN_BADGE[minPlan] || "Professional";
    if (collapsed) return null;
    return (
      <button
        onClick={() => onUpgradeClick(subGroupFeatureKey || "", t(subGroup.label), minPlan)}
        className="w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-foreground/[0.02] transition-all duration-150 cursor-pointer group"
      >
        <subGroup.icon className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-40" />
        <span className="whitespace-nowrap flex-1 text-left">{t(subGroup.label)}</span>
        <span className="inline-flex h-4 items-center px-1.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
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
            key={child.path} to={child.path} onClick={onNavigate}
            onMouseEnter={() => onPrefetch?.(child.path)}
            className={`w-full flex items-center justify-center py-[7px] rounded-lg text-[13px] transition-colors ${
              pathname === child.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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
        className={`w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
          hasActiveChild ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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
                  key={child.path} to={child.path} onClick={onNavigate}
                  onMouseEnter={() => onPrefetch?.(child.path)}
                  className={`w-full flex items-center gap-2 px-2 h-7 rounded-md text-[12px] font-medium transition-all duration-150 ${
                    pathname === child.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
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
                    <span className="inline-flex h-3.5 items-center px-1 rounded text-[8px] font-semibold uppercase tracking-wider bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                      {PLAN_BADGE[mp] || "Professional"}
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
interface SidebarNavProps {
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
  userRole?: OrgRoleKey;
}

const SidebarNav = memo(({
  collapsed, isAdmin, isFeatureEnabled, pathname, onNavigate, onPrefetch, userRole = "org_member",
}: SidebarNavProps) => {
  const { decisionCount, progressiveLevel } = useGuidedMode();
  const { data: visibleDecisions = [] } = useDecisions();
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();
  const [intelligenceUnlocked, setIntelligenceUnlocked] = useState(() => localStorage.getItem("intelligence-unlocked") === "true");
  const [hasActiveMeeting, setHasActiveMeeting] = useState(false);

  const openDecisionCount = useMemo(
    () => visibleDecisions.filter((decision) => ["draft", "proposed", "review"].includes(decision.status)).length,
    [visibleDecisions]
  );

  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; featureKey: string; label: string; minPlan: string }>({
    open: false, featureKey: "", label: "", minPlan: "professional",
  });

  const openUpgradeModal = (featureKey: string, label: string, minPlan: string) => {
    setUpgradeModal({ open: true, featureKey, label, minPlan });
  };

  const getMinPlan = (featureKey: string): string => {
    const flag = flags.find(f => f.feature_key === featureKey);
    return flag?.min_plan || "professional";
  };

  useEffect(() => {
    let mounted = true;

    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      const { data } = await supabase.from("meeting_sessions").select("id").eq("status", "active").limit(1);
      if (mounted) setHasActiveMeeting((data?.length ?? 0) > 0);
    });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Determine nav groups based on role and progressive level
  const isFullRole = userRole === "org_owner" || userRole === "org_admin" || userRole === "org_lead";
  const baseGroups = isFullRole ? FULL_GROUPS : getGroupsForRole(userRole);

  // Owner/Admin bypass progressive gating entirely
  const effectiveLevel = isFullRole ? 3 : progressiveLevel;

  // Auto-unlock intelligence for Owner/Admin
  useEffect(() => {
    if (isFullRole && !intelligenceUnlocked) {
      localStorage.setItem("intelligence-unlocked", "true");
      setIntelligenceUnlocked(true);
    }
  }, [isFullRole, intelligenceUnlocked]);

  // Apply progressive level filtering
  const navGroups = useMemo(() => {
    if (effectiveLevel >= 3) return baseGroups;

    const allowedPaths = effectiveLevel === 1 ? LEVEL_1_PATHS : LEVEL_2_PATHS;

    return baseGroups
      .map(group => {
        const filteredItems = group.items.filter(item => {
          if (isSubGroup(item)) {
            return item.children.some(c => allowedPaths.has(c.path));
          }
          return allowedPaths.has(item.path);
        });
        if (filteredItems.length === 0) return null;
        return { ...group, items: filteredItems };
      })
      .filter(Boolean) as NavGroupDef[];
  }, [baseGroups, effectiveLevel]);

  return (
    <>
      <nav className="flex-1 px-2 py-2 space-y-5 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => {
          const groupLabel = t(`nav.${group.labelKey}`, { defaultValue: group.labelKey });

          // Progressive group: show unlock teaser when not yet unlocked
          if (group.progressive && !intelligenceUnlocked && !collapsed) {
            return (
              <div key={group.labelKey}>
                <p className={`label-caps px-2 pb-1.5 pt-4 ${GROUP_ACCENT[group.labelKey] || "text-muted-foreground/40"}`}>
                  {groupLabel}
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem("intelligence-unlocked", "true");
                    setIntelligenceUnlocked(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-foreground/[0.02] transition-colors group"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-60" />
                  <span className="text-left flex-1">
                    <span className="block text-[11px] font-medium">{t("nav.unlockIntelligence", { defaultValue: "Intelligence freischalten" })}</span>
                    <span className="block text-[10px] opacity-60">{t("nav.unlockIntelligenceHint", { defaultValue: "Empfohlen ab 25 Entscheidungen" })}</span>
                  </span>
                </button>
              </div>
            );
          }
          if (group.progressive && !intelligenceUnlocked && collapsed) return null;

          const lockedByPlan: NavItem[] = [];
          const visibleItems = group.items.filter(item => {
            if (isSubGroup(item)) {
              if (item.minRole && !meetsMinRole(userRole, item.minRole)) return false;
              return true;
            }
            if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
            if ("minRole" in item && item.minRole && !meetsMinRole(userRole, item.minRole)) return false;
            if ("featureKey" in item && item.featureKey && !isFeatureEnabled(item.featureKey)) {
              lockedByPlan.push(item as NavItem);
              return false;
            }
            return true;
          });

          const hasAnyContent = visibleItems.length > 0 || lockedByPlan.length > 0;
          if (!hasAnyContent) return null;

          const isGroupCollapsed = collapsedGroups[group.labelKey] ?? false;
          const hasActiveItem = visibleItems.some(item => {
            if (isSubGroup(item)) return item.children.some(c => pathname === c.path);
            return pathname === item.path;
          });

          return (
            <div key={group.labelKey}>
              {!collapsed && (
                <div className="flex items-center gap-1 px-2 pb-1.5 pt-4 first:pt-0">
                  <button
                    onClick={group.defaultCollapsed !== undefined ? () => toggleGroup(group.labelKey) : undefined}
                    className={`flex-1 flex items-center gap-1.5 label-caps ${GROUP_ACCENT[group.labelKey] || "text-muted-foreground/60"} ${
                      group.defaultCollapsed !== undefined ? "hover:text-muted-foreground/80 cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${GROUP_DOT[group.labelKey] || "bg-muted-foreground/30"}`} />
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
                          onClick={() => { localStorage.removeItem("intelligence-unlocked"); setIntelligenceUnlocked(false); }}
                          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p>{t("nav.hideIntelligence")}</p>
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
                          key={item.label} subGroup={item} collapsed={collapsed}
                          isAdmin={isAdmin} isFeatureEnabled={isFeatureEnabled}
                          pathname={pathname} onNavigate={onNavigate} onPrefetch={onPrefetch}
                          userRole={userRole} onUpgradeClick={openUpgradeModal} getMinPlan={getMinPlan}
                        />
                      );
                    }

                    const active = pathname === item.path;
                    const isMeeting = item.path === "/meeting";
                    const showBadge = item.badge === "decisions" && openDecisionCount > 0;

                    return (
                      <Link
                        key={item.path} to={item.path} onClick={onNavigate}
                        onMouseEnter={() => onPrefetch?.(item.path)}
                        className={`relative w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
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
                        <item.icon className={`w-4 h-4 shrink-0 ${active ? "opacity-100" : "opacity-60"}`} />
                        {!collapsed && (
                          <span className="whitespace-nowrap flex-1 flex items-center gap-1.5">
                            {t(item.label)}
                            {isMeeting && hasActiveMeeting && (
                              <span className="inline-flex h-4 items-center px-1 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary animate-pulse">
                                {t("nav.live")}
                              </span>
                            )}
                          </span>
                        )}
                        {showBadge && (
                          <span className="min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                            {openDecisionCount > 99 ? "99+" : openDecisionCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {lockedByPlan.map((item) => (
                    <LockedNavItem
                      key={item.path} item={item} collapsed={collapsed}
                      onUpgradeClick={openUpgradeModal} minPlan={getMinPlan(item.featureKey || "")}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Teams section for full roles */}
        {isFullRole && !collapsed && (
          <div>
            <p className={`label-caps px-2 pb-1.5 pt-4 ${GROUP_ACCENT.teams}`}>
              {t("nav.teamsNav", { defaultValue: "Teams" })}
            </p>
            <div className="space-y-px">
              <Link
                to="/teams" onClick={onNavigate}
                onMouseEnter={() => onPrefetch?.("/teams")}
                className={`relative w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                  pathname === "/teams" || pathname.startsWith("/teams/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                {(pathname === "/teams" || pathname.startsWith("/teams/")) && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Users className="w-4 h-4 shrink-0 opacity-60" />
                <span className="flex-1">{t("nav.teamsNav", { defaultValue: "Teams" })}</span>
              </Link>
              {hasActiveMeeting && (
                <Link
                  to="/meeting" onClick={onNavigate}
                  className={`relative w-full flex items-center gap-2 px-2 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    pathname === "/meeting" ? "bg-primary/10 text-primary" : "text-primary/80 hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  <Video className="w-4 h-4 shrink-0 opacity-80" />
                  <span className="flex-1 flex items-center gap-1.5">
                    {t("nav.meeting")}
                    <span className="inline-flex h-4 items-center px-1 rounded text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary animate-pulse">
                      {t("nav.live")}
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Progressive Level Progress Bar */}
        {progressiveLevel < 3 && !collapsed && (
          <div className="px-3 py-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-[11px] font-semibold text-foreground mb-1.5">
                {progressiveLevel === 1
                  ? `${decisionCount} von 3 Entscheidungen bis mehr Features`
                  : `${decisionCount} von 10 Entscheidungen bis Vollzugriff`}
              </p>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progressiveLevel === 1
                      ? Math.min(100, (decisionCount / 3) * 100)
                      : Math.min(100, (decisionCount / 10) * 100)
                    }%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        )}
      </nav>

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

export { FULL_GROUPS as navGroups };
export default SidebarNav;

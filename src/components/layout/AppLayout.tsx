import { ReactNode, useState, useEffect, memo, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings, LogOut,
  GitBranch, Radar, DollarSign, Shield, Calendar, CalendarDays, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, ChevronLeft, Sun, Moon, LayoutDashboard, UserCog, Menu, X, History, Beaker, Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import UserAvatar from "@/components/shared/UserAvatar";
import NotificationCenter from "./NotificationCenter";
import TeamSwitcher from "./TeamSwitcher";
import CommandPalette from "./CommandPalette";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefetchOnHover } from "@/hooks/usePrefetch";

const navGroups = [
  {
    label: "ÜBERSICHT",
    items: [
      { icon: Target, label: "Executive", path: "/executive", featureKey: "executive" },
      { icon: BarChart3, label: "Dashboard", path: "/dashboard", featureKey: "dashboard" },
      { icon: FileText, label: "Entscheidungen", path: "/decisions", featureKey: "decisions" },
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

/* ── Stable header: logo + theme + collapse ── */
const SidebarHeader = memo(({
  collapsed,
  theme,
  toggleTheme,
  onCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  theme: string;
  toggleTheme: () => void;
  onCollapse: () => void;
  onNavigate?: () => void;
}) => (
  <div className="flex items-center justify-between px-3 h-14 border-b border-border">
    <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={onNavigate}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <LayoutDashboard className="w-4 h-4 text-primary" />
      </div>
      {!collapsed && (
        <span className="font-display font-semibold text-sm tracking-tight whitespace-nowrap">
          DecisionOS
        </span>
      )}
    </Link>
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
        title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onCollapse}
        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </div>
  </div>
));

/* ── Navigation: only part that depends on pathname ── */
const SidebarNav = memo(({
  collapsed,
  isAdmin,
  isFeatureEnabled,
  pathname,
  onNavigate,
  onPrefetch,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
}) => (
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

/* ── Stable footer: user info + sign out ── */
const SidebarFooter = memo(({
  collapsed,
  user,
  avatarUrl,
  onSignOut,
}: {
  collapsed: boolean;
  user: any;
  avatarUrl: string | null;
  onSignOut: () => void;
}) => (
  <>
    <div className="py-2 border-t border-border">
      <NotificationCenter collapsed={collapsed} />
    </div>
    <div className="px-2 py-3 border-t border-border">
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
        <UserAvatar avatarUrl={avatarUrl} fullName={user?.user_metadata?.full_name} email={user?.email} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-[10px] text-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
            <button onClick={onSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  </>
));

/* ── Composed sidebar ── */
const SidebarContent = ({
  collapsed,
  isAdmin,
  isFeatureEnabled,
  pathname,
  user,
  avatarUrl,
  theme,
  toggleTheme,
  onCollapse,
  onSignOut,
  onNavigate,
  onPrefetch,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  user: any;
  avatarUrl: string | null;
  theme: string;
  toggleTheme: () => void;
  onCollapse: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
}) => (
  <>
    <SidebarHeader collapsed={collapsed} theme={theme} toggleTheme={toggleTheme} onCollapse={onCollapse} onNavigate={onNavigate} />
    <TeamSwitcher collapsed={collapsed} />
    <SidebarNav collapsed={collapsed} isAdmin={isAdmin} isFeatureEnabled={isFeatureEnabled} pathname={pathname} onNavigate={onNavigate} onPrefetch={onPrefetch} />
    <SidebarFooter collapsed={collapsed} user={user} avatarUrl={avatarUrl} onSignOut={onSignOut} />
  </>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isEnabled } = useFeatureFlags();
  const isMobile = useIsMobile();
  const prefetch = usePrefetchOnHover();
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for new users
  useEffect(() => {
    if (user && !localStorage.getItem(`onboarding_done_${user.id}`)) {
      setShowOnboarding(true);
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, "true");
    setShowOnboarding(false);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
        setIsAdmin((data?.length ?? 0) > 0);
      });
      supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
        setAvatarUrl(data?.avatar_url || null);
      });
    }
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const sidebarProps = {
    isAdmin,
    isFeatureEnabled: isEnabled,
    pathname: location.pathname,
    user,
    avatarUrl,
    theme,
    toggleTheme,
    onSignOut: handleSignOut,
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Skip to content – Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Zum Inhalt springen
      </a>

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4" role="banner">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-foreground"
            aria-label="Navigation öffnen"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="DecisionOS Startseite">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm">DecisionOS</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground"
            aria-label={theme === "dark" ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-card border-r border-border flex flex-col"
              role="navigation"
              aria-label="Hauptnavigation"
            >
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Navigation schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent
                collapsed={false}
                {...sidebarProps}
                onCollapse={() => {}}
                onNavigate={() => setMobileOpen(false)}
                onPrefetch={prefetch}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{ width: collapsed ? 56 : 240 }}
          className="relative border-r border-border bg-card flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
          role="navigation"
          aria-label="Hauptnavigation"
        >
          <SidebarContent
            collapsed={collapsed}
            {...sidebarProps}
            onCollapse={() => setCollapsed(!collapsed)}
            onPrefetch={prefetch}
          />
        </aside>
      )}

      {/* Main Content with page transition */}
      <main id="main-content" className={`flex-1 overflow-auto ${isMobile ? "pt-14" : ""}`} role="main">
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <CommandPalette />
      <OnboardingTour open={showOnboarding} onComplete={completeOnboarding} />
    </div>
  );
};

export default AppLayout;

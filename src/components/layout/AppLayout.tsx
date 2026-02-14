import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings, LogOut,
  GitBranch, Radar, DollarSign, Shield, Calendar, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, ChevronLeft, Sun, Moon, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import NotificationCenter from "./NotificationCenter";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    label: "ÜBERSICHT",
    items: [
      { icon: Target, label: "Executive", path: "/executive" },
      { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
      { icon: FileText, label: "Entscheidungen", path: "/decisions" },
      { icon: Sun, label: "Briefing", path: "/briefing" },
    ],
  },
  {
    label: "ANALYSE",
    items: [
      { icon: GitBranch, label: "Graph", path: "/graph" },
      { icon: Radar, label: "Bottlenecks", path: "/bottlenecks" },
      { icon: DollarSign, label: "Kosten", path: "/costs" },
      { icon: Flame, label: "Friction", path: "/friction" },
      { icon: Activity, label: "Health", path: "/health" },
      { icon: TrendingUp, label: "Analytics", path: "/analytics" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { icon: Dna, label: "DNA", path: "/dna" },
      { icon: Zap, label: "Engine", path: "/engine" },
      { icon: Trophy, label: "Benchmark", path: "/benchmarking" },
      { icon: FlaskConical, label: "Szenarien", path: "/scenarios" },
      { icon: Calendar, label: "Timeline", path: "/timeline" },
      { icon: Crosshair, label: "Strategie", path: "/strategy" },
    ],
  },
  {
    label: "VERWALTUNG",
    items: [
      { icon: Shield, label: "War Room", path: "/warroom", adminOnly: true },
      { icon: Users, label: "Teams", path: "/teams" },
      { icon: Settings, label: "Einstellungen", path: "/settings" },
    ],
  },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
        setIsAdmin((data?.length ?? 0) > 0);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative border-r border-border bg-card flex flex-col shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LayoutDashboard className="w-4 h-4 text-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-display font-semibold text-sm tracking-tight whitespace-nowrap"
                >
                  DecisionOS
                </motion.span>
              )}
            </AnimatePresence>
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
              onClick={() => setCollapsed(!collapsed)}
              className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => !("adminOnly" in item && item.adminOnly) || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Notifications */}
        <div className="py-2 border-t border-border">
          <NotificationCenter collapsed={collapsed} />
        </div>

        {/* User */}
        <div className="px-2 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-semibold text-primary">{initials}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-[10px] text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                    Online
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

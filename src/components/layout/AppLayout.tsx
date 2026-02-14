import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles, BarChart3, FileText, Users, TrendingUp, Settings, LogOut,
  GitBranch, Radar, DollarSign, Shield, Calendar, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, ChevronLeft, Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    label: "Übersicht",
    items: [
      { icon: Target, label: "Executive", path: "/executive" },
      { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
      { icon: FileText, label: "Decisions", path: "/decisions" },
      { icon: Sun, label: "Briefing", path: "/briefing" },
    ],
  },
  {
    label: "Analyse",
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
    label: "Intelligence",
    items: [
      { icon: Dna, label: "DNA", path: "/dna" },
      { icon: Zap, label: "Engine", path: "/engine" },
      { icon: Trophy, label: "Benchmarking", path: "/benchmarking" },
      { icon: FlaskConical, label: "Szenarien", path: "/scenarios" },
      { icon: Calendar, label: "Timeline", path: "/timeline" },
      { icon: Crosshair, label: "Strategie", path: "/strategy" },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { icon: Shield, label: "War Room", path: "/warroom", adminOnly: true },
      { icon: Users, label: "Teams", path: "/teams" },
      { icon: Settings, label: "Settings", path: "/settings" },
    ],
  },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-display font-bold text-base tracking-tight whitespace-nowrap"
                >
                  DecisionOS
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
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
                      className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50"
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active indicator */}
                        {active && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                          />
                        )}
                        <item.icon className={`w-4 h-4 shrink-0 ${active ? "" : "group-hover:scale-105"} transition-transform`} />
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

        {/* User */}
        <div className="px-3 py-4 border-t border-border/30">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">{initials}</span>
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
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/30">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

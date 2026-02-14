import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, FileText, Users, TrendingUp, Settings, LogOut,
  GitBranch, Radar, DollarSign, Shield, Calendar, Crosshair, Flame, Activity,
  Dna, Zap, Trophy, FlaskConical, Target, ChevronLeft, Sun, Terminal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    label: "COMMAND",
    items: [
      { icon: Target, label: "Executive", path: "/executive" },
      { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
      { icon: FileText, label: "Decisions", path: "/decisions" },
      { icon: Sun, label: "Briefing", path: "/briefing" },
    ],
  },
  {
    label: "ANALYSIS",
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
    label: "INTEL",
    items: [
      { icon: Dna, label: "DNA", path: "/dna" },
      { icon: Zap, label: "Engine", path: "/engine" },
      { icon: Trophy, label: "Benchmark", path: "/benchmarking" },
      { icon: FlaskConical, label: "Scenarios", path: "/scenarios" },
      { icon: Calendar, label: "Timeline", path: "/timeline" },
      { icon: Crosshair, label: "Strategy", path: "/strategy" },
    ],
  },
  {
    label: "SYSTEM",
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
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — Command Strip */}
      <motion.aside
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative border-r border-border bg-card flex flex-col shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-display font-semibold text-sm tracking-tight whitespace-nowrap text-primary"
                >
                  DecisionOS
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
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
                      className="px-2 mb-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-px">
                  {visibleItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 group relative ${
                          active
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0" />
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
        <div className="px-2 py-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors">
            <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-primary">{initials}</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-[9px] text-primary/60">● online</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/30">
                <LogOut className="w-3.5 h-3.5" />
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

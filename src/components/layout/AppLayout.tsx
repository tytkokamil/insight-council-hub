import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Sun,
  GitBranch,
  Radar,
  DollarSign,
  Shield,
  Calendar,
  Crosshair,
  Flame,
  Activity,
  Dna,
  Zap,
  Trophy,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Decisions", path: "/decisions" },
  { icon: GitBranch, label: "Graph", path: "/graph" },
  { icon: Radar, label: "Bottlenecks", path: "/bottlenecks" },
  { icon: DollarSign, label: "Kosten", path: "/costs" },
  { icon: Shield, label: "War Room", path: "/warroom", adminOnly: true },
  { icon: Calendar, label: "Timeline", path: "/timeline" },
  { icon: Crosshair, label: "Strategie", path: "/strategy" },
  { icon: Flame, label: "Friction", path: "/friction" },
  { icon: Activity, label: "Health", path: "/health" },
  { icon: Dna, label: "DNA", path: "/dna" },
  { icon: Zap, label: "Engine", path: "/engine" },
  { icon: Trophy, label: "Benchmarking", path: "/benchmarking" },
  { icon: FlaskConical, label: "Szenarien", path: "/scenarios" },
  { icon: Sun, label: "Briefing", path: "/briefing" },
  { icon: Users, label: "Teams", path: "/teams" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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
      <aside className="w-64 border-r border-border bg-card/50 p-4 flex flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg">DecisionOS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.filter(item => !("adminOnly" in item && item.adminOnly) || isAdmin).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
};

export default AppLayout;

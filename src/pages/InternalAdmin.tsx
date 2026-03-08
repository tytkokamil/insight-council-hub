import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, BarChart3, Building2, Users, Flag, Rocket, Settings, MessageSquare, Map, HeartPulse } from "lucide-react";
import AdminOverviewTab from "@/components/internal-admin/AdminOverviewTab";
import AdminOrgsTab from "@/components/internal-admin/AdminOrgsTab";
import AdminUsersTab from "@/components/internal-admin/AdminUsersTab";
import AdminFeatureFlagsTab from "@/components/internal-admin/AdminFeatureFlagsTab";
import AdminPilotsTab from "@/components/internal-admin/AdminPilotsTab";
import AdminSystemTab from "@/components/internal-admin/AdminSystemTab";
import AdminFeedbackTab from "@/components/internal-admin/AdminFeedbackTab";
import AdminRoadmapTab from "@/components/internal-admin/AdminRoadmapTab";
import AdminChurnTab from "@/components/internal-admin/AdminChurnTab";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Übersicht", icon: BarChart3 },
  { id: "orgs", label: "Organisationen", icon: Building2 },
  { id: "users", label: "Nutzer", icon: Users },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "flags", label: "Feature Flags", icon: Flag },
  { id: "pilots", label: "Pilot-Kunden", icon: Rocket },
  { id: "system", label: "System", icon: Settings },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "churn", label: "Churn Risk", icon: HeartPulse },
] as const;

type TabId = (typeof TABS)[number]["id"];

const InternalAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase
      .from("platform_admins" as any)
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        const admin = !!data;
        setIsAdmin(admin);
        if (!admin) navigate("/dashboard", { replace: true });
      });
  }, [user, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030810" }}>
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: "#030810", color: "#e2e8f0" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 h-12 border-b"
        style={{ background: "#0A0F1A", borderColor: "#1e293b", borderLeft: "4px solid #EF4444" }}
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold tracking-tight text-white">Decivio Internal Admin</span>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: "#EF4444", color: "#fff" }}
          >
            ⚠ INTERN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 tabular-nums">{user.email}</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className="sticky top-12 h-[calc(100vh-48px)] flex-shrink-0 border-r flex flex-col gap-0.5 p-2"
          style={{ width: 200, background: "#0A0F1A", borderColor: "#1e293b" }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-red-500/10 text-red-400 font-medium"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-6 overflow-auto" style={{ maxHeight: "calc(100vh - 48px)" }}>
          {activeTab === "overview" && <AdminOverviewTab />}
          {activeTab === "orgs" && <AdminOrgsTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "feedback" && <AdminFeedbackTab />}
          {activeTab === "flags" && <AdminFeatureFlagsTab />}
          {activeTab === "pilots" && <AdminPilotsTab />}
          {activeTab === "system" && <AdminSystemTab />}
          {activeTab === "roadmap" && <AdminRoadmapTab />}
          {activeTab === "churn" && <AdminChurnTab />}
        </main>
      </div>
    </div>
  );
};

export default InternalAdmin;

import { memo, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import NotificationCenter from "./NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface SidebarFooterProps {
  collapsed: boolean;
  user: any;
  avatarUrl: string | null;
  onSignOut: () => void;
}

const SidebarFooter = memo(({
  collapsed,
  user,
  avatarUrl,
  onSignOut,
}: SidebarFooterProps) => {
  const { t } = useTranslation();
  const [rolePlan, setRolePlan] = useState<{ role: string; plan: string }>({ role: "", plan: "" });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("org_id").eq("user_id", user.id).maybeSingle(),
      ]);
      let plan = "Free";
      if (profileData?.org_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("plan")
          .eq("id", profileData.org_id)
          .maybeSingle();
        if (orgData?.plan) plan = orgData.plan.charAt(0).toUpperCase() + orgData.plan.slice(1);
      }
      const roleMap: Record<string, string> = {
        org_owner: "Org Owner",
        org_admin: "Org Admin",
        org_member: "Member",
      };
      setRolePlan({
        role: roleMap[roleData?.role || ""] || "Member",
        plan,
      });
    };
    load();
  }, [user?.id]);

  return (
    <>
      <div className="py-1.5 border-t border-border/40">
        <NotificationCenter collapsed={collapsed} />
      </div>
      <div className="px-2 py-2 border-t border-border/40">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] transition-colors">
          <UserAvatar avatarUrl={avatarUrl} fullName={user?.user_metadata?.full_name} email={user?.email} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate text-foreground">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {rolePlan.role} · {rolePlan.plan}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 rounded-md hover:bg-foreground/[0.04]"
                title={t("auth.signIn") === "Sign In" ? "Sign out" : "Abmelden"}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
});

SidebarFooter.displayName = "SidebarFooter";

export default SidebarFooter;

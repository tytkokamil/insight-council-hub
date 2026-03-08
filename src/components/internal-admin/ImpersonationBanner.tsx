import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shows a red warning banner when a platform admin is impersonating an org.
 * Stores impersonation state in sessionStorage so it persists across navigations
 * but clears when the browser tab closes.
 */
const ImpersonationBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [impersonation, setImpersonation] = useState<{ orgName: string; orgId: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_impersonation");
    if (stored) {
      try {
        setImpersonation(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, []);

  if (!impersonation || !user) return null;

  const endImpersonation = () => {
    sessionStorage.removeItem("admin_impersonation");
    setImpersonation(null);
    navigate("/internal-admin", { replace: true });
  };

  return (
    <div
      className="sticky top-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2"
      style={{ background: "#DC2626", color: "#fff" }}
    >
      <ShieldAlert className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">
        ⚠️ ADMIN-ANSICHT: Sie sehen die Plattform als <strong>{impersonation.orgName}</strong>. Ihre Aktionen werden protokolliert.
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={endImpersonation}
        className="h-6 text-xs border-white/40 text-white hover:bg-white/20 hover:text-white ml-2"
      >
        Impersonation beenden
      </Button>
    </div>
  );
};

export default ImpersonationBanner;

/**
 * Helper to start impersonation — call from AdminOrgsTab
 * Sets sessionStorage and logs to platform_admin_logs
 */
export async function startImpersonation(adminUserId: string, orgId: string, orgName: string) {
  sessionStorage.setItem("admin_impersonation", JSON.stringify({ orgId, orgName }));

  // Log to platform_admin_logs
  await supabase.from("platform_admin_logs" as any).insert({
    admin_user_id: adminUserId,
    action: "impersonation_start",
    target_type: "organization",
    target_id: orgId,
    details: `Impersonation gestartet: ${orgName}`,
  } as any);
}

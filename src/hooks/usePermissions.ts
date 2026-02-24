import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type OrgRoleKey = "org_owner" | "org_admin" | "org_executive" | "org_member" | "org_reviewer" | "org_viewer";

const ROLE_HIERARCHY: OrgRoleKey[] = [
  "org_viewer",
  "org_reviewer",
  "org_member",
  "org_executive",
  "org_admin",
  "org_owner",
];

function roleLevel(r: OrgRoleKey): number {
  return ROLE_HIERARCHY.indexOf(r);
}

function hasMinRole(current: OrgRoleKey, min: OrgRoleKey): boolean {
  return roleLevel(current) >= roleLevel(min);
}

export const ROLE_LABELS: Record<OrgRoleKey, string> = {
  org_owner: "Owner",
  org_admin: "Admin",
  org_executive: "Executive",
  org_member: "Member",
  org_reviewer: "Reviewer",
  org_viewer: "Viewer",
};

export const ROLE_LABELS_DE: Record<OrgRoleKey, string> = {
  org_owner: "Eigentümer",
  org_admin: "Administrator",
  org_executive: "Executive",
  org_member: "Mitglied",
  org_reviewer: "Reviewer",
  org_viewer: "Betrachter",
};

export interface Permissions {
  // Decisions
  createDecision: boolean;
  editOwnDecision: boolean;
  editAnyDecision: boolean;
  deleteDecision: boolean;
  changeStatus: boolean;

  // Reviews & Comments
  submitReview: boolean;
  assignReviewer: boolean;
  writeComments: boolean;

  // Tasks & Risks
  createTask: boolean;
  editTask: boolean;
  createRisk: boolean;
  readRiskRegister: boolean;

  // Analytics & Intelligence
  viewAnalytics: boolean;
  viewExecutiveHub: boolean;
  viewProcessHub: boolean;

  // Governance & System
  manageTemplates: boolean;
  useTemplates: boolean;
  manageSLA: boolean;
  manageAutomations: boolean;
  viewAuditTrail: boolean;

  // User Management & Org
  manageUsers: boolean;
  assignRoles: boolean;
  assignOwner: boolean;
  manageBilling: boolean;
  manageOrgSettings: boolean;
}

export function usePermissions() {
  const { user } = useAuth();
  const [role, setRole] = useState<OrgRoleKey>("org_member");
  const [loading, setLoading] = useState(true);
  const [decisionCount, setDecisionCount] = useState(0);
  const [progressiveOverride, setProgressiveOverride] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchRole = async () => {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
        supabase.from("profiles").select("decision_count, progressive_override").eq("user_id", user.id).single(),
      ]);

      if (roleRes.data) setRole(roleRes.data.role as OrgRoleKey);
      if (profileRes.data) {
        setDecisionCount(profileRes.data.decision_count ?? 0);
        setProgressiveOverride(profileRes.data.progressive_override ?? false);
      }
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  const can = useMemo<Permissions>(() => {
    const r = role;
    return {
      // Decisions
      createDecision: hasMinRole(r, "org_member"),
      editOwnDecision: hasMinRole(r, "org_member"),
      editAnyDecision: hasMinRole(r, "org_admin"),
      deleteDecision: hasMinRole(r, "org_admin"),
      changeStatus: hasMinRole(r, "org_member"),

      // Reviews & Comments
      submitReview: ["org_owner", "org_admin", "org_member", "org_reviewer"].includes(r),
      assignReviewer: hasMinRole(r, "org_member"),
      writeComments: ["org_owner", "org_admin", "org_member", "org_reviewer"].includes(r),

      // Tasks & Risks
      createTask: hasMinRole(r, "org_member"),
      editTask: hasMinRole(r, "org_member"),
      createRisk: hasMinRole(r, "org_member"),
      readRiskRegister: hasMinRole(r, "org_executive") || (r === "org_member"),

      // Analytics & Intelligence
      viewAnalytics: hasMinRole(r, "org_executive"),
      viewExecutiveHub: hasMinRole(r, "org_executive"),
      viewProcessHub: hasMinRole(r, "org_executive"),

      // Governance & System
      manageTemplates: hasMinRole(r, "org_admin"),
      useTemplates: hasMinRole(r, "org_member"),
      manageSLA: hasMinRole(r, "org_admin"),
      manageAutomations: hasMinRole(r, "org_admin"),
      viewAuditTrail: hasMinRole(r, "org_admin"),

      // User Management & Org
      manageUsers: hasMinRole(r, "org_admin"),
      assignRoles: hasMinRole(r, "org_admin"),
      assignOwner: r === "org_owner",
      manageBilling: r === "org_owner",
      manageOrgSettings: hasMinRole(r, "org_admin"),
    };
  }, [role]);

  const isAdmin = hasMinRole(role, "org_admin");
  const isExecutive = hasMinRole(role, "org_executive");

  return {
    role,
    can,
    loading,
    isAdmin,
    isExecutive,
    decisionCount,
    progressiveOverride,
    ROLE_LABELS,
    ROLE_LABELS_DE,
  };
}

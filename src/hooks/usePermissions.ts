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

/** All granular permission keys */
export type PermissionKey =
  | "decisions.read" | "decisions.create" | "decisions.edit_own" | "decisions.edit_any" | "decisions.delete" | "decisions.change_status"
  | "reviews.submit" | "reviews.assign" | "comments.write"
  | "tasks.create" | "tasks.edit" | "risks.create" | "risks.read"
  | "analytics.view" | "executive.hub" | "process.hub"
  | "templates.manage" | "templates.use" | "sla.manage" | "automations.manage" | "audit.read"
  | "users.manage" | "roles.assign" | "owner.assign" | "billing.manage" | "org.settings";

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

/** Map from PermissionKey to Permissions field */
const PERMISSION_MAP: Record<string, keyof Permissions> = {
  "decisions.create": "createDecision",
  "decisions.edit_own": "editOwnDecision",
  "decisions.edit_any": "editAnyDecision",
  "decisions.delete": "deleteDecision",
  "decisions.change_status": "changeStatus",
  "reviews.submit": "submitReview",
  "reviews.assign": "assignReviewer",
  "comments.write": "writeComments",
  "tasks.create": "createTask",
  "tasks.edit": "editTask",
  "risks.create": "createRisk",
  "risks.read": "readRiskRegister",
  "analytics.view": "viewAnalytics",
  "executive.hub": "viewExecutiveHub",
  "process.hub": "viewProcessHub",
  "templates.manage": "manageTemplates",
  "templates.use": "useTemplates",
  "sla.manage": "manageSLA",
  "automations.manage": "manageAutomations",
  "audit.read": "viewAuditTrail",
  "users.manage": "manageUsers",
  "roles.assign": "assignRoles",
  "owner.assign": "assignOwner",
  "billing.manage": "manageBilling",
  "org.settings": "manageOrgSettings",
};

/** Default permissions based on role hierarchy (hardcoded baseline) */
function getDefaultPermissions(r: OrgRoleKey): Permissions {
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
    readRiskRegister: hasMinRole(r, "org_executive") || r === "org_member",

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
}

export function usePermissions() {
  const { user } = useAuth();
  const [role, setRole] = useState<OrgRoleKey>("org_member");
  const [loading, setLoading] = useState(true);
  const [decisionCount, setDecisionCount] = useState(0);
  const [progressiveOverride, setProgressiveOverride] = useState(false);
  const [customOverrides, setCustomOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchAll = async () => {
      // Step 1: Get role and profile
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
        supabase.from("profiles").select("decision_count, progressive_override, org_id").eq("user_id", user.id).single(),
      ]);

      const userRole = (roleRes.data?.role as OrgRoleKey) || "org_member";
      setRole(userRole);

      if (profileRes.data) {
        setDecisionCount(profileRes.data.decision_count ?? 0);
        setProgressiveOverride(profileRes.data.progressive_override ?? false);
      }

      // Step 2: Fetch custom permission overrides for this role
      const { data: overridesData } = await supabase
        .from("role_permissions")
        .select("permission, enabled, org_id")
        .eq("role", userRole);

      if (overridesData && overridesData.length > 0) {
        const orgId = profileRes.data?.org_id;
        const overrides: Record<string, boolean> = {};

        // Global defaults (org_id IS NULL)
        for (const row of overridesData) {
          if (row.org_id === null) {
            overrides[row.permission] = row.enabled;
          }
        }

        // Org-specific overrides take priority
        if (orgId) {
          for (const row of overridesData) {
            if (row.org_id === orgId) {
              overrides[row.permission] = row.enabled;
            }
          }
        }

        setCustomOverrides(overrides);
      }

      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const can = useMemo<Permissions>(() => {
    const defaults = getDefaultPermissions(role);

    // Apply custom overrides from role_permissions table
    const result = { ...defaults };
    for (const [permKey, fieldName] of Object.entries(PERMISSION_MAP)) {
      if (permKey in customOverrides) {
        result[fieldName] = customOverrides[permKey];
      }
    }

    return result;
  }, [role, customOverrides]);

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

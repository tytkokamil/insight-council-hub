import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useCallback } from "react";
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
  createDecision: boolean;
  editOwnDecision: boolean;
  editAnyDecision: boolean;
  deleteDecision: boolean;
  changeStatus: boolean;
  submitReview: boolean;
  assignReviewer: boolean;
  writeComments: boolean;
  createTask: boolean;
  editTask: boolean;
  createRisk: boolean;
  readRiskRegister: boolean;
  viewAnalytics: boolean;
  viewExecutiveHub: boolean;
  viewProcessHub: boolean;
  manageTemplates: boolean;
  useTemplates: boolean;
  manageSLA: boolean;
  manageAutomations: boolean;
  viewAuditTrail: boolean;
  manageUsers: boolean;
  assignRoles: boolean;
  assignOwner: boolean;
  manageBilling: boolean;
  manageOrgSettings: boolean;
}

/** Map from PermissionKey to Permissions field */
export const PERMISSION_MAP: Record<string, keyof Permissions> = {
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

/** Reverse map: Permissions field → PermissionKey */
export const PERMISSION_KEY_MAP: Record<keyof Permissions, string> = Object.fromEntries(
  Object.entries(PERMISSION_MAP).map(([k, v]) => [v, k])
) as Record<keyof Permissions, string>;

/** All permission keys grouped by category for Admin UI */
export const PERMISSION_CATEGORIES: Record<string, { label: string; labelDe: string; keys: PermissionKey[] }> = {
  decisions: {
    label: "Decisions",
    labelDe: "Entscheidungen",
    keys: ["decisions.read", "decisions.create", "decisions.edit_own", "decisions.edit_any", "decisions.delete", "decisions.change_status"],
  },
  reviews: {
    label: "Reviews & Comments",
    labelDe: "Reviews & Kommentare",
    keys: ["reviews.submit", "reviews.assign", "comments.write"],
  },
  tasks: {
    label: "Tasks & Risks",
    labelDe: "Aufgaben & Risiken",
    keys: ["tasks.create", "tasks.edit", "risks.create", "risks.read"],
  },
  analytics: {
    label: "Analytics & Intelligence",
    labelDe: "Analytik & Intelligence",
    keys: ["analytics.view", "executive.hub", "process.hub"],
  },
  governance: {
    label: "Governance & System",
    labelDe: "Governance & System",
    keys: ["templates.manage", "templates.use", "sla.manage", "automations.manage", "audit.read"],
  },
  admin: {
    label: "User Management & Org",
    labelDe: "Benutzerverwaltung & Org",
    keys: ["users.manage", "roles.assign", "owner.assign", "billing.manage", "org.settings"],
  },
};

/** Default permissions based on role hierarchy (hardcoded baseline) */
export function getDefaultPermissions(r: OrgRoleKey): Permissions {
  return {
    createDecision: hasMinRole(r, "org_member"),
    editOwnDecision: hasMinRole(r, "org_member"),
    editAnyDecision: hasMinRole(r, "org_admin"),
    deleteDecision: hasMinRole(r, "org_admin"),
    changeStatus: hasMinRole(r, "org_member"),
    submitReview: ["org_owner", "org_admin", "org_member", "org_reviewer"].includes(r),
    assignReviewer: hasMinRole(r, "org_member"),
    writeComments: ["org_owner", "org_admin", "org_member", "org_reviewer"].includes(r),
    createTask: hasMinRole(r, "org_member"),
    editTask: hasMinRole(r, "org_member"),
    createRisk: hasMinRole(r, "org_member"),
    readRiskRegister: hasMinRole(r, "org_executive") || r === "org_member",
    viewAnalytics: hasMinRole(r, "org_executive"),
    viewExecutiveHub: hasMinRole(r, "org_executive"),
    viewProcessHub: hasMinRole(r, "org_executive"),
    manageTemplates: hasMinRole(r, "org_admin"),
    useTemplates: hasMinRole(r, "org_member"),
    manageSLA: hasMinRole(r, "org_admin"),
    manageAutomations: hasMinRole(r, "org_admin"),
    viewAuditTrail: hasMinRole(r, "org_admin"),
    manageUsers: hasMinRole(r, "org_admin"),
    assignRoles: hasMinRole(r, "org_admin"),
    assignOwner: r === "org_owner",
    manageBilling: r === "org_owner",
    manageOrgSettings: hasMinRole(r, "org_admin"),
  };
}

/* ── Progressive Disclosure stages ── */
export type ProgressiveStage = 1 | 2 | 3;

/** Stage 1 features — always visible */
const STAGE_1_FEATURES = new Set(["dashboard", "decisions", "tasks", "calendar", "search", "teams", "meeting"]);
/** Stage 2 features — after 10 decisions */
const STAGE_2_FEATURES = new Set(["risks", "templates", "audit", "automations", "engine", "strategy", "archive"]);
/** Stage 3 features — after 25 decisions (intelligence, executive) */
// Everything else is stage 3

const STAGE_2_THRESHOLD = 10;
const STAGE_3_THRESHOLD = 25;

export function getProgressiveStage(decisionCount: number): ProgressiveStage {
  if (decisionCount >= STAGE_3_THRESHOLD) return 3;
  if (decisionCount >= STAGE_2_THRESHOLD) return 2;
  return 1;
}

/* ── Context ── */

interface PermissionsContextType {
  role: OrgRoleKey;
  can: Permissions;
  loading: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  decisionCount: number;
  progressiveOverride: boolean;
  progressiveStage: ProgressiveStage;
  /** Combined check: role + plan (feature flag) + progressive disclosure */
  isFeatureVisible: (featureKey: string, isFeatureEnabled: (key: string) => boolean) => boolean;
  refetch: () => void;
  ROLE_LABELS: typeof ROLE_LABELS;
  ROLE_LABELS_DE: typeof ROLE_LABELS_DE;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<OrgRoleKey>("org_member");
  const [loading, setLoading] = useState(true);
  const [decisionCount, setDecisionCount] = useState(0);
  const [progressiveOverride, setProgressiveOverride] = useState(false);
  const [customOverrides, setCustomOverrides] = useState<Record<string, boolean>>({});

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("decision_count, progressive_override, org_id").eq("user_id", user.id).single(),
    ]);

    // Pick highest role if multiple exist
    const roles = (roleRes.data || []).map(r => r.role as OrgRoleKey);
    const userRole = roles.length > 0
      ? roles.reduce((best, r) => ROLE_HIERARCHY.indexOf(r) > ROLE_HIERARCHY.indexOf(best) ? r : best, roles[0])
      : "org_member" as OrgRoleKey;
    setRole(userRole);

    if (profileRes.data) {
      setDecisionCount(profileRes.data.decision_count ?? 0);
      setProgressiveOverride(profileRes.data.progressive_override ?? false);
    }

    // Fetch custom permission overrides for this role
    const { data: overridesData } = await supabase
      .from("role_permissions")
      .select("permission, enabled, org_id")
      .eq("role", userRole);

    if (overridesData && overridesData.length > 0) {
      const orgId = profileRes.data?.org_id;
      const overrides: Record<string, boolean> = {};

      for (const row of overridesData) {
        if (row.org_id === null) overrides[row.permission] = row.enabled;
      }
      if (orgId) {
        for (const row of overridesData) {
          if (row.org_id === orgId) overrides[row.permission] = row.enabled;
        }
      }
      setCustomOverrides(overrides);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const can = useMemo<Permissions>(() => {
    const defaults = getDefaultPermissions(role);
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
  const progressiveStage = getProgressiveStage(decisionCount);

  /** Combined visibility check: role permission + feature flag + progressive disclosure */
  const isFeatureVisible = useCallback((featureKey: string, isFeatureEnabled: (key: string) => boolean) => {
    // Feature flag check (plan-based)
    if (!isFeatureEnabled(featureKey)) return false;

    // Progressive override skips stage gating
    if (progressiveOverride) return true;

    // All stages are now accessible — progressive hint is shown in sidebar instead of hard gating
    if (STAGE_1_FEATURES.has(featureKey)) return true;
    if (STAGE_2_FEATURES.has(featureKey)) return progressiveStage >= 2;
    // Stage 3 (Intelligence) — always accessible, sidebar shows recommendation hint
    return true;
  }, [progressiveOverride, progressiveStage]);

  const value = useMemo<PermissionsContextType>(() => ({
    role, can, loading, isAdmin, isExecutive, decisionCount,
    progressiveOverride, progressiveStage, isFeatureVisible, refetch: fetchAll,
    ROLE_LABELS, ROLE_LABELS_DE,
  }), [role, can, loading, isAdmin, isExecutive, decisionCount, progressiveOverride, progressiveStage, isFeatureVisible, fetchAll]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context) return context;

  // Fallback for usage outside provider (shouldn't happen in normal flow)
  throw new Error("usePermissions must be used within PermissionsProvider");
}

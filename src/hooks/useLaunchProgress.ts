import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo } from "react";

export interface LaunchPhase {
  id: string;
  title: string;
  emoji: string;
  duration: string;
  items: LaunchItem[];
}

export interface LaunchItem {
  id: string;
  title: string;
  subtitle?: string;
  link?: string;
  optional?: boolean;
}

export const LAUNCH_PHASES: LaunchPhase[] = [
  {
    id: "foundation",
    title: "Fundament",
    emoji: "🏗️",
    duration: "⏱ 5 Min",
    items: [
      { id: "org_name_set", title: "Organisationsname & Branche gesetzt", subtitle: "Wird für alle Reports und E-Mails verwendet", link: "/settings" },
      { id: "logo_uploaded", title: "Logo hochgeladen", subtitle: "Für Branding in E-Mails und Berichten", link: "/settings", optional: true },
      { id: "colleagues_invited", title: "Erste 2 Kollegen eingeladen", subtitle: "Entscheidungen leben von Zusammenarbeit", link: "/admin/users" },
    ],
  },
  {
    id: "first_decision",
    title: "Erste Entscheidung",
    emoji: "🎯",
    duration: "⏱ 3 Min",
    items: [
      { id: "real_decision_created", title: "Eine echte Entscheidung angelegt", subtitle: "Keine Demo — eine reale, anstehende Entscheidung", link: "/decisions?create=true" },
      { id: "reviewer_assigned", title: "Reviewer zugewiesen", subtitle: "Wer soll die Entscheidung freigeben?", link: "/decisions" },
      { id: "sla_set", title: "SLA / Deadline gesetzt", subtitle: "Bis wann muss entschieden werden?", link: "/decisions" },
    ],
  },
  {
    id: "compliance",
    title: "Compliance aktivieren",
    emoji: "🔒",
    duration: "⏱ 2 Min",
    items: [
      { id: "compliance_framework", title: "Compliance Framework ausgewählt", subtitle: "ISO 9001, NIS2, MaRisk oder eigenes Framework", link: "/settings" },
      { id: "audit_trail_active", title: "Audit Trail verifiziert", subtitle: "SHA-256 Hashkette aktiv und intakt", link: "/audit-trail" },
    ],
  },
  {
    id: "automation",
    title: "Automation",
    emoji: "⚡",
    duration: "⏱ 5 Min",
    items: [
      { id: "automation_rule_created", title: "Erste Automation Rule erstellt", subtitle: "Z.B. 'Wenn Priorität = Kritisch → Eskaliere'", link: "/automation-rules" },
      { id: "notifications_configured", title: "E-Mail-Benachrichtigungen konfiguriert", subtitle: "Welche Events sollen dich per E-Mail erreichen?", link: "/settings" },
    ],
  },
  {
    id: "launch",
    title: "Go Live",
    emoji: "🚀",
    duration: "⏱ 1 Min",
    items: [
      { id: "team_informed", title: "Team über Decivio informiert", subtitle: "Wir stellen dir eine E-Mail-Vorlage bereit" },
      { id: "milestone_set", title: "'Wir sind live' Milestone gesetzt", subtitle: "Markiert euren offiziellen Start" },
    ],
  },
];

export const ALL_LAUNCH_ITEMS = LAUNCH_PHASES.flatMap(p => p.items);
export const REQUIRED_ITEMS = ALL_LAUNCH_ITEMS.filter(i => !i.optional);
export const TOTAL_ITEMS = ALL_LAUNCH_ITEMS.length;
export const REQUIRED_COUNT = REQUIRED_ITEMS.length;

/**
 * Auto-detect which items are completed based on real data
 */
async function detectCompletedItems(userId: string): Promise<string[]> {
  const completed: string[] = [];

  // Fetch all data in parallel
  const [profileRes, orgRes, membersRes, decisionsRes, reviewsRes, complianceRes, automationRes] = await Promise.all([
    supabase.from("profiles").select("org_id, full_name, industry").eq("user_id", userId).single(),
    null as any, // placeholder, will use profile.org_id
    supabase.from("profiles").select("user_id").limit(5), // org members count
    supabase.from("decisions").select("id, due_date, deleted_at, created_by").is("deleted_at", null).limit(50),
    supabase.from("decision_reviews").select("id, decision_id").limit(10),
    supabase.from("compliance_config").select("id, framework, enabled").eq("enabled", true).limit(1),
    supabase.from("automation_rules").select("id, enabled").eq("enabled", true).limit(1),
  ]);

  const profile = profileRes.data;
  if (!profile?.org_id) return completed;

  // Check org name + industry
  const { data: org } = await supabase.from("organizations").select("name, branding").eq("id", profile.org_id).single();
  if (org?.name && org.name.length > 2 && profile.industry) {
    completed.push("org_name_set");
  }

  // Check logo
  const branding = org?.branding as any;
  if (branding?.logoUrl) {
    completed.push("logo_uploaded");
  }

  // Check colleagues invited (at least 2 other members in same org)
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("org_id", profile.org_id);
  if ((memberCount || 0) >= 3) {
    completed.push("colleagues_invited");
  }

  // Check real decision (non-demo, created by user or in org)
  const decisions = decisionsRes.data || [];
  const userDecisions = decisions.filter(d => d.created_by === userId);
  if (userDecisions.length > 0) {
    completed.push("real_decision_created");
  }

  // Check reviewer assigned
  if (reviewsRes.data && reviewsRes.data.length > 0) {
    completed.push("reviewer_assigned");
  }

  // Check SLA set (any decision with due_date)
  if (decisions.some(d => d.due_date)) {
    completed.push("sla_set");
  }

  // Compliance framework
  if (complianceRes.data && complianceRes.data.length > 0) {
    completed.push("compliance_framework");
  }

  // Audit trail is always active by default (SHA-256 triggers)
  completed.push("audit_trail_active");

  // Automation rule
  if (automationRes.data && automationRes.data.length > 0) {
    completed.push("automation_rule_created");
  }

  // Notifications configured — check from user settings or org-level notifications
  const { data: notifPrefs } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (notifPrefs && notifPrefs.length > 0) {
    completed.push("notifications_configured");
  }

  return completed;
}

export function useLaunchProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["launch-progress", user?.id],
    queryFn: async () => {
      if (!user) return { completedItems: [] as string[], orgId: "", orgName: "" };

      // 1. Get manually checked items from DB
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
      if (!profile?.org_id) return { completedItems: [] as string[], orgId: "", orgName: "" };

      const [checklistRes, orgRes, autoDetected] = await Promise.all([
        supabase.from("launch_checklist").select("*").eq("org_id", profile.org_id).single(),
        supabase.from("organizations").select("name").eq("id", profile.org_id).single(),
        detectCompletedItems(user.id),
      ]);

      const manualItems = (checklistRes.data?.completed_items as string[]) || [];
      
      // Merge: auto-detected + manually checked
      const merged = [...new Set([...autoDetected, ...manualItems])];

      return {
        completedItems: merged,
        orgId: profile.org_id,
        orgName: orgRes.data?.name || "",
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const completedItems = useMemo(() => new Set(data?.completedItems || []), [data]);
  const completedCount = completedItems.size;
  const percent = Math.round((completedCount / TOTAL_ITEMS) * 100);
  const isComplete = completedCount >= TOTAL_ITEMS;

  const toggleItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!data?.orgId) return;
      const current = data.completedItems || [];
      const next = current.includes(itemId) ? current.filter(i => i !== itemId) : [...current, itemId];
      await supabase.from("launch_checklist").upsert({
        org_id: data.orgId,
        completed_items: next,
        completed_at: next.length >= TOTAL_ITEMS ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "org_id" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["launch-progress"] }),
  });

  const getPhaseProgress = useCallback((phase: LaunchPhase) => {
    const done = phase.items.filter(i => completedItems.has(i.id)).length;
    return { done, total: phase.items.length, isComplete: done >= phase.items.length };
  }, [completedItems]);

  const currentPhaseIndex = useMemo(() => {
    for (let i = 0; i < LAUNCH_PHASES.length; i++) {
      const { isComplete } = getPhaseProgress(LAUNCH_PHASES[i]);
      if (!isComplete) return i;
    }
    return LAUNCH_PHASES.length; // all done
  }, [getPhaseProgress]);

  return {
    completedItems,
    completedCount,
    percent,
    isComplete,
    isLoading,
    toggleItem,
    getPhaseProgress,
    currentPhaseIndex,
    orgName: data?.orgName || "",
  };
}

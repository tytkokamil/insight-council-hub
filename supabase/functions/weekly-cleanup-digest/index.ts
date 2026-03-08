import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth guard — internal/cron only
  const secret = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
  const provided = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (!secret || !timingSafeEqual(provided, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: orgs } = await supabase.from("organizations").select("id, name").eq("is_active", true);
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No active organizations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalDigestsSent = 0;
    const now = new Date();
    const DEAD_THRESHOLD = 14;
    const STUCK_THRESHOLD = 5;
    const REVIEW_STALE_DAYS = 3;
    const appUrl = "https://app.decivio.com";

    for (const org of orgs) {
      // Find org admins/owners
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("org_id", org.id)
        .in("role", ["org_admin", "org_owner"]);

      if (!adminRoles || adminRoles.length === 0) continue;

      // Check opt-out: filter admins who have digest enabled
      const adminIds = adminRoles.map(r => r.user_id);
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("user_id, digest_frequency")
        .in("user_id", adminIds);

      const prefsMap = new Map((prefs || []).map((p: any) => [p.user_id, p.digest_frequency]));
      const eligibleAdmins = adminIds.filter(id => {
        const freq = prefsMap.get(id);
        // Default is opted-in; only skip if explicitly set to "none"
        return freq !== "none";
      });

      if (eligibleAdmins.length === 0) continue;

      // Get active decisions for this org
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title, status, last_activity_at, updated_at, due_date, cost_per_day, owner_id, assignee_id")
        .eq("org_id", org.id)
        .is("deleted_at", null)
        .is("archived_at", null)
        .not("status", "in", '("implemented","rejected","archived","cancelled","superseded")');

      // Get stale reviews (no response > 3 days)
      const { data: staleReviews } = await supabase
        .from("decision_reviews")
        .select("id, decision_id, reviewer_id, created_at")
        .is("reviewed_at", null)
        .order("created_at", { ascending: true });

      const staleReviewList = (staleReviews || []).filter(r => {
        const daysPending = Math.floor((now.getTime() - new Date(r.created_at).getTime()) / 86400000);
        return daysPending >= REVIEW_STALE_DAYS;
      });

      // Get decision titles for stale reviews
      const staleDecisionIds = [...new Set(staleReviewList.map(r => r.decision_id))];
      let staleDecisionTitles: Record<string, string> = {};
      if (staleDecisionIds.length > 0) {
        const { data: staleDecisions } = await supabase
          .from("decisions")
          .select("id, title")
          .in("id", staleDecisionIds)
          .eq("org_id", org.id);
        staleDecisionTitles = Object.fromEntries((staleDecisions || []).map(d => [d.id, d.title]));
      }
      // Filter to only reviews belonging to this org's decisions
      const orgStaleReviews = staleReviewList.filter(r => staleDecisionTitles[r.decision_id]);

      if (!decisions || decisions.length === 0) {
        if (orgStaleReviews.length === 0) continue;
      }

      const decisionList = decisions || [];

      // Dead decisions (no activity > 14 days)
      const deadDecisions = decisionList.filter(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return daysInactive >= DEAD_THRESHOLD;
      }).map(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return { ...d, daysInactive };
      });

      // Stuck decisions (same phase > 5 days, excluding dead)
      const deadIds = new Set(deadDecisions.map(d => d.id));
      const stuckDecisions = decisionList.filter(d => {
        if (deadIds.has(d.id)) return false;
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return daysInactive >= STUCK_THRESHOLD;
      }).map(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysStuck = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return { ...d, daysStuck };
      });

      // Overdue SLAs
      const overdueDecisions = decisionList.filter(d => {
        return d.due_date && new Date(d.due_date) < now && !deadIds.has(d.id);
      });

      const totalIssues = deadDecisions.length + stuckDecisions.length + overdueDecisions.length + orgStaleReviews.length;
      if (totalIssues === 0) continue;

      // Economic exposure: sum of cost_per_day for all problematic decisions
      const allProblematic = [...deadDecisions, ...stuckDecisions, ...overdueDecisions];
      const uniqueProblematic = [...new Map(allProblematic.map(d => [d.id, d])).values()];
      const weeklyExposure = uniqueProblematic.reduce((sum, d) => sum + ((d.cost_per_day || 0) * 7), 0);

      // Top 3 most critical (highest CoD)
      const top3 = uniqueProblematic
        .sort((a, b) => (b.cost_per_day || 0) - (a.cost_per_day || 0))
        .slice(0, 3);

      // Build notification message
      let message = `📋 Wochenbericht für ${org.name}\n\n`;
      message += `Zusammenfassung: ${deadDecisions.length} tote, ${stuckDecisions.length} feststeckende, ${overdueDecisions.length} überfällige Entscheidungen`;
      if (orgStaleReviews.length > 0) message += `, ${orgStaleReviews.length} unbeantwortete Reviews`;
      message += `\n\n`;

      if (top3.length > 0) {
        message += `🔥 Kritischste Entscheidungen:\n`;
        for (const d of top3) {
          const costInfo = d.cost_per_day ? ` (${d.cost_per_day}€/Tag)` : "";
          message += `  • "${d.title}"${costInfo}\n`;
        }
        message += "\n";
      }

      if (weeklyExposure > 0) {
        message += `💰 Economic Exposure diese Woche: ${weeklyExposure.toLocaleString("de-DE")}€\n\n`;
      }

      message += `→ Alle bereinigen: ${appUrl}/decisions?filter=needs_attention`;

      // Send notification to each eligible admin
      for (const adminId of eligibleAdmins) {
        await supabase.from("notifications").insert({
          user_id: adminId,
          org_id: org.id,
          type: "cleanup_digest",
          title: `Wochenbericht: ${totalIssues} Entscheidung${totalIssues > 1 ? "en" : ""} brauchen Aufmerksamkeit`,
          message,
        });
      }

      totalDigestsSent += eligibleAdmins.length;
    }

    return new Response(JSON.stringify({
      success: true,
      digests_sent: totalDigestsSent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weekly-cleanup-digest error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

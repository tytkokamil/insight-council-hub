import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
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
    // 1. Get all organizations with admins
    const { data: orgs } = await supabase.from("organizations").select("id, name").eq("is_active", true);
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ message: "No active organizations" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalDigestsSent = 0;

    for (const org of orgs) {
      // Find org admins/owners
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("org_id", org.id)
        .in("role", ["org_admin", "org_owner"]);

      if (!adminRoles || adminRoles.length === 0) continue;

      // Get active decisions for this org
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title, status, last_activity_at, updated_at, due_date, cost_per_day, owner_id, assignee_id")
        .eq("org_id", org.id)
        .is("deleted_at", null)
        .is("archived_at", null)
        .not("status", "in", '("implemented","rejected","archived","cancelled","superseded")');

      if (!decisions || decisions.length === 0) continue;

      const now = new Date();
      const DEAD_THRESHOLD = 14;
      const STUCK_THRESHOLD = 5;

      // Dead decisions (no activity > 14 days)
      const deadDecisions = decisions.filter(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return daysInactive >= DEAD_THRESHOLD;
      }).map(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        return { ...d, daysInactive };
      });

      // Stuck decisions (same phase > 5 days with issues)
      const stuckDecisions = decisions.filter(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
        const isOverdue = d.due_date && new Date(d.due_date) < now;
        return daysInactive >= STUCK_THRESHOLD || isOverdue;
      }).filter(d => !deadDecisions.find(dd => dd.id === d.id)) // exclude already-dead
        .map(d => {
          const lastActivity = d.last_activity_at || d.updated_at;
          const daysStuck = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
          return { ...d, daysStuck };
        });

      if (deadDecisions.length === 0 && stuckDecisions.length === 0) continue;

      // Build digest message
      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "").replace("https://", "https://") || "";
      const appUrl = "https://decivio.com"; // Adjust to actual app URL

      let message = `📋 **Wöchentlicher Cleanup-Digest für ${org.name}**\n\n`;

      if (deadDecisions.length > 0) {
        message += `💀 **${deadDecisions.length} tote Entscheidung${deadDecisions.length > 1 ? "en" : ""}** (keine Aktivität seit 14+ Tagen):\n`;
        for (const d of deadDecisions.slice(0, 5)) {
          const costInfo = d.cost_per_day ? ` — CoD: ${d.cost_per_day}€/Tag` : "";
          message += `  • "${d.title}" — ${d.daysInactive} Tage inaktiv${costInfo}\n`;
        }
        message += "\n";
      }

      if (stuckDecisions.length > 0) {
        message += `⚠️ **${stuckDecisions.length} feststeckende Entscheidung${stuckDecisions.length > 1 ? "en" : ""}**:\n`;
        for (const d of stuckDecisions.slice(0, 5)) {
          const overdueInfo = d.due_date && new Date(d.due_date) < now ? " [ÜBERFÄLLIG]" : "";
          message += `  • "${d.title}" — Phase: ${d.status} — ${d.daysStuck} Tage${overdueInfo}\n`;
        }
        message += "\n";
      }

      message += `→ Alle bereinigen: ${appUrl}/decisions?filter=stuck`;

      // Send notification to each admin
      for (const admin of adminRoles) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          org_id: org.id,
          type: "cleanup_digest",
          title: `${deadDecisions.length} tote + ${stuckDecisions.length} feststeckende Entscheidungen`,
          message,
        });
      }

      totalDigestsSent += adminRoles.length;
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

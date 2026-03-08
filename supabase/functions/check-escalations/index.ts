import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SLA = {
  escalation_hours_warn: 48,
  escalation_hours_urgent: 24,
  escalation_hours_overdue: 0,
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

  // Shared-secret auth guard for internal/cron functions
  const secret = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
  const provided = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (!secret || !timingSafeEqual(provided, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // Fetch decisions and SLA configs in parallel
    const [decResult, slaResult] = await Promise.all([
      supabase.from("decisions")
        .select("id, title, priority, category, due_date, created_by, assignee_id, escalation_level, status")
        .in("status", ["draft", "review", "approved"])
        .not("due_date", "is", null),
      supabase.from("sla_configs")
        .select("category, priority, escalation_hours_warn, escalation_hours_urgent, escalation_hours_overdue"),
    ]);

    const decisions = decResult.data || [];
    const slaConfigs = slaResult.data || [];

    if (decResult.error) throw decResult.error;

    // Build SLA lookup
    const slaMap: Record<string, typeof DEFAULT_SLA> = {};
    slaConfigs.forEach(s => {
      slaMap[`${s.category}:${s.priority}`] = {
        escalation_hours_warn: s.escalation_hours_warn,
        escalation_hours_urgent: s.escalation_hours_urgent,
        escalation_hours_overdue: s.escalation_hours_overdue,
      };
    });

    const getSla = (category: string, priority: string) =>
      slaMap[`${category}:${priority}`] || DEFAULT_SLA;

    if (decisions.length === 0) {
      return new Response(JSON.stringify({ message: "No decisions to escalate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let escalated = 0;

    for (const decision of decisions) {
      const dueDate = new Date(decision.due_date);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const currentLevel = decision.escalation_level || 0;
      const sla = getSla(decision.category, decision.priority);

      let newLevel = 0;

      // Escalation rules using configurable SLA thresholds
      if (hoursUntilDue <= sla.escalation_hours_overdue) newLevel = 3;
      else if (hoursUntilDue <= sla.escalation_hours_urgent) newLevel = 2;
      else if (hoursUntilDue <= sla.escalation_hours_warn) newLevel = 1;

      if (newLevel > currentLevel) {
        await supabase.from("decisions")
          .update({ escalation_level: newLevel, last_escalated_at: now.toISOString() })
          .eq("id", decision.id);

        const levelLabels = ["", "⚠️ Bald fällig", "🔴 Dringend", "🚨 Überfällig"];
        const notifTitle = `${levelLabels[newLevel]}: ${decision.title}`;
        const notifMessage = hoursUntilDue <= 0
          ? `Diese Entscheidung ist seit ${Math.abs(Math.round(hoursUntilDue))}h überfällig!`
          : `Nur noch ${Math.round(hoursUntilDue)}h bis zur Deadline.`;

        const usersToNotify = [decision.created_by];
        if (decision.assignee_id && decision.assignee_id !== decision.created_by) {
          usersToNotify.push(decision.assignee_id);
        }

        for (const userId of usersToNotify) {
          await supabase.from("notifications").insert({
            user_id: userId,
            decision_id: decision.id,
            type: "escalation",
            title: notifTitle,
            message: notifMessage,
          });
        }

        escalated++;
      }
    }

    return new Response(JSON.stringify({ message: `Escalation check complete. ${escalated} decisions escalated.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-escalations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

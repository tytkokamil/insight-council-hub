import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // Find decisions that are overdue or near deadline and not yet implemented/rejected
    const { data: decisions, error } = await supabase
      .from("decisions")
      .select("id, title, priority, due_date, created_by, assignee_id, escalation_level, status")
      .in("status", ["draft", "review", "approved"])
      .not("due_date", "is", null);

    if (error) throw error;
    if (!decisions || decisions.length === 0) {
      return new Response(JSON.stringify({ message: "No decisions to escalate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let escalated = 0;

    for (const decision of decisions) {
      const dueDate = new Date(decision.due_date);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const currentLevel = decision.escalation_level || 0;

      let newLevel = 0;

      // Escalation rules based on priority
      if (decision.priority === "critical") {
        if (hoursUntilDue < 0) newLevel = 3; // overdue
        else if (hoursUntilDue < 24) newLevel = 2;
        else if (hoursUntilDue < 48) newLevel = 1;
      } else if (decision.priority === "high") {
        if (hoursUntilDue < 0) newLevel = 3;
        else if (hoursUntilDue < 24) newLevel = 1;
        else if (hoursUntilDue < 48) newLevel = 1;
      } else {
        if (hoursUntilDue < 0) newLevel = 2;
        else if (hoursUntilDue < 24) newLevel = 1;
      }

      if (newLevel > currentLevel) {
        // Update escalation level
        await supabase
          .from("decisions")
          .update({ escalation_level: newLevel, last_escalated_at: now.toISOString() })
          .eq("id", decision.id);

        // Create notification for creator
        const levelLabels = ["", "⚠️ Bald fällig", "🔴 Dringend", "🚨 Überfällig"];
        const notifTitle = `${levelLabels[newLevel]}: ${decision.title}`;
        const notifMessage = hoursUntilDue < 0
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

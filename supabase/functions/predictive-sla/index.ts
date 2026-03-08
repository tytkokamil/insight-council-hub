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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Get average reviewer response times from audit_logs (last 30 days)
    // We look at review actions: when a reviewer was assigned vs when they responded
    const { data: reviewLogs } = await supabase
      .from("audit_logs")
      .select("user_id, decision_id, action, created_at")
      .in("action", ["review_submitted", "decision_status_changed", "decision_approved", "decision_rejected"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // 2. Get review assignments to calculate response times
    const { data: reviews } = await supabase
      .from("decision_reviews")
      .select("id, decision_id, reviewer_id, created_at, reviewed_at, status");

    // Build reviewer avg response time map (in hours)
    const reviewerTimes: Record<string, number[]> = {};
    (reviews || []).forEach(r => {
      if (r.reviewed_at && r.created_at) {
        const responseHours = (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
        if (responseHours > 0 && responseHours < 720) { // cap at 30 days
          if (!reviewerTimes[r.reviewer_id]) reviewerTimes[r.reviewer_id] = [];
          reviewerTimes[r.reviewer_id].push(responseHours);
        }
      }
    });

    const reviewerAvg: Record<string, number> = {};
    Object.entries(reviewerTimes).forEach(([uid, times]) => {
      reviewerAvg[uid] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    // 3. Get open decisions with pending reviews and SLA configs
    const { data: openDecisions } = await supabase
      .from("decisions")
      .select("id, title, due_date, category, priority, status, assignee_id, created_by")
      .in("status", ["draft", "review", "proposed", "approved"])
      .not("due_date", "is", null);

    const { data: pendingReviews } = await supabase
      .from("decision_reviews")
      .select("id, decision_id, reviewer_id, created_at, status")
      .is("reviewed_at", null);

    const { data: slaConfigs } = await supabase
      .from("sla_configs")
      .select("category, priority, escalation_hours_warn, escalation_hours_urgent, escalation_hours_overdue, reassign_days");

    // Build SLA lookup
    const slaMap: Record<string, any> = {};
    (slaConfigs || []).forEach(s => {
      slaMap[`${s.category}:${s.priority}`] = s;
    });

    // Get profiles for names
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach(p => { nameMap[p.user_id] = p.full_name || "Unbekannt"; });

    // 4. Predict SLA violations
    const predictions: Array<{
      decision_id: string;
      decision_title: string;
      reviewer_id: string;
      reviewer_name: string;
      avg_response_hours: number;
      due_date: string;
      predicted_completion_date: string;
      predicted_delay_hours: number;
      sla_deadline_hours: number;
      risk_level: "warning" | "critical";
    }> = [];

    (openDecisions || []).forEach(decision => {
      const dueDate = new Date(decision.due_date!);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Find pending reviews for this decision
      const pending = (pendingReviews || []).filter(r => r.decision_id === decision.id);

      pending.forEach(review => {
        const reviewerId = review.reviewer_id;
        const avgHours = reviewerAvg[reviewerId];

        if (avgHours === undefined) return; // No historical data

        const assignedAt = new Date(review.created_at);
        const predictedCompletion = new Date(assignedAt.getTime() + avgHours * 60 * 60 * 1000);
        const predictedDelayHours = (predictedCompletion.getTime() - dueDate.getTime()) / (1000 * 60 * 60);

        // Get SLA config
        const sla = slaMap[`${decision.category}:${decision.priority}`];
        const warnHours = sla?.escalation_hours_warn || 48;

        if (predictedDelayHours > 0 || hoursUntilDue < warnHours) {
          predictions.push({
            decision_id: decision.id,
            decision_title: decision.title,
            reviewer_id: reviewerId,
            reviewer_name: nameMap[reviewerId] || "Unbekannt",
            avg_response_hours: Math.round(avgHours * 10) / 10,
            due_date: decision.due_date!,
            predicted_completion_date: predictedCompletion.toISOString(),
            predicted_delay_hours: Math.round(predictedDelayHours * 10) / 10,
            sla_deadline_hours: Math.round(hoursUntilDue * 10) / 10,
            risk_level: predictedDelayHours > 24 ? "critical" : "warning",
          });
        }
      });
    });

    // Sort by predicted delay (worst first)
    predictions.sort((a, b) => b.predicted_delay_hours - a.predicted_delay_hours);

    return new Response(JSON.stringify({ predictions, reviewer_averages: reviewerAvg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predictive-sla error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default SLA values as fallback
const DEFAULT_SLA = {
  escalation_hours_warn: 48,
  escalation_hours_urgent: 24,
  escalation_hours_overdue: 0,
  reassign_days: 7,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const actions: any[] = [];

    // 1. Fetch all open decisions, reviews, members, AND SLA configs
    const [decRes, reviewRes, memberRes, slaRes] = await Promise.all([
      supabase.from("decisions")
        .select("id, title, priority, category, due_date, created_by, assignee_id, escalation_level, status, ai_risk_score, team_id, created_at")
        .in("status", ["draft", "review", "approved"]),
      supabase.from("decision_reviews")
        .select("id, decision_id, reviewer_id, status, step_order, reviewed_at"),
      supabase.from("team_members")
        .select("team_id, user_id"),
      supabase.from("sla_configs")
        .select("category, priority, escalation_hours_warn, escalation_hours_urgent, escalation_hours_overdue, reassign_days"),
    ]);

    const decisions = decRes.data || [];
    const reviews = reviewRes.data || [];
    const members = memberRes.data || [];
    const slaConfigs = slaRes.data || [];

    // Build SLA lookup map: "category:priority" -> config
    const slaMap: Record<string, typeof DEFAULT_SLA> = {};
    slaConfigs.forEach(s => {
      slaMap[`${s.category}:${s.priority}`] = {
        escalation_hours_warn: s.escalation_hours_warn,
        escalation_hours_urgent: s.escalation_hours_urgent,
        escalation_hours_overdue: s.escalation_hours_overdue,
        reassign_days: s.reassign_days,
      };
    });

    const getSla = (category: string, priority: string) =>
      slaMap[`${category}:${priority}`] || DEFAULT_SLA;

    // Group reviews by decision
    const reviewsByDec: Record<string, any[]> = {};
    reviews.forEach(r => {
      if (!reviewsByDec[r.decision_id]) reviewsByDec[r.decision_id] = [];
      reviewsByDec[r.decision_id].push(r);
    });

    // Team members map
    const teamMembers: Record<string, string[]> = {};
    members.forEach(m => {
      if (!teamMembers[m.team_id]) teamMembers[m.team_id] = [];
      teamMembers[m.team_id].push(m.user_id);
    });

    for (const dec of decisions) {
      const dueDate = dec.due_date ? new Date(dec.due_date) : null;
      const hoursUntilDue = dueDate ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
      const daysOpen = Math.floor((now.getTime() - new Date(dec.created_at).getTime()) / 86400000);
      const currentLevel = dec.escalation_level || 0;
      const riskScore = dec.ai_risk_score || 0;
      const decReviews = reviewsByDec[dec.id] || [];
      const sla = getSla(dec.category, dec.priority);

      // === ACTION 1: Smart Escalation using configurable SLA ===
      let newLevel = 0;
      if (dueDate) {
        if (hoursUntilDue <= sla.escalation_hours_overdue) newLevel = 3;
        else if (hoursUntilDue <= sla.escalation_hours_urgent) newLevel = 2;
        else if (hoursUntilDue <= sla.escalation_hours_warn) newLevel = 1;
      }

      // Bonus escalation for stale decisions
      if (daysOpen > sla.reassign_days * 2 && dec.status === "draft") {
        newLevel = Math.max(newLevel, 2);
      }
      if (daysOpen > sla.reassign_days * 3 && dec.status === "review") {
        newLevel = Math.max(newLevel, 2);
      }

      if (newLevel > currentLevel) {
        await supabase.from("decisions")
          .update({ escalation_level: newLevel, last_escalated_at: now.toISOString() })
          .eq("id", dec.id);

        const levelLabels = ["", "⚠️ Bald fällig", "🔴 Dringend", "🚨 Überfällig"];
        const notifTitle = `${levelLabels[newLevel]}: ${dec.title}`;
        const notifMessage = hoursUntilDue <= 0
          ? `Überfällig seit ${Math.abs(Math.round(hoursUntilDue))}h!`
          : daysOpen > sla.reassign_days * 2
          ? `Seit ${daysOpen} Tagen offen ohne Fortschritt.`
          : `Nur noch ${Math.round(hoursUntilDue)}h bis zur Deadline.`;

        const usersToNotify = new Set([dec.created_by]);
        if (dec.assignee_id) usersToNotify.add(dec.assignee_id);

        for (const userId of usersToNotify) {
          await supabase.from("notifications").insert({
            user_id: userId, decision_id: dec.id,
            type: "escalation", title: notifTitle, message: notifMessage,
          });
        }

        actions.push({ type: "escalation", decision_id: dec.id, title: dec.title, from_level: currentLevel, to_level: newLevel, sla });
      }

      // === ACTION 2: Auto-Reassign using configurable reassign_days ===
      if (dec.assignee_id && daysOpen > sla.reassign_days && dec.status === "draft" && dec.team_id) {
        const teamMemberIds = teamMembers[dec.team_id] || [];
        const otherMembers = teamMemberIds.filter(id => id !== dec.assignee_id && id !== dec.created_by);

        if (otherMembers.length > 0) {
          const newAssignee = otherMembers[Math.floor(Math.random() * otherMembers.length)];

          await supabase.from("decisions")
            .update({ assignee_id: newAssignee })
            .eq("id", dec.id);

          await supabase.from("notifications").insert({
            user_id: newAssignee, decision_id: dec.id,
            type: "auto_reassign",
            title: `🔄 Auto-Reassign: ${dec.title}`,
            message: `Diese Entscheidung wurde dir automatisch zugewiesen, da der vorherige Bearbeiter seit ${daysOpen} Tagen inaktiv war. (SLA: ${sla.reassign_days} Tage)`,
          });

          await supabase.from("notifications").insert({
            user_id: dec.assignee_id, decision_id: dec.id,
            type: "auto_reassign",
            title: `🔄 Reassigned: ${dec.title}`,
            message: `Diese Entscheidung wurde automatisch neu zugewiesen, da keine Aktivität seit ${daysOpen} Tagen stattfand. (SLA: ${sla.reassign_days} Tage)`,
          });

          actions.push({ type: "auto_reassign", decision_id: dec.id, title: dec.title, old_assignee: dec.assignee_id, new_assignee: newAssignee, sla_reassign_days: sla.reassign_days });
        }
      }

      // === ACTION 3: Auto-Skip Review for Low-Risk decisions ===
      if (dec.status === "review" && riskScore <= 25 && dec.priority !== "critical") {
        const pendingReviews = decReviews.filter(r => !r.reviewed_at && r.step_order > 1);

        if (pendingReviews.length > 0) {
          for (const review of pendingReviews) {
            await supabase.from("decision_reviews")
              .update({
                status: "approved",
                reviewed_at: now.toISOString(),
                feedback: "✅ Auto-approved: Low-risk decision (AI Risk Score ≤ 25). Review-Schritt automatisch übersprungen.",
              })
              .eq("id", review.id);
          }

          await supabase.from("decisions")
            .update({ status: "approved" })
            .eq("id", dec.id);

          await supabase.from("notifications").insert({
            user_id: dec.created_by, decision_id: dec.id,
            type: "auto_skip_review",
            title: `⚡ Auto-Approved: ${dec.title}`,
            message: `Diese Low-Risk Entscheidung (Risk: ${riskScore}%) wurde automatisch genehmigt. ${pendingReviews.length} Review-Schritt(e) übersprungen.`,
          });

          actions.push({
            type: "auto_skip_review", decision_id: dec.id, title: dec.title,
            risk_score: riskScore, skipped_steps: pendingReviews.length,
          });
        }
      }

      // === ACTION 4: Process Shortening Suggestion ===
      if (dec.status === "review" && daysOpen > 10 && decReviews.length > 2) {
        const completedReviews = decReviews.filter(r => r.reviewed_at).length;
        const totalReviews = decReviews.length;

        if (completedReviews < totalReviews && completedReviews >= 2) {
          await supabase.from("notifications").insert({
            user_id: dec.created_by, decision_id: dec.id,
            type: "process_suggestion",
            title: `💡 Prozessverkürzung: ${dec.title}`,
            message: `Diese Entscheidung hat bereits ${completedReviews}/${totalReviews} Reviews abgeschlossen und ist seit ${daysOpen} Tagen offen. Erwäge die verbleibenden Schritte zu überspringen.`,
          });

          actions.push({
            type: "process_suggestion", decision_id: dec.id, title: dec.title,
            completed_reviews: completedReviews, total_reviews: totalReviews,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      message: `Autonomous Engine complete. ${actions.length} actions taken.`,
      actions,
      processed: decisions.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autonomous-escalation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

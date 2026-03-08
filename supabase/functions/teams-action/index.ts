import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Teams Action Edge Function
 * Handles approve/reject actions from Teams Adaptive Card buttons.
 * Called by Teams Action.Http when user clicks approve/reject.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, decision_id, review_id, user_email, comment } = body;

    if (!action || !decision_id || !user_email) {
      return new Response(JSON.stringify({ error: "action, decision_id, and user_email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be approve or reject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the Decivio user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, full_name, org_id")
      .eq("email", user_email)
      .single();

    // Fallback: search by auth email
    let userId: string | null = profile?.user_id || null;
    let userName = profile?.full_name || user_email;

    if (!userId) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const match = authUsers?.users?.find(u => u.email === user_email);
      if (match) {
        userId = match.id;
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", match.id)
          .single();
        if (p) userName = p.full_name || user_email;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "User not found", 
        message: `Kein Decivio-Konto für ${user_email} gefunden.` 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is a reviewer for this decision
    const { data: review } = await supabase
      .from("decision_reviews")
      .select("id, status, reviewed_at")
      .eq("decision_id", decision_id)
      .eq("reviewer_id", userId)
      .is("reviewed_at", null)
      .order("step_order", { ascending: true })
      .limit(1)
      .single();

    if (!review) {
      return new Response(JSON.stringify({ 
        error: "No pending review",
        message: "Keine ausstehende Freigabe für diesen Nutzer gefunden." 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute the action
    const newStatus = action === "approve" ? "approved" : "rejected";

    await supabase
      .from("decision_reviews")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        feedback: comment || (action === "approve" ? "Genehmigt via Teams" : "Abgelehnt via Teams"),
      })
      .eq("id", review.id);

    // If approved, check if all reviews are done → update decision status
    if (action === "approve") {
      const { data: pendingReviews } = await supabase
        .from("decision_reviews")
        .select("id")
        .eq("decision_id", decision_id)
        .is("reviewed_at", null);

      if (!pendingReviews || pendingReviews.length === 0) {
        await supabase
          .from("decisions")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", decision_id);
      }
    } else {
      await supabase
        .from("decisions")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", decision_id);
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      decision_id,
      user_id: userId,
      action: action === "approve" ? "review_approved" : "review_rejected",
      field_name: "status",
      old_value: "pending",
      new_value: newStatus,
      change_reason: `${action === "approve" ? "Genehmigt" : "Abgelehnt"} via Microsoft Teams`,
    });

    // Create notification for decision owner
    const { data: decision } = await supabase
      .from("decisions")
      .select("title, created_by, owner_id")
      .eq("id", decision_id)
      .single();

    if (decision) {
      const notifyUserId = decision.owner_id || decision.created_by;
      await supabase.from("notifications").insert({
        user_id: notifyUserId,
        title: action === "approve" ? "Entscheidung genehmigt" : "Entscheidung abgelehnt",
        message: `${userName} hat "${decision.title}" via Teams ${action === "approve" ? "genehmigt" : "abgelehnt"}.`,
        type: action === "approve" ? "approval" : "rejection",
        decision_id,
      });
    }

    // Return Teams-compatible response (Adaptive Card update)
    const emoji = action === "approve" ? "✅" : "❌";
    const label = action === "approve" ? "Genehmigt" : "Abgelehnt";

    return new Response(JSON.stringify({
      type: "message",
      text: `${emoji} ${label} von ${userName}${comment ? ` — "${comment}"` : ""}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("teams-action error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

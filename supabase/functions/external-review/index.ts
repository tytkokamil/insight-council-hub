import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate token
    const { data: tokenData, error: tokenErr } = await supabase
      .from("external_review_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenErr || !tokenData) {
      return new Response(JSON.stringify({ error: "invalid_token", message: "Ungültiger oder abgelaufener Link." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "expired", message: "Dieser Link ist abgelaufen." }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND INVITE (fire-and-forget from frontend) ──
    if (action === "send_invite") {
      // For now just log — actual email sending would use a mail provider
      console.log(`[external-review] Invite sent to ${tokenData.reviewer_email} for decision ${tokenData.decision_id}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── GET: Fetch decision data ──
    if (action === "get") {
      const { data: decision } = await supabase
        .from("decisions")
        .select("id, title, description, context, status, priority, category, due_date, created_at, cost_per_day")
        .eq("id", tokenData.decision_id)
        .single();

      if (!decision) {
        return new Response(JSON.stringify({ error: "decision_not_found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get attachments
      const { data: attachments } = await supabase
        .from("decision_attachments")
        .select("id, file_name, file_url, file_type, file_size")
        .eq("decision_id", decision.id);

      // Get comments
      const { data: comments } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, type")
        .eq("decision_id", decision.id)
        .order("created_at", { ascending: true });

      // Resolve comment author names
      const userIds = [...new Set((comments || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds.length > 0 ? userIds : ["none"]);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = p.full_name || "Unbekannt"; });

      // Get creator name
      const { data: creatorDecision } = await supabase
        .from("decisions")
        .select("created_by")
        .eq("id", decision.id)
        .single();

      let creatorName = "Unbekannt";
      if (creatorDecision?.created_by) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", creatorDecision.created_by)
          .single();
        creatorName = creatorProfile?.full_name || "Unbekannt";
      }

      const enrichedComments = (comments || []).map(c => ({
        ...c,
        author_name: nameMap[c.user_id] || "Unbekannt",
      }));

      return new Response(JSON.stringify({
        decision,
        attachments: attachments || [],
        comments: enrichedComments,
        reviewer: { name: tokenData.reviewer_name, email: tokenData.reviewer_email },
        token_status: tokenData.status,
        already_acted: tokenData.status !== "pending",
        action_taken: tokenData.action_taken,
        acted_at: tokenData.acted_at,
        creator_name: creatorName,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST: Submit review action ──
    if (action === "approve" || action === "reject") {
      if (tokenData.status !== "pending") {
        return new Response(JSON.stringify({ error: "already_acted", message: "Sie haben bereits eine Aktion durchgeführt." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const feedback = body.feedback || null;
      const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      // Update token
      await supabase
        .from("external_review_tokens")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          action_taken: action,
          feedback,
          acted_at: new Date().toISOString(),
        })
        .eq("id", tokenData.id);

      // Audit log with source tracking
      await supabase.from("audit_logs").insert({
        decision_id: tokenData.decision_id,
        user_id: tokenData.invited_by,
        action: action === "approve" ? "review.approved" : "review.rejected",
        field_name: "external_review",
        new_value: JSON.stringify({
          reviewer: tokenData.reviewer_name,
          reviewer_email: tokenData.reviewer_email,
          source: "external_review_portal",
          action,
          ip_address: ipAddress,
          user_agent: userAgent.substring(0, 200),
          feedback: feedback || null,
        }),
      });

      // Notify the decision creator
      const { data: decision } = await supabase
        .from("decisions")
        .select("created_by, title")
        .eq("id", tokenData.decision_id)
        .single();

      if (decision) {
        await supabase.from("notifications").insert({
          user_id: decision.created_by,
          title: `Externes Review: ${action === "approve" ? "Genehmigt" : "Abgelehnt"}`,
          message: `${tokenData.reviewer_name} (extern) hat "${decision.title}" ${action === "approve" ? "genehmigt" : "abgelehnt"}.`,
          type: "review",
          decision_id: tokenData.decision_id,
        });
      }

      return new Response(JSON.stringify({ success: true, action }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── POST: Add comment ──
    if (action === "comment") {
      const { content } = body;
      if (!content?.trim()) {
        return new Response(JSON.stringify({ error: "Comment content required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("comments").insert({
        decision_id: tokenData.decision_id,
        user_id: tokenData.invited_by,
        content: `[Extern: ${tokenData.reviewer_name}] ${content.trim().substring(0, 5000)}`,
        type: "comment",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("external-review error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

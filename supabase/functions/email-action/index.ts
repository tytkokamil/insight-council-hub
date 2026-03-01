import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { token, feedback } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "missing_token", message: "Kein Token angegeben." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Look up the token
    const { data: tokenRow, error: tokenError } = await supabase
      .from("email_action_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(
        JSON.stringify({ error: "invalid_token", message: "Dieser Link ist ungültig oder abgelaufen." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if already used
    if (tokenRow.used) {
      return new Response(
        JSON.stringify({
          error: "already_used",
          message: "Dieser Link wurde bereits verwendet.",
          decision_id: tokenRow.decision_id,
          used_at: tokenRow.used_at,
          original_action: tokenRow.action_type,
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check expiration
    if (new Date(tokenRow.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: "expired",
          message: "Dieser Link ist abgelaufen. Bitte loggen Sie sich ein, um die Aktion auszuführen.",
          decision_id: tokenRow.decision_id,
        }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Execute the action
    const newStatus = tokenRow.action_type === "approve" ? "approved" : "rejected";

    const { error: updateError } = await supabase
      .from("decision_reviews")
      .update({
        status: newStatus,
        feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", tokenRow.review_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "update_failed", message: "Aktion konnte nicht ausgeführt werden." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Mark token as used
    await supabase
      .from("email_action_tokens")
      .update({ used: true, used_at: new Date().toISOString(), feedback: feedback || null })
      .eq("id", tokenRow.id);

    // 6. Mark the paired token as used too
    await supabase
      .from("email_action_tokens")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("review_id", tokenRow.review_id)
      .neq("id", tokenRow.id);

    // 7. Get user name for audit trail
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", tokenRow.user_id)
      .single();

    const userName = profile?.full_name || "Unbekannt";

    // 8. Capture request metadata for audit
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // 9. Write audit log with source: email_one_click
    await supabase.from("audit_logs").insert({
      decision_id: tokenRow.decision_id,
      user_id: tokenRow.user_id,
      action: tokenRow.action_type === "approve" ? "review.approved" : "review.rejected",
      field_name: "review",
      new_value: JSON.stringify({
        reviewer: userName,
        source: "email_one_click",
        action: tokenRow.action_type,
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 200),
        feedback: feedback || null,
      }),
    });

    // 10. Get decision title for response
    const { data: decision } = await supabase
      .from("decisions")
      .select("title")
      .eq("id", tokenRow.decision_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        action: tokenRow.action_type,
        decision_id: tokenRow.decision_id,
        decision_title: decision?.title || "",
        user_name: userName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "server_error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

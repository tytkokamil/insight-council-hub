import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { reviewRequestEmail, escapeHtml } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { decision_id, reviewer_id, review_id } = await req.json();

    if (!decision_id || !reviewer_id || !review_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: decision } = await supabase
      .from("decisions")
      .select("title, description, cost_per_day")
      .eq("id", decision_id)
      .single();

    if (!decision) {
      return new Response(JSON.stringify({ error: "Decision not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .eq("user_id", reviewer_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(reviewer_id);
    const email = authUser?.user?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "Reviewer email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate two tokens (approve + reject), expiring in 72 hours
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const approveToken = generateToken();
    const rejectToken = generateToken();

    await supabase.from("email_action_tokens").insert([
      { user_id: reviewer_id, decision_id, review_id, action_type: "approve", token: approveToken, expires_at: expiresAt },
      { user_id: reviewer_id, decision_id, review_id, action_type: "reject", token: rejectToken, expires_at: expiresAt },
    ]);

    const origin = Deno.env.get("APP_URL") || "https://app.decivio.com";
    const approveUrl = `${origin}/approve/${approveToken}`;
    const rejectUrl = `${origin}/reject/${rejectToken}`;
    const detailUrl = `${origin}/decisions/${decision_id}`;

    const shortDesc = decision.description
      ? decision.description.substring(0, 200) + (decision.description.length > 200 ? "…" : "")
      : "Keine Beschreibung";

    const { subject, html } = reviewRequestEmail({
      reviewerName: profile?.full_name || "Reviewer",
      decisionTitle: decision.title,
      description: shortDesc,
      costPerDay: decision.cost_per_day,
      approveUrl,
      rejectUrl,
      detailUrl,
    });

    // Send via Supabase Auth magic link as workaround
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: detailUrl },
    });

    // In-app notification
    await supabase.from("notifications").insert({
      user_id: reviewer_id,
      title: "Review angefordert",
      message: `Sie wurden als Reviewer für "${decision.title}" eingetragen.`,
      type: "review_request",
      decision_id,
    });

    console.log(`Review request email for ${email}. Subject: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, approve_url: approveUrl, reject_url: rejectUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

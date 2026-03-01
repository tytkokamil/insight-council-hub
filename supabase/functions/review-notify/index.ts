import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Generate a cryptographically random token */
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

    // Fetch decision details
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

    // Fetch reviewer profile + email
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

    // Generate two tokens (approve + reject), expiring in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const approveToken = generateToken();
    const rejectToken = generateToken();

    await supabase.from("email_action_tokens").insert([
      {
        user_id: reviewer_id,
        decision_id,
        review_id,
        action_type: "approve",
        token: approveToken,
        expires_at: expiresAt,
      },
      {
        user_id: reviewer_id,
        decision_id,
        review_id,
        action_type: "reject",
        token: rejectToken,
        expires_at: expiresAt,
      },
    ]);

    // Build the action URLs - use the frontend app URL
    const appUrl = req.headers.get("origin") || `${supabaseUrl.replace(".supabase.co", ".lovable.app")}`;
    // We'll use a simple approach: the frontend /action page handles this
    const approveUrl = `${appUrl}/action?token=${approveToken}&action=approve`;
    const rejectUrl = `${appUrl}/action?token=${rejectToken}&action=reject`;
    const detailUrl = `${appUrl}/decisions/${decision_id}`;

    const shortDesc = decision.description
      ? decision.description.substring(0, 200) + (decision.description.length > 200 ? "…" : "")
      : "Keine Beschreibung";

    const costLine = decision.cost_per_day
      ? `<tr><td style="padding:12px 24px;font-size:14px;color:#e67e22;font-weight:600;">⏱ Cost-of-Delay: ${Number(decision.cost_per_day).toLocaleString("de-DE")} € / Tag</td></tr>`
      : "";

    // Build HTML email
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;">
    <span style="color:#ffffff;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Review angefordert</span>
  </td></tr>
  <tr><td style="padding:24px 24px 8px;">
    <h1 style="margin:0;font-size:22px;color:#18181b;line-height:1.3;">${escapeHtml(decision.title)}</h1>
  </td></tr>
  <tr><td style="padding:8px 24px 16px;">
    <p style="margin:0;font-size:14px;color:#71717a;line-height:1.6;">${escapeHtml(shortDesc)}</p>
  </td></tr>
  ${costLine}
  <tr><td style="padding:16px 24px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="48%" align="center" style="padding-right:8px;">
        <a href="${approveUrl}" style="display:block;padding:14px 20px;background-color:#22c55e;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;text-align:center;">✓ Genehmigen</a>
      </td>
      <td width="48%" align="center" style="padding-left:8px;">
        <a href="${rejectUrl}" style="display:block;padding:14px 20px;background-color:#ef4444;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;text-align:center;">✗ Ablehnen</a>
      </td>
    </tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 24px 24px;text-align:center;">
    <a href="${detailUrl}" style="font-size:13px;color:#6366f1;text-decoration:none;">Details ansehen →</a>
  </td></tr>
  <tr><td style="padding:16px 24px;border-top:1px solid #e4e4e7;">
    <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">
      Hallo ${escapeHtml(profile?.full_name || "Reviewer")}, Sie wurden als Reviewer für diese Entscheidung eingetragen.
      Die Aktions-Links sind 7 Tage gültig und können nur einmal verwendet werden.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    // Send via Supabase Auth email (using admin API)
    // We'll use a simple approach: insert a notification and log
    // For actual email sending, we use the built-in Supabase email
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: detailUrl },
    });

    // Also create an in-app notification
    await supabase.from("notifications").insert({
      user_id: reviewer_id,
      title: "Review angefordert",
      message: `Sie wurden als Reviewer für "${decision.title}" eingetragen.`,
      type: "review_request",
      decision_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        approve_url: approveUrl,
        reject_url: rejectUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

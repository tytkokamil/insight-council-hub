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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // Legacy fallback: support old ?uid= links during transition
    const legacyUid = url.searchParams.get("uid");

    if (!token && !legacyUid) {
      return new Response(
        `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Decivio</title></head>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
        <div style="text-align:center;max-width:400px;"><h1>Ungültiger Link</h1><p>Dieser Abmelde-Link ist ungültig.</p></div>
        </body></html>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;

    if (token) {
      // Token-based opt-out (secure)
      const { data: tokenRow, error: tokenError } = await supabase
        .from("email_action_tokens")
        .select("*")
        .eq("token", token)
        .eq("action_type", "reengagement_optout")
        .single();

      if (tokenError || !tokenRow) {
        return new Response(
          `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Decivio</title></head>
          <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
          <div style="text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <h1 style="font-size:24px;margin:0 0 12px;">❌ Ungültiger Link</h1>
            <p style="color:#64748B;margin:0;">Dieser Abmelde-Link ist ungültig oder abgelaufen.</p>
          </div>
          </body></html>`,
          { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Check expiration
      if (new Date(tokenRow.expires_at) < new Date()) {
        return new Response(
          `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Decivio</title></head>
          <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
          <div style="text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <h1 style="font-size:24px;margin:0 0 12px;">⏰ Link abgelaufen</h1>
            <p style="color:#64748B;margin:0;">Dieser Link ist abgelaufen. Bitte melden Sie sich an und deaktivieren Sie Re-engagement E-Mails unter Einstellungen → Benachrichtigungen.</p>
          </div>
          </body></html>`,
          { status: 410, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      // Already used? Still show success (idempotent)
      userId = tokenRow.user_id;

      // Mark token as used
      if (!tokenRow.used) {
        await supabase
          .from("email_action_tokens")
          .update({ used: true, used_at: new Date().toISOString() })
          .eq("id", tokenRow.id);
      }
    } else if (legacyUid) {
      // Legacy fallback — will be removed in future
      userId = legacyUid;
    }

    if (!userId) {
      return new Response(
        `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Decivio</title></head>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
        <div style="text-align:center;max-width:400px;"><h1>Fehler</h1><p>Benutzer konnte nicht identifiziert werden.</p></div>
        </body></html>`,
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Opt out
    await supabase
      .from("profiles")
      .update({ email_reengagement_opt_out: true })
      .eq("user_id", userId);

    return new Response(
      `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Abgemeldet — Decivio</title></head>
      <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
      <div style="text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="font-size:24px;margin:0 0 12px;">✅ Erfolgreich abgemeldet</h1>
        <p style="color:#64748B;margin:0 0 16px;">Sie erhalten keine Re-Engagement E-Mails mehr von Decivio.</p>
        <a href="https://app.decivio.com/settings" style="display:inline-block;padding:8px 20px;background:#EF4444;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">Einstellungen ändern</a>
      </div>
      </body></html>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

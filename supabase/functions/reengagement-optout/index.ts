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
    const userId = url.searchParams.get("uid");

    if (!userId) {
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

    await supabase
      .from("profiles")
      .update({ email_reengagement_opt_out: true })
      .eq("user_id", userId);

    return new Response(
      `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Abgemeldet — Decivio</title></head>
      <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F1F5F9;">
      <div style="text-align:center;max-width:400px;padding:40px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="font-size:24px;margin:0 0 12px;">✅ Erfolgreich abgemeldet</h1>
        <p style="color:#64748B;margin:0;">Sie erhalten keine Re-Engagement E-Mails mehr von Decivio.</p>
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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://app.decivio.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (authHeader !== serviceKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { org_id, org_name, user_id, dunning_step } = await req.json();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get user email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user_id)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
  const email = authUser?.user?.email;
  if (!email) {
    return new Response(JSON.stringify({ error: "No email found" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userName = profile?.full_name || email;
  const billingUrl = `${APP_URL}/settings?tab=billing`;

  const templates: Record<number, { subject: string; headline: string; body: string; ctaLabel: string; urgency: string }> = {
    1: {
      subject: `Zahlung fehlgeschlagen — Aktion erforderlich`,
      headline: "Ihre Zahlung konnte nicht verarbeitet werden",
      body: `Leider konnte Ihre letzte Zahlung für <strong>${org_name}</strong> nicht verarbeitet werden. 
             Bitte aktualisieren Sie Ihre Zahlungsmethode, um eine Unterbrechung Ihres Zugangs zu vermeiden.`,
      ctaLabel: "Zahlungsmethode aktualisieren",
      urgency: "medium",
    },
    2: {
      subject: `Erinnerung: Zahlungsmethode für ${org_name} aktualisieren`,
      headline: "Ihre Zahlung ist weiterhin ausstehend",
      body: `Wir haben Sie vor 3 Tagen über eine fehlgeschlagene Zahlung informiert. 
             Bitte aktualisieren Sie Ihre Zahlungsmethode zeitnah, um Ihren vollen Zugang zu behalten.
             <br/><br/>
             <strong>Ohne Aktualisierung wird Ihr Zugang in 7 Tagen auf den Free-Plan eingeschränkt.</strong>`,
      ctaLabel: "Jetzt Zahlungsmethode aktualisieren",
      urgency: "high",
    },
    3: {
      subject: `Letzte Warnung: Zugang wird in 3 Tagen eingeschränkt`,
      headline: "Letzte Warnung — Zugang wird eingeschränkt",
      body: `Ihre Zahlung ist seit 7 Tagen ausstehend. In <strong>3 Tagen</strong> wird Ihr Zugang auf den Free-Plan zurückgestuft.
             <br/><br/>
             <strong>Folgende Features verlieren Sie:</strong>
             <ul style="margin-top:8px;padding-left:20px;">
               <li>KI Daily Brief & Copilot</li>
               <li>Cost-of-Delay Echtzeit-Tracking</li>
               <li>Alle Analytics-Module</li>
               <li>Automatisierungsregeln</li>
               <li>Unbegrenzte Entscheidungen & Teams</li>
             </ul>
             <br/>
             Ihre Daten bleiben erhalten — Sie können jederzeit upgraden, um wieder vollen Zugang zu erhalten.`,
      ctaLabel: "Jetzt Zahlungsmethode aktualisieren",
      urgency: "critical",
    },
    4: {
      subject: `Ihr Zugang wurde auf Free eingeschränkt`,
      headline: "Ihr Zugang wurde eingeschränkt",
      body: `Da Ihre Zahlung seit 10 Tagen ausstehend ist, wurde Ihr Plan für <strong>${org_name}</strong> auf Free zurückgestuft.
             <br/><br/>
             <strong>Keine Sorge — Ihre Daten sind sicher.</strong> Aktualisieren Sie Ihre Zahlungsmethode und upgraden Sie, um sofort wieder vollen Zugang zu erhalten.`,
      ctaLabel: "Jetzt upgraden und Zugang wiederherstellen",
      urgency: "critical",
    },
  };

  const tpl = templates[dunning_step] || templates[1];

  const urgencyColors: Record<string, { bg: string; border: string }> = {
    medium: { bg: "#FEF3C7", border: "#F59E0B" },
    high: { bg: "#FED7AA", border: "#EA580C" },
    critical: { bg: "#FEE2E2", border: "#DC2626" },
  };
  const colors = urgencyColors[tpl.urgency] || urgencyColors.medium;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:${colors.bg};border-bottom:2px solid ${colors.border};padding:20px 32px;">
      <h1 style="margin:0;font-size:20px;color:#111827;">${tpl.headline}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Hallo ${userName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">${tpl.body}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${billingUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
          ${tpl.ctaLabel}
        </a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
        Fragen? Antworten Sie auf diese E-Mail oder kontaktieren Sie uns unter support@decivio.com
      </p>
    </div>
  </div>
</body>
</html>`;

  // Log the email (in production, integrate with email provider)
  console.log(`Dunning email step ${dunning_step} sent to ${email} for org ${org_id}`);
  console.log(`Subject: ${tpl.subject}`);

  return new Response(
    JSON.stringify({ success: true, step: dunning_step, email }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

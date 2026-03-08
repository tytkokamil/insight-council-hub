import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { org_id, org_name, user_id, days_left, reminder_type } = await req.json();

  // Get user email
  const { data: userData } = await supabase.auth.admin.getUserById(user_id);
  const email = userData?.user?.email;
  if (!email) {
    return new Response(JSON.stringify({ error: "User email not found" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const appUrl = supabaseUrl.replace(".supabase.co", "").includes("localhost")
    ? "http://localhost:5173"
    : "https://decivio.com";

  let subject: string;
  let htmlBody: string;

  if (reminder_type === "expired") {
    subject = "Ihre Decivio Testphase ist abgelaufen";
    htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Ihre Testphase ist abgelaufen</h1>
        </div>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">
          Hallo,<br><br>
          Ihre 14-tägige Testphase bei Decivio ist abgelaufen. Ihr Account wurde auf den kostenlosen Plan umgestellt.
        </p>
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 14px; font-weight: 600; color: #991B1B; margin: 0 0 12px;">Was Sie jetzt nicht mehr nutzen können:</p>
          <ul style="font-size: 13px; color: #7F1D1D; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Echtzeit Cost-of-Delay Tracking</li>
            <li>KI Daily Brief & Copilot</li>
            <li>Alle Analytics-Module</li>
            <li>Executive Hub</li>
            <li>Unlimitierte Entscheidungen</li>
            <li>Team-Kollaboration</li>
          </ul>
        </div>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">
          Ihre Daten sind sicher gespeichert. Upgraden Sie jederzeit um sofort wieder vollen Zugriff zu erhalten.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}/upgrade" style="display: inline-block; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Jetzt upgraden — ab €59/Mo
          </a>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
          Decivio · Decision Intelligence Platform
        </p>
      </div>
    `;
  } else if (reminder_type === "final") {
    subject = "Letzte Erinnerung: Ihre Decivio Testphase endet morgen";
    htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 6px 16px; margin-bottom: 16px;">
            <span style="font-size: 13px; font-weight: 600; color: #DC2626;">⏰ Nur noch 1 Tag</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Ihre Testphase endet morgen</h1>
        </div>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">
          Hallo,<br><br>
          morgen endet Ihre kostenlose Testphase. Danach wird Ihr Account auf den Free-Plan umgestellt und Premium-Features werden deaktiviert.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}/upgrade" style="display: inline-block; background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Jetzt upgraden — ab €59/Mo
          </a>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
          Decivio · Decision Intelligence Platform
        </p>
      </div>
    `;
  } else {
    // First reminder
    subject = `Ihre Decivio Testphase endet in ${days_left} Tagen`;
    htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 6px 16px; margin-bottom: 16px;">
            <span style="font-size: 13px; font-weight: 600; color: #92400E;">⏳ Noch ${days_left} Tage</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0;">Ihre Testphase endet bald</h1>
        </div>
        <p style="font-size: 15px; color: #444; line-height: 1.6;">
          Hallo,<br><br>
          Ihre 14-tägige Testphase bei Decivio endet in <strong>${days_left} Tagen</strong>. 
          Sichern Sie sich jetzt alle Premium-Features dauerhaft.
        </p>
        <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 14px; font-weight: 600; color: #0C4A6E; margin: 0 0 12px;">Was Sie mit dem Upgrade behalten:</p>
          <ul style="font-size: 13px; color: #075985; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Echtzeit Cost-of-Delay Tracking</li>
            <li>KI Daily Brief & Copilot</li>
            <li>Alle Analytics-Module</li>
            <li>Executive Hub & Board Reports</li>
            <li>Unlimitierte Entscheidungen & Teams</li>
            <li>Cryptographic Audit Trail</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}/upgrade" style="display: inline-block; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Jetzt upgraden — ab €59/Mo
          </a>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
          Decivio · Decision Intelligence Platform
        </p>
      </div>
    `;
  }

  // Log the email attempt (actual sending requires email provider integration)
  console.log(`Trial reminder email queued: ${reminder_type} for ${email} (org: ${org_name})`);

  return new Response(
    JSON.stringify({ success: true, email, reminder_type, days_left }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

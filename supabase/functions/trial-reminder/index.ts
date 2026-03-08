import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { trialReminderEmail, trialFinalEmail, trialExpiredEmail } from "../_shared/email-templates.ts";

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

  const { data: userData } = await supabase.auth.admin.getUserById(user_id);
  const email = userData?.user?.email;
  if (!email) {
    return new Response(JSON.stringify({ error: "User email not found" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user_id)
    .single();

  const userName = profile?.full_name || email;
  const appUrl = Deno.env.get("APP_URL") || "https://app.decivio.com";

  let subject: string;
  let html: string;

  if (reminder_type === "expired") {
    ({ subject, html } = trialExpiredEmail({ userName, appUrl }));
  } else if (reminder_type === "final") {
    ({ subject, html } = trialFinalEmail({ userName, appUrl }));
  } else {
    ({ subject, html } = trialReminderEmail({ userName, daysLeft: days_left, appUrl }));
  }

  console.log(`Trial reminder email queued: ${reminder_type} for ${email} (org: ${org_name})`);
  console.log(`Subject: ${subject}`);

  return new Response(
    JSON.stringify({ success: true, email, reminder_type, days_left, subject }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

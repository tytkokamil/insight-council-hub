import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { dunningEmail } from "../_shared/email-templates.ts";

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

  const { subject, html } = dunningEmail({
    userName,
    orgName: org_name,
    dunningStep: dunning_step,
    billingUrl,
  });

  // Log the email (in production, integrate with email provider)
  console.log(`Dunning email step ${dunning_step} sent to ${email} for org ${org_id}`);
  console.log(`Subject: ${subject}`);

  return new Response(
    JSON.stringify({ success: true, step: dunning_step, email, subject }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

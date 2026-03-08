import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { teamInviteEmail } from "../_shared/email-templates.ts";

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { email, teamId, teamName } = await req.json();
    if (!email || !teamId) throw new Error("Missing email or teamId");

    // Get inviter name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();
    const inviterName = inviterProfile?.full_name || user.email || "Ein Teammitglied";

    // Check if user with this email already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // Check if already a member
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (membership) {
        return new Response(
          JSON.stringify({ error: "Benutzer ist bereits Teammitglied" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add directly to team
      await supabase.from("team_members").insert({ team_id: teamId, user_id: existingUser.id });

      await supabase
        .from("team_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("team_id", teamId)
        .eq("email", email);

      return new Response(
        JSON.stringify({ success: true, message: "Benutzer wurde direkt zum Team hinzugefügt" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User doesn't exist — create invitation record
    const { error: inviteError } = await supabase
      .from("team_invitations")
      .upsert(
        { team_id: teamId, email, invited_by: user.id, status: "pending" },
        { onConflict: "team_id,email" }
      );

    if (inviteError) throw inviteError;

    const APP_URL = Deno.env.get("APP_URL") || "https://app.decivio.com";

    // Generate email template
    const { subject } = teamInviteEmail({
      inviterName,
      teamName: teamName || "ein Team",
      acceptUrl: `${APP_URL}/auth`,
    });

    // Send invite email via Supabase Auth
    const { error: signupError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { invited_to_team: teamName || "ein Team" },
      redirectTo: `${APP_URL}/auth`,
    });

    if (signupError) {
      if (!signupError.message.includes("already")) {
        throw signupError;
      }
    }

    console.log(`Team invite sent to ${email} for team ${teamName}. Subject: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, message: "Einladung wurde per E-Mail gesendet" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

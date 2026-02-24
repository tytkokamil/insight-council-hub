import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { teamId } = await req.json();
    if (!teamId) {
      return new Response(JSON.stringify({ error: "teamId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check permission: must be org_admin/org_owner or team admin/lead
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isOrgAdmin = roleData?.role === "org_owner" || roleData?.role === "org_admin";

    if (!isOrgAdmin) {
      const { data: memberData } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (memberData?.role !== "admin" && memberData?.role !== "lead") {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Cascade delete using service role (bypasses RLS)
    // 1. Decisions linked to this team
    const { data: teamDecisions } = await supabase.from("decisions").select("id").eq("team_id", teamId);
    const decIds = (teamDecisions || []).map((d: any) => d.id);

    if (decIds.length > 0) {
      await supabase.from("decision_dependencies").delete().or(`source_decision_id.in.(${decIds.join(",")}),target_decision_id.in.(${decIds.join(",")})`);
      await supabase.from("decision_reviews").delete().in("decision_id", decIds);
      await supabase.from("comments").delete().in("decision_id", decIds);
      await supabase.from("decision_votes").delete().in("decision_id", decIds);
      await supabase.from("decision_shares").delete().in("decision_id", decIds);
      await supabase.from("audit_logs").delete().in("decision_id", decIds);
      await supabase.from("decision_tags").delete().in("decision_id", decIds);
      await supabase.from("decision_versions").delete().in("decision_id", decIds);
      await supabase.from("stakeholder_positions").delete().in("decision_id", decIds);
      await supabase.from("decision_goal_links").delete().in("decision_id", decIds);
      await supabase.from("lessons_learned").delete().in("decision_id", decIds);
      await supabase.from("decision_scenarios").delete().in("decision_id", decIds);
      await supabase.from("risk_decision_links").delete().in("decision_id", decIds);
      await supabase.from("decision_watchlist").delete().in("decision_id", decIds);
      await supabase.from("decisions").delete().in("id", decIds);
    }

    // 2. Tasks linked to this team
    const { data: teamTasks } = await supabase.from("tasks").select("id").eq("team_id", teamId);
    const taskIds = (teamTasks || []).map((t: any) => t.id);
    if (taskIds.length > 0) {
      await supabase.from("risk_task_links").delete().in("task_id", taskIds);
      await supabase.from("decision_dependencies").delete().or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
      await supabase.from("tasks").delete().in("id", taskIds);
    }

    // 3. Risks linked to this team
    await supabase.from("risks").delete().eq("team_id", teamId);

    // 4. Team-specific data
    await supabase.from("team_messages").delete().eq("team_id", teamId);
    await supabase.from("team_chat_reads").delete().eq("team_id", teamId);
    await supabase.from("team_invitations").delete().eq("team_id", teamId);
    await supabase.from("team_members").delete().eq("team_id", teamId);
    await supabase.from("automation_rules").delete().eq("team_id", teamId);
    await supabase.from("strategic_goals").delete().eq("team_id", teamId);
    await supabase.from("meeting_sessions").delete().eq("team_id", teamId);

    // 5. Delete team_defaults if table exists
    try {
      await supabase.from("team_defaults").delete().eq("team_id", teamId);
    } catch (_) { /* table may not exist */ }

    // 6. Delete the team itself
    const { error: deleteError } = await supabase.from("teams").delete().eq("id", teamId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

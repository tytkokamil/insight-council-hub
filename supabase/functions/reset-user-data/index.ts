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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uid = user.id;

    // 1. Get user's decisions
    const { data: userDecisions } = await supabase.from("decisions").select("id").eq("created_by", uid);
    const decIds = (userDecisions || []).map((d: any) => d.id);

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
    }

    // 2. Get user's tasks
    const { data: userTasks } = await supabase.from("tasks").select("id").eq("created_by", uid);
    const taskIds = (userTasks || []).map((t: any) => t.id);
    if (taskIds.length > 0) {
      await supabase.from("risk_task_links").delete().in("task_id", taskIds);
      await supabase.from("decision_dependencies").delete().or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
    }
    await supabase.from("tasks").delete().eq("created_by", uid);

    // 3. Delete decisions
    await supabase.from("decisions").delete().eq("created_by", uid);

    // 4. Delete risks
    await supabase.from("risks").delete().eq("created_by", uid);

    // 5. Delete strategic goals
    await supabase.from("strategic_goals").delete().eq("created_by", uid);

    // 6. Delete teams
    const { data: userTeams } = await supabase.from("teams").select("id").eq("created_by", uid);
    const teamIds = (userTeams || []).map((t: any) => t.id);
    if (teamIds.length > 0) {
      await supabase.from("team_messages").delete().in("team_id", teamIds);
      await supabase.from("team_chat_reads").delete().in("team_id", teamIds);
      await supabase.from("team_invitations").delete().in("team_id", teamIds);
      await supabase.from("team_members").delete().in("team_id", teamIds);
      await supabase.from("automation_rules").delete().in("team_id", teamIds);
      await supabase.from("teams").delete().in("id", teamIds);
    }

    // 7. Reset profile counter
    await supabase.from("profiles").update({ decision_count: 0 }).eq("user_id", uid);

    // 8. Delete saved views, notifications, briefings, gamification
    await supabase.from("saved_views").delete().eq("user_id", uid);
    await supabase.from("notifications").delete().eq("user_id", uid);
    await supabase.from("briefings").delete().eq("user_id", uid);
    await supabase.from("gamification_scores").delete().eq("user_id", uid);

    return new Response(JSON.stringify({
      success: true,
      deleted: {
        decisions: decIds.length,
        tasks: taskIds.length,
        teams: teamIds.length,
      },
    }), {
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

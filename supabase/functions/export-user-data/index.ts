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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uid = user.id;

    // Collect all user data for GDPR Art. 20 export
    const [
      { data: profile },
      { data: decisions },
      { data: comments },
      { data: tasks },
      { data: risks },
      { data: teams },
      { data: reviews },
      { data: auditLogs },
      { data: notifications },
      { data: savedViews },
      { data: watchlist },
      { data: goals },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).single(),
      supabase.from("decisions").select("id, title, description, status, priority, category, cost_per_day, due_date, created_at, updated_at, implemented_at").or(`created_by.eq.${uid},owner_id.eq.${uid}`).order("created_at", { ascending: false }),
      supabase.from("comments").select("id, content, type, created_at, decision_id").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("tasks").select("id, title, description, status, priority, due_date, created_at").or(`created_by.eq.${uid},assignee_id.eq.${uid}`).order("created_at", { ascending: false }),
      supabase.from("risks").select("id, title, description, likelihood, impact, status, created_at").eq("created_by", uid).order("created_at", { ascending: false }),
      supabase.from("team_members").select("team_id, role, joined_at, teams(name)").eq("user_id", uid),
      supabase.from("decision_reviews").select("id, decision_id, status, feedback, reviewed_at, created_at").eq("reviewer_id", uid).order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("id, action, field_name, old_value, new_value, created_at, decision_id").eq("user_id", uid).order("created_at", { ascending: false }).limit(500),
      supabase.from("notifications").select("id, title, message, type, read, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
      supabase.from("saved_views").select("*").eq("user_id", uid),
      supabase.from("decision_watchlist").select("decision_id, created_at").eq("user_id", uid),
      supabase.from("strategic_goals").select("*").eq("created_by", uid),
    ]);

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: uid,
        email: user.email,
        format: "GDPR Art. 20 — Data Portability Export",
        platform: "Decivio",
      },
      profile: profile || null,
      decisions: decisions || [],
      comments: comments || [],
      tasks: tasks || [],
      risks: risks || [],
      teams: teams || [],
      reviews: reviews || [],
      audit_activity: auditLogs || [],
      notifications: notifications || [],
      saved_views: savedViews || [],
      watchlist: watchlist || [],
      strategic_goals: goals || [],
    };

    console.log(`Data export generated for user ${uid}`);

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="decivio-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("Data export error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

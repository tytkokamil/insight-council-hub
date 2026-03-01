import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check platform admin
    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // --- Registrations ---
    const { count: regToday } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", todayStart);
    const { count: regWeek } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo);
    const { count: regMonth } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo);
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });

    // --- Active Orgs (login in 7 days) ---
    const { data: activeOrgData } = await supabase
      .from("active_sessions")
      .select("user_id")
      .gte("last_active_at", weekAgo);
    const activeUserIds = new Set((activeOrgData || []).map(s => s.user_id));
    const { data: orgProfiles } = await supabase
      .from("profiles")
      .select("org_id")
      .not("org_id", "is", null);
    const activeOrgIds = new Set<string>();
    (orgProfiles || []).forEach(p => {
      if (p.org_id && activeUserIds.has(p.org_id)) activeOrgIds.add(p.org_id);
    });
    // Simpler: count distinct org_ids from profiles where user recently active
    const { data: recentProfiles } = await supabase
      .from("profiles")
      .select("org_id, user_id")
      .not("org_id", "is", null);
    const activeOrgs = new Set<string>();
    (recentProfiles || []).forEach(p => {
      if (p.org_id && activeUserIds.has(p.user_id)) activeOrgs.add(p.org_id);
    });

    // --- Churn (30d no login) ---
    const { data: allProfiles } = await supabase.from("profiles").select("user_id");
    const { data: recentSessions } = await supabase
      .from("active_sessions")
      .select("user_id")
      .gte("last_active_at", monthAgo);
    const recentUserIds = new Set((recentSessions || []).map(s => s.user_id));
    const churnedUsers = (allProfiles || []).filter(p => !recentUserIds.has(p.user_id)).length;

    // --- Time to First Decision ---
    const { data: firstDecisions } = await supabase
      .from("decisions")
      .select("created_by, created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    const { data: userCreations } = await supabase
      .from("profiles")
      .select("user_id, created_at")
      .limit(500);
    const userCreatedMap = new Map((userCreations || []).map(u => [u.user_id, new Date(u.created_at).getTime()]));
    const firstDecisionMap = new Map<string, number>();
    (firstDecisions || []).forEach(d => {
      if (!firstDecisionMap.has(d.created_by)) {
        firstDecisionMap.set(d.created_by, new Date(d.created_at).getTime());
      }
    });
    let ttfdSum = 0, ttfdCount = 0;
    firstDecisionMap.forEach((decTime, userId) => {
      const regTime = userCreatedMap.get(userId);
      if (regTime) {
        const minutes = (decTime - regTime) / 60000;
        if (minutes < 10080) { // within 7 days
          ttfdSum += minutes;
          ttfdCount++;
        }
      }
    });
    const avgTtfd = ttfdCount > 0 ? Math.round(ttfdSum / ttfdCount) : null;

    // --- Week 1 Retention ---
    const { data: usersOlderThanWeek } = await supabase
      .from("profiles")
      .select("user_id")
      .lte("created_at", weekAgo);
    const olderUserIds = new Set((usersOlderThanWeek || []).map(u => u.user_id));
    let retainedCount = 0;
    olderUserIds.forEach(uid => { if (recentUserIds.has(uid)) retainedCount++; });
    const week1Retention = olderUserIds.size > 0 ? Math.round((retainedCount / olderUserIds.size) * 100) : null;

    // --- Team Expansion Rate ---
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("team_id")
      .limit(1000);
    const teamSizes = new Map<string, number>();
    (teamMembers || []).forEach(tm => {
      teamSizes.set(tm.team_id, (teamSizes.get(tm.team_id) || 0) + 1);
    });
    const teamsWithMultiple = [...teamSizes.values()].filter(s => s > 1).length;
    const teamExpansionRate = teamSizes.size > 0 ? Math.round((teamsWithMultiple / teamSizes.size) * 100) : null;

    // --- Decision Completion Rate ---
    const { count: totalDecisions } = await supabase.from("decisions").select("*", { count: "exact", head: true })
      .is("deleted_at", null);
    const { count: implementedDecisions } = await supabase.from("decisions").select("*", { count: "exact", head: true })
      .is("deleted_at", null).eq("status", "implemented");
    const completionRate = (totalDecisions && totalDecisions > 0)
      ? Math.round(((implementedDecisions || 0) / totalDecisions) * 100) : null;

    // --- Briefing Open Rate ---
    const { count: totalBriefings } = await supabase.from("briefings").select("*", { count: "exact", head: true });
    const briefingOpenRate = (totalUsers && totalUsers > 0 && totalBriefings)
      ? Math.min(100, Math.round((totalBriefings / totalUsers) * 100)) : null;

    // --- Plan Distribution ---
    const { data: orgs } = await supabase.from("organizations").select("plan");
    const planDist: Record<string, number> = {};
    (orgs || []).forEach(o => {
      planDist[o.plan] = (planDist[o.plan] || 0) + 1;
    });

    // --- MRR / ARR estimates ---
    const planPrices: Record<string, number> = { free: 0, starter: 49, professional: 149, enterprise: 499 };
    let mrr = 0;
    Object.entries(planDist).forEach(([plan, count]) => {
      mrr += (planPrices[plan] || 0) * count;
    });

    const result = {
      registrations: { today: regToday || 0, week: regWeek || 0, month: regMonth || 0, total: totalUsers || 0 },
      activeOrgs: activeOrgs.size,
      totalOrgs: new Set((orgProfiles || []).map(p => p.org_id).filter(Boolean)).size,
      churn: { count: churnedUsers, total: totalUsers || 0, rate: totalUsers ? Math.round((churnedUsers / totalUsers) * 100) : 0 },
      timeToFirstDecision: avgTtfd,
      week1Retention,
      teamExpansionRate,
      decisionCompletionRate: completionRate,
      briefingOpenRate,
      planDistribution: planDist,
      mrr,
      arr: mrr * 12,
      totalDecisions: totalDecisions || 0,
      timestamp: now.toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-analytics error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

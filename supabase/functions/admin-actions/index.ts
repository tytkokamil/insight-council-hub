import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Platform admin check
    const { data: adminRow } = await supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action } = body;

    // Helper: log admin action
    const logAction = async (actionName: string, targetOrgId?: string, targetUserId?: string, details?: any) => {
      await supabase.from("platform_admin_logs").insert({
        admin_user_id: user.id,
        action: actionName,
        target_org_id: targetOrgId || null,
        target_user_id: targetUserId || null,
        details: details || null,
      });
    };

    switch (action) {
      // ─── LIST ORGS ────────────────────────────────
      case "list_orgs": {
        const { search = "", planFilter = "all" } = body;
        let query = supabase.from("organizations").select("*").order("created_at", { ascending: false });
        if (planFilter !== "all") query = query.eq("plan", planFilter);
        if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        const { data: orgRows } = await query.limit(200);

        const orgs = await Promise.all((orgRows || []).map(async (org: any) => {
          const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("org_id", org.id);
          const { count: decCount } = await supabase.from("decisions").select("*", { count: "exact", head: true }).eq("org_id", org.id).is("deleted_at", null);
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            users: userCount || 0,
            decisions: decCount || 0,
            created_at: org.created_at,
            last_activity: null, // would need session data
            is_active: org.is_active ?? true,
            support_notes: org.support_notes,
          };
        }));

        return json({ orgs });
      }

      // ─── LIST USERS ───────────────────────────────
      case "list_users": {
        const { search = "" } = body;
        let query = supabase.from("profiles").select("user_id, full_name, email, org_id, created_at, last_seen").order("created_at", { ascending: false });
        if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        const { data: profiles } = await query.limit(200);

        const users = await Promise.all((profiles || []).map(async (p: any) => {
          const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", p.user_id).limit(1).single();
          const { data: orgRow } = p.org_id ? await supabase.from("organizations").select("name, plan").eq("id", p.org_id).single() : { data: null };
          const { data: mfaRow } = await supabase.from("mfa_settings").select("email_otp_enabled, totp_enabled").eq("user_id", p.user_id).single();

          return {
            user_id: p.user_id,
            full_name: p.full_name,
            email: p.email,
            org_name: orgRow?.name || null,
            role: roleRow?.role || "unknown",
            plan: orgRow?.plan || "free",
            created_at: p.created_at,
            last_seen: p.last_seen,
            mfa_active: !!(mfaRow?.email_otp_enabled || mfaRow?.totp_enabled),
          };
        }));

        return json({ users });
      }

      // ─── GROWTH DATA ──────────────────────────────
      case "get_growth_data": {
        // Simplified: return counts per month for last 12 months
        const months: any[] = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const start = d.toISOString();
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
          const label = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });

          const { count: orgCount } = await supabase.from("organizations").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end);
          const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end);
          const { count: decCount } = await supabase.from("decisions").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end).is("deleted_at", null);

          months.push({ month: label, orgs: orgCount || 0, users: userCount || 0, decisions: decCount || 0 });
        }

        // Top 10 orgs
        const { data: allOrgs } = await supabase.from("organizations").select("id, name, plan, created_at").limit(100);
        const topOrgs = await Promise.all((allOrgs || []).slice(0, 10).map(async (org: any) => {
          const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("org_id", org.id);
          const { count: decisions } = await supabase.from("decisions").select("*", { count: "exact", head: true }).eq("org_id", org.id).is("deleted_at", null);
          return {
            name: org.name,
            plan: org.plan,
            users: users || 0,
            decisions: decisions || 0,
            since: new Date(org.created_at).toLocaleDateString("de-DE"),
            lastActivity: null,
          };
        }));
        // Sort by decisions desc
        topOrgs.sort((a, b) => b.decisions - a.decisions);

        return json({ growth: months, topOrgs: topOrgs.slice(0, 10) });
      }

      // ─── CHANGE PLAN ──────────────────────────────
      case "change_plan": {
        const { orgId, plan } = body;
        await supabase.from("organizations").update({ plan }).eq("id", orgId);
        await logAction("change_plan", orgId, undefined, { plan });
        return json({ ok: true });
      }

      // ─── EXTEND TRIAL ─────────────────────────────
      case "extend_trial": {
        const { orgId, days = 14 } = body;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        await supabase.from("organizations").update({ trial_ends_at: endDate.toISOString() }).eq("id", orgId);
        await logAction("extend_trial", orgId, undefined, { days });
        return json({ ok: true });
      }

      // ─── TOGGLE PILOT ─────────────────────────────
      case "toggle_pilot": {
        const { orgId } = body;
        const { data: org } = await supabase.from("organizations").select("pilot_customer").eq("id", orgId).single();
        await supabase.from("organizations").update({ pilot_customer: !org?.pilot_customer }).eq("id", orgId);
        await logAction("toggle_pilot", orgId, undefined, { pilot_customer: !org?.pilot_customer });
        return json({ ok: true });
      }

      // ─── DEACTIVATE ORG ───────────────────────────
      case "deactivate_org": {
        const { orgId } = body;
        await supabase.from("organizations").update({ is_active: false }).eq("id", orgId);
        await logAction("deactivate_org", orgId);
        return json({ ok: true });
      }

      // ─── EXPORT ORG ───────────────────────────────
      case "export_org": {
        const { orgId } = body;
        const { data: org } = await supabase.from("organizations").select("*").eq("id", orgId).single();
        const { data: profiles } = await supabase.from("profiles").select("*").eq("org_id", orgId);
        const { data: decisions } = await supabase.from("decisions").select("*").eq("org_id", orgId);
        const { data: teams } = await supabase.from("teams").select("*").eq("org_id", orgId);
        await logAction("export_org", orgId);
        return json({ org, profiles, decisions, teams });
      }

      // ─── UPDATE SUPPORT NOTES ─────────────────────
      case "update_support_notes": {
        const { orgId, notes } = body;
        await supabase.from("organizations").update({ support_notes: notes }).eq("id", orgId);
        await logAction("update_support_notes", orgId);
        return json({ ok: true });
      }

      // ─── RESET PASSWORD ───────────────────────────
      case "reset_password": {
        const { userId } = body;
        const { data: profile } = await supabase.from("profiles").select("email").eq("user_id", userId).single();
        if (profile?.email) {
          await supabase.auth.admin.generateLink({ type: "recovery", email: profile.email });
        }
        await logAction("reset_password", undefined, userId);
        return json({ ok: true });
      }

      // ─── VERIFY EMAIL ─────────────────────────────
      case "verify_email": {
        const { userId } = body;
        await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
        await logAction("verify_email", undefined, userId);
        return json({ ok: true });
      }

      // ─── BAN USER ─────────────────────────────────
      case "ban_user": {
        const { userId } = body;
        await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        await logAction("ban_user", undefined, userId);
        return json({ ok: true });
      }

      // ─── MAKE PLATFORM ADMIN ──────────────────────
      case "make_platform_admin": {
        const { userId } = body;
        await supabase.from("platform_admins").upsert({ user_id: userId }, { onConflict: "user_id" });
        await logAction("make_platform_admin", undefined, userId);
        return json({ ok: true });
      }

      // ─── DELETE USER ──────────────────────────────
      case "delete_user": {
        const { userId } = body;
        await supabase.auth.admin.deleteUser(userId);
        await logAction("delete_user", undefined, userId);
        return json({ ok: true });
      }

      // ─── FEATURE FLAGS ────────────────────────────
      case "list_feature_flags": {
        const { data: flags } = await supabase.from("feature_flags").select("*").order("category");
        const { data: overridesRaw } = await supabase.from("feature_flag_overrides").select("*");

        // Count overrides per flag
        const overrideCounts: Record<string, number> = {};
        (overridesRaw || []).forEach((o: any) => {
          overrideCounts[o.flag_id] = (overrideCounts[o.flag_id] || 0) + 1;
        });

        const enrichedFlags = (flags || []).map((f: any) => ({
          ...f,
          override_count: overrideCounts[f.id] || 0,
        }));

        // Enrich overrides with org names and flag keys
        const overrides = await Promise.all((overridesRaw || []).map(async (o: any) => {
          const { data: org } = await supabase.from("organizations").select("name").eq("id", o.org_id).single();
          const flag = (flags || []).find((f: any) => f.id === o.flag_id);
          const { data: setByProfile } = o.set_by ? await supabase.from("profiles").select("full_name").eq("user_id", o.set_by).single() : { data: null };
          return {
            ...o,
            org_name: org?.name || "Unknown",
            flag_key: flag?.feature_key || "unknown",
            set_by_name: setByProfile?.full_name || null,
          };
        }));

        return json({ flags: enrichedFlags, overrides });
      }

      case "toggle_feature_flag": {
        const { flagId, enabled } = body;
        await supabase.from("feature_flags").update({ enabled }).eq("id", flagId);
        await logAction("toggle_feature_flag", undefined, undefined, { flagId, enabled });
        return json({ ok: true });
      }

      case "create_feature_flag": {
        const { key, label, description } = body;
        await supabase.from("feature_flags").insert({
          feature_key: key,
          label: label || key,
          description: description || "",
          enabled: true,
          category: "custom",
        });
        await logAction("create_feature_flag", undefined, undefined, { key });
        return json({ ok: true });
      }

      // ─── PILOTS ───────────────────────────────────
      case "list_pilots": {
        const { data: pilots } = await supabase.from("pilot_customers").select("*").order("created_at", { ascending: false });
        const enriched = await Promise.all((pilots || []).map(async (p: any) => {
          const { data: org } = await supabase.from("organizations").select("name").eq("id", p.org_id).single();
          return { ...p, org_name: org?.name || "Unknown" };
        }));
        const { data: orgList } = await supabase.from("organizations").select("id, name").order("name").limit(100);
        return json({ pilots: enriched, orgs: orgList || [] });
      }

      case "create_pilot": {
        const { orgId, contactName, industry, durationDays, notes } = body;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + parseInt(durationDays || "30"));
        await supabase.from("pilot_customers").insert({
          org_id: orgId,
          contact_name: contactName || null,
          industry: industry || null,
          end_date: endDate.toISOString().split("T")[0],
          notes: notes || null,
          created_by: user.id,
        });
        await supabase.from("organizations").update({ pilot_customer: true }).eq("id", orgId);
        await logAction("create_pilot", orgId, undefined, { durationDays });
        return json({ ok: true });
      }

      case "update_pilot_status": {
        const { pilotId, status } = body;
        await supabase.from("pilot_customers").update({ status, updated_at: new Date().toISOString() }).eq("id", pilotId);
        await logAction("update_pilot_status", undefined, undefined, { pilotId, status });
        return json({ ok: true });
      }

      // ─── SYSTEM HEALTH ────────────────────────────
      case "get_system_health": {
        // List all tables with row counts and RLS status
        const tableNames = [
          "profiles", "organizations", "decisions", "tasks", "teams", "team_members",
          "comments", "audit_logs", "notifications", "decision_reviews", "risks",
          "feature_flags", "feature_flag_overrides", "pilot_customers", "platform_admin_logs",
          "user_roles", "platform_admins", "mfa_settings", "active_sessions",
          "automation_rules", "decision_dependencies", "decision_versions",
        ];

        const tables = await Promise.all(tableNames.map(async (name) => {
          try {
            const { count } = await supabase.from(name).select("*", { count: "exact", head: true });
            return { name, rows: count ?? 0, rls: true }; // If RLS blocks, count would be 0 or null
          } catch {
            return { name, rows: null, rls: false };
          }
        }));

        // Edge functions list (static, from known functions)
        const edgeFunctions = [
          "admin-analytics", "admin-actions", "admin-invite-user", "ai-proxy",
          "analyze-decision", "archive-intelligence", "autonomous-escalation",
          "ceo-briefing", "check-escalations", "daily-brief", "daily-engine",
          "decision-copilot", "decision-suggestions", "delete-account", "delete-team",
          "detect-anomalies", "dispatch-webhook", "email-action", "external-review",
          "extract-decisions", "generate-summaries", "inbound-email",
          "intelligence-analyze", "manage-backup-codes", "notify-teams",
          "predictive-sla", "reset-user-data", "review-notify", "seed-demo-data",
          "send-mfa-otp", "send-team-invite", "send-whatsapp", "similarity-score",
          "simulate-scenarios", "smart-knowledge", "verify-audit", "whatsapp-webhook",
        ].map(name => ({ name, status: "active" }));

        return json({ tables, edgeFunctions });
      }

      // ─── LIST CHURN RISKS ─────────────────────────
      case "list_churn_risks": {
        const { filter: riskFilter = "critical" } = body;

        // Get latest churn entry per org using a subquery approach
        let query = supabase
          .from("churn_risk_log")
          .select("id, org_id, score, risk_level, risk_factors, calculated_at, intervention_sent, intervention_type")
          .order("calculated_at", { ascending: false })
          .limit(500);

        if (riskFilter !== "all") {
          query = query.eq("risk_level", riskFilter);
        }

        const { data: churnRows } = await query;

        // Deduplicate: keep only latest per org
        const seenOrgs = new Set<string>();
        const uniqueEntries = (churnRows || []).filter(row => {
          if (seenOrgs.has(row.org_id)) return false;
          seenOrgs.add(row.org_id);
          return true;
        });

        // Get org names
        const orgIds = uniqueEntries.map(e => e.org_id);
        const { data: orgNames } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds.length > 0 ? orgIds : ["00000000-0000-0000-0000-000000000000"]);

        const nameMap: Record<string, string> = {};
        (orgNames || []).forEach((o: any) => { nameMap[o.id] = o.name; });

        const entries = uniqueEntries.map(e => ({
          ...e,
          org_name: nameMap[e.org_id] || "Unbekannt",
        }));

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score);

        return json({ entries });
      }

      // ─── CRON JOBS ─────────────────────────────
      case "get_cron_jobs": {
        const { data: jobs, error: cronErr } = await supabase.rpc("get_cron_jobs");
        if (cronErr) {
          // Fallback: return empty if function doesn't exist yet
          console.error("get_cron_jobs error:", cronErr);
          return json({ jobs: [] });
        }
        return json({ jobs: jobs || [] });
      }

      case "run_cron_job": {
        const { jobName } = body;
        // Manually trigger the function by name mapping
        const functionMap: Record<string, string> = {
          "daily-engine-06utc": "daily-engine",
          "daily-brief-0530": "daily-engine",
          "check-escalations-every-hour": "check-escalations",
          "detect-anomalies-08utc": "detect-anomalies",
          "trial-reminder-09utc": "daily-engine",
          "weekly-cleanup-digest": "weekly-cleanup-digest",
        };
        const fnName = functionMap[jobName];
        if (fnName) {
          await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({}),
          });
        }
        await logAction("run_cron_job", undefined, undefined, { jobName });
        return json({ ok: true });
      }

      case "toggle_cron_job": {
        const { jobName, active } = body;
        if (active) {
          await supabase.rpc("enable_cron_job", { job_name: jobName });
        } else {
          await supabase.rpc("disable_cron_job", { job_name: jobName });
        }
        await logAction("toggle_cron_job", undefined, undefined, { jobName, active });
        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("admin-actions error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

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

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { confirmation, password, cancel_reason } = await req.json();
    if (confirmation !== "DELETE") {
      return new Response(JSON.stringify({ error: "Confirmation required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Re-authenticate with password ───
    if (!password) {
      return new Response(JSON.stringify({ error: "password_required", message: "Passwort zur Bestätigung erforderlich." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey);
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email!,
      password,
    });
    if (signInError) {
      return new Response(JSON.stringify({ error: "invalid_password", message: "Falsches Passwort." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uid = user.id;

    // ─── Pre-flight checks ───

    // 1. Get user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, full_name")
      .eq("user_id", uid)
      .single();
    const orgId = profile?.org_id;

    // 2. Check if org_owner with other members
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .single();

    if (userRole?.role === "org_owner" && orgId) {
      const { count: memberCount } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .neq("user_id", uid);

      if (memberCount && memberCount > 0) {
        return new Response(JSON.stringify({
          error: "ownership_transfer_required",
          message: "Bitte zuerst Eigentumsrechte übertragen oder alle Mitglieder entfernen, bevor Sie den Account löschen.",
        }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. Check for active Stripe subscription
      const { data: org } = await supabase
        .from("organizations")
        .select("stripe_subscription_id, subscription_status")
        .eq("id", orgId)
        .single();

      if (org?.stripe_subscription_id && org.subscription_status === "active") {
        // Cancel Stripe subscription via Stripe API if key available
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          try {
            const res = await fetch(
              `https://api.stripe.com/v1/subscriptions/${org.stripe_subscription_id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${stripeKey}` },
              }
            );
            if (!res.ok) {
              console.error("Stripe cancel failed:", await res.text());
            }
          } catch (e) {
            console.error("Stripe cancel error:", e);
          }
        }
      }
    }

    // ─── Data Deletion / Anonymization ───

    // Decisions: anonymize for audit trail integrity instead of deleting
    await supabase
      .from("decisions")
      .update({ created_by: uid, owner_id: uid } as any) // keep refs for now
      .or(`created_by.eq.${uid},owner_id.eq.${uid}`);

    // Get user's decision IDs for related data cleanup
    const { data: userDecisions } = await supabase
      .from("decisions")
      .select("id")
      .or(`created_by.eq.${uid},owner_id.eq.${uid}`);
    const decIds = (userDecisions || []).map((d: any) => d.id);

    if (decIds.length > 0) {
      // Delete decision-related personal data in dependency order
      await supabase.from("automation_rule_logs").delete().in("decision_id", decIds);
      await supabase.from("decision_attachments").delete().in("decision_id", decIds);
      await supabase.from("decision_dependencies").delete().or(`source_decision_id.in.(${decIds.join(",")}),target_decision_id.in.(${decIds.join(",")})`);
      await supabase.from("decision_reviews").delete().in("decision_id", decIds);
      await supabase.from("email_action_tokens").delete().in("decision_id", decIds);
      await supabase.from("external_review_tokens").delete().in("decision_id", decIds);
      await supabase.from("decision_votes").delete().in("decision_id", decIds);
      await supabase.from("decision_shares").delete().in("decision_id", decIds);
      await supabase.from("decision_tags").delete().in("decision_id", decIds);
      await supabase.from("decision_versions").delete().in("decision_id", decIds);
      await supabase.from("stakeholder_positions").delete().in("decision_id", decIds);
      await supabase.from("decision_goal_links").delete().in("decision_id", decIds);
      await supabase.from("lessons_learned").delete().in("decision_id", decIds);
      await supabase.from("decision_scenarios").delete().in("decision_id", decIds);
      await supabase.from("risk_decision_links").delete().in("decision_id", decIds);
      await supabase.from("decision_watchlist").delete().in("decision_id", decIds);
      await supabase.from("compliance_events").delete().in("decision_id", decIds);

      // Anonymize audit logs (immutable — cannot delete, so anonymize)
      await supabase.from("audit_logs").update({
        user_id: "00000000-0000-0000-0000-000000000000",
        change_reason: "GDPR Art. 17 — Account gelöscht",
      } as any).in("decision_id", decIds);
    }

    // Anonymize comments (keep content reference for audit, but remove personal data)
    await supabase
      .from("comments")
      .update({ user_id: "00000000-0000-0000-0000-000000000000", content: "[gelöscht]" } as any)
      .eq("user_id", uid);

    // Delete tasks
    const { data: userTasks } = await supabase.from("tasks").select("id").or(`created_by.eq.${uid},assignee_id.eq.${uid}`);
    const taskIds = (userTasks || []).map((t: any) => t.id);
    if (taskIds.length > 0) {
      await supabase.from("risk_task_links").delete().in("task_id", taskIds);
      await supabase.from("decision_dependencies").delete().or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
    }
    await supabase.from("tasks").delete().eq("created_by", uid);

    // Delete decisions (after dependencies are cleaned)
    await supabase.from("decisions").delete().or(`created_by.eq.${uid},owner_id.eq.${uid}`);

    // Delete risks
    const { data: userRisks } = await supabase.from("risks").select("id").eq("created_by", uid);
    const riskIds = (userRisks || []).map((r: any) => r.id);
    if (riskIds.length > 0) {
      await supabase.from("risk_decision_links").delete().in("risk_id", riskIds);
      await supabase.from("risk_task_links").delete().in("risk_id", riskIds);
    }
    await supabase.from("risks").delete().eq("created_by", uid);

    // Delete strategic goals
    await supabase.from("strategic_goals").delete().eq("created_by", uid);

    // Delete team data
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
    await supabase.from("team_members").delete().eq("user_id", uid);

    // Delete user-specific data
    await supabase.from("saved_views").delete().eq("user_id", uid);
    await supabase.from("notifications").delete().eq("user_id", uid);
    await supabase.from("briefings").delete().eq("user_id", uid);
    await supabase.from("gamification_scores").delete().eq("user_id", uid);
    await supabase.from("notification_preferences").delete().eq("user_id", uid);
    await supabase.from("mfa_settings").delete().eq("user_id", uid);
    await supabase.from("active_sessions").delete().eq("user_id", uid);
    await supabase.from("review_delegations").delete().or(`delegator_id.eq.${uid},delegate_id.eq.${uid}`);
    await supabase.from("email_otp_codes").delete().eq("user_id", uid);
    await supabase.from("referral_codes").delete().eq("user_id", uid);
    await supabase.from("referral_conversions").delete().eq("referrer_id", uid);

    // If last user in org: delete the entire organization (CASCADE will handle related data)
    if (orgId && userRole?.role === "org_owner") {
      const { count: remainingMembers } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .neq("user_id", uid);

      if (!remainingMembers || remainingMembers === 0) {
        // Clean up org-level data
        await supabase.from("daily_briefs").delete().eq("org_id", orgId);
        await supabase.from("compliance_config").delete().eq("org_id", orgId);
        await supabase.from("escalation_rules").delete().eq("org_id", orgId);
        await supabase.from("escalation_log").delete().eq("org_id", orgId);
        await supabase.from("churn_risk_log").delete().eq("org_id", orgId);
        await supabase.from("api_keys").delete().eq("org_id", orgId);
        await supabase.from("organizations").delete().eq("id", orgId);
      }
    }

    // Delete user role & profile
    await supabase.from("user_roles").delete().eq("user_id", uid);
    await supabase.from("profiles").delete().eq("user_id", uid);

    // Delete avatar from storage
    const { data: avatarFiles } = await supabase.storage.from("avatars").list(uid);
    if (avatarFiles?.length) {
      await supabase.storage.from("avatars").remove(avatarFiles.map((f: any) => `${uid}/${f.name}`));
    }

    // Delete the auth user (permanent)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error("Auth user deletion failed:", deleteError);
      return new Response(JSON.stringify({
        error: "partial_deletion",
        message: "Datenlöschung abgeschlossen, aber Auth-Account konnte nicht entfernt werden. Bitte Support kontaktieren.",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Account deleted: ${uid}, reason: ${cancel_reason || "not specified"}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

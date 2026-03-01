import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: { org_id: string; status: string; error?: string }[] = [];

  try {
    // Fetch all active organizations
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name");

    if (orgErr || !orgs) {
      return new Response(JSON.stringify({ error: "Failed to fetch orgs", detail: orgErr }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const org of orgs) {
      try {
        // ───────────────────────────────────────────────
        // STEP 1: Calculate Cost-of-Delay for open decisions
        // ───────────────────────────────────────────────
        const { data: openDecisions } = await supabase
          .from("decisions")
          .select("id, created_at, team_id, priority")
          .eq("org_id", org.id)
          .in("status", ["draft", "review"])
          .is("deleted_at", null)
          .is("archived_at", null);

        if (openDecisions && openDecisions.length > 0) {
          // Fetch team COD configs
          const teamIds = [...new Set(openDecisions.map((d) => d.team_id).filter(Boolean))];
          let teamConfigMap: Record<string, { hourlyRate: number; persons: number; overhead: number }> = {};

          if (teamIds.length > 0) {
            const { data: teams } = await supabase
              .from("teams")
              .select("id, hourly_rate, cod_persons, cod_overhead_factor")
              .in("id", teamIds);

            if (teams) {
              for (const t of teams) {
                teamConfigMap[t.id] = {
                  hourlyRate: t.hourly_rate ?? 85,
                  persons: t.cod_persons ?? 3,
                  overhead: Number(t.cod_overhead_factor) || 1.5,
                };
              }
            }
          }

          const defaultConfig = { hourlyRate: 85, persons: 3, overhead: 1.5 };

          for (const d of openDecisions) {
            const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const cfg = d.team_id && teamConfigMap[d.team_id] ? teamConfigMap[d.team_id] : defaultConfig;
            const dailyCost = Math.round(cfg.hourlyRate * 8 * cfg.persons * cfg.overhead);
            const totalCost = Math.round(daysOpen * dailyCost);

            await supabase
              .from("decisions")
              .update({ cost_per_day: dailyCost })
              .eq("id", d.id);
          }
        }

        // ───────────────────────────────────────────────
        // STEP 2: Identify decisions becoming critical (SLA < 24h)
        // ───────────────────────────────────────────────
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        const { data: slaDecisions } = await supabase
          .from("decisions")
          .select("id, title, due_date, owner_id")
          .eq("org_id", org.id)
          .in("status", ["draft", "review"])
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .lte("due_date", tomorrow)
          .gte("due_date", now);

        if (slaDecisions) {
          for (const d of slaDecisions) {
            await supabase.from("notifications").insert({
              user_id: d.owner_id,
              org_id: org.id,
              decision_id: d.id,
              type: "sla_warning",
              title: `SLA-Frist läuft ab: ${d.title}`,
              message: `Die Frist für "${d.title}" läuft in weniger als 24 Stunden ab.`,
            });
          }
        }

        // ───────────────────────────────────────────────
        // STEP 3: Identify overdue reviewers (> 48h no response)
        // ───────────────────────────────────────────────
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const { data: overdueReviews } = await supabase
          .from("decision_reviews")
          .select("id, decision_id, reviewer_id, created_at, decisions!decision_reviews_decision_id_fkey(title, org_id)")
          .eq("status", "review")
          .lte("created_at", twoDaysAgo);

        if (overdueReviews) {
          for (const r of overdueReviews) {
            const decisionData = r.decisions as any;
            if (decisionData?.org_id !== org.id) continue;

            await supabase.from("notifications").insert({
              user_id: r.reviewer_id,
              org_id: org.id,
              decision_id: r.decision_id,
              type: "reviewer_overdue",
              title: `Erinnerung: Review ausstehend`,
              message: `Sie haben seit über 48 Stunden nicht auf "${decisionData?.title}" reagiert.`,
            });
          }
        }

        // ───────────────────────────────────────────────
        // STEP 4: Generate AI Daily Brief (store summary)
        // ───────────────────────────────────────────────
        const { data: orgProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("org_id", org.id);

        const totalOpen = openDecisions?.length ?? 0;
        const criticalCount = slaDecisions?.length ?? 0;
        const overdueCount = overdueReviews?.filter((r) => (r.decisions as any)?.org_id === org.id).length ?? 0;

        const briefContent = {
          date: new Date().toISOString().split("T")[0],
          summary: {
            open_decisions: totalOpen,
            critical_sla: criticalCount,
            overdue_reviewers: overdueCount,
          },
          generated_at: new Date().toISOString(),
        };

        if (orgProfiles) {
          for (const p of orgProfiles) {
            await supabase.from("briefings").upsert(
              {
                user_id: p.user_id,
                content: briefContent,
                generated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          }
        }

        // ───────────────────────────────────────────────
        // STEP 5: Trigger automation rules
        // ───────────────────────────────────────────────
        const { data: rules } = await supabase
          .from("automation_rules")
          .select("*")
          .eq("org_id", org.id)
          .eq("enabled", true)
          .eq("trigger_event", "scheduled_daily");

        if (rules && openDecisions) {
          for (const rule of rules) {
            for (const d of openDecisions) {
              const fieldValue = (d as any)[rule.condition_field];
              let matches = false;

              if (rule.condition_operator === "equals") matches = String(fieldValue) === rule.condition_value;
              else if (rule.condition_operator === "gt") matches = Number(fieldValue) > Number(rule.condition_value);
              else if (rule.condition_operator === "lt") matches = Number(fieldValue) < Number(rule.condition_value);

              if (matches) {
                // Log the rule execution
                await supabase.from("automation_rule_logs").insert({
                  rule_id: rule.id,
                  decision_id: d.id,
                  action_taken: rule.action_type,
                  details: `Auto-triggered by daily engine: ${rule.name}`,
                });

                // Execute action
                if (rule.action_type === "set_priority") {
                  await supabase.from("decisions").update({ priority: rule.action_value }).eq("id", d.id);
                } else if (rule.action_type === "notify") {
                  await supabase.from("notifications").insert({
                    user_id: (d as any).owner_id ?? rule.created_by,
                    org_id: org.id,
                    decision_id: d.id,
                    type: "automation",
                    title: `Automatische Regel: ${rule.name}`,
                    message: rule.description || rule.action_value,
                  });
                }
              }
            }
          }
        }

        results.push({ org_id: org.id, status: "success" });
      } catch (orgError: any) {
        results.push({ org_id: org.id, status: "error", error: orgError.message });
      }
    }

    return new Response(
      JSON.stringify({ timestamp: new Date().toISOString(), results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all orgs
    const { data: orgs } = await supabase.from("organizations").select("id, name");
    if (!orgs || orgs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let processed = 0;

    for (const org of orgs) {
      // Check if already generated today
      const { data: existing } = await supabase
        .from("daily_briefs")
        .select("id")
        .eq("org_id", org.id)
        .eq("brief_date", today)
        .single();

      if (existing) continue;

      // Fetch org decisions
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title, status, priority, category, created_at, implemented_at, due_date, cost_per_day, escalation_level, last_escalated_at, team_id")
        .eq("org_id", org.id)
        .is("deleted_at", null);

      if (!decisions || decisions.length === 0) continue;

      const active = decisions.filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
      const implemented = decisions.filter(d => d.status === "implemented");

      // 1. Overdue Top 3
      const overdue = active
        .filter(d => d.due_date && new Date(d.due_date) < now)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 3);

      // 2. Highest CoD Top 3
      const highCod = active
        .filter(d => d.cost_per_day && d.cost_per_day > 0)
        .sort((a, b) => (b.cost_per_day || 0) - (a.cost_per_day || 0))
        .slice(0, 3);

      // 3. Deadlines today + tomorrow
      const upcomingDeadlines = active
        .filter(d => d.due_date && d.due_date >= today && d.due_date <= tomorrow);

      // 4. New escalations since yesterday
      const newEscalations = active
        .filter(d => d.last_escalated_at && d.last_escalated_at >= yesterday);

      // 5. Blocked dependencies
      const { data: deps } = await supabase
        .from("decision_dependencies")
        .select("source_decision_id, target_decision_id, source_task_id, target_task_id")
        .or(`source_decision_id.in.(${active.map(d => d.id).join(",")}),target_decision_id.in.(${active.map(d => d.id).join(",")})`)
        .limit(10);

      // Calculate Momentum Score
      const total = decisions.length;
      const implRate = total > 0 ? implemented.length / total : 0;
      const overdueCount = active.filter(d => d.due_date && new Date(d.due_date) < now).length;
      const overdueRate = active.length > 0 ? overdueCount / active.length : 0;

      // Velocity
      const velocities = implemented
        .filter(d => d.implemented_at)
        .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const avgVelocity = velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 30;
      const velocityScore = Math.max(0, Math.min(25, Math.round(25 * (1 - avgVelocity / 60))));

      // Throughput
      const throughputScore = Math.round(implRate * 25);

      // Health (low overdue)
      const healthScore = Math.round((1 - overdueRate) * 25);

      // CoD trend component
      const totalCod = active.reduce((s, d) => s + (d.cost_per_day || 0), 0);
      const codScore = Math.max(0, Math.min(25, totalCod > 0 ? Math.round(25 * Math.max(0, 1 - totalCod / 5000)) : 25));

      const momentumScore = velocityScore + throughputScore + healthScore + codScore;

      // Build AI prompt data
      const promptData = {
        org_name: org.name,
        total_decisions: total,
        active_decisions: active.length,
        implemented: implemented.length,
        overdue: overdue.map(d => ({ title: d.title, due_date: d.due_date, priority: d.priority })),
        high_cod: highCod.map(d => ({ title: d.title, cost_per_day: d.cost_per_day, priority: d.priority })),
        upcoming_deadlines: upcomingDeadlines.map(d => ({ title: d.title, due_date: d.due_date })),
        new_escalations: newEscalations.map(d => ({ title: d.title, escalation_level: d.escalation_level })),
        blocked_count: deps?.length || 0,
        momentum_score: momentumScore,
        avg_velocity_days: Math.round(avgVelocity * 10) / 10,
        total_cod_per_day: totalCod,
      };

      // Call Lovable AI
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Du bist ein C-Level Business Advisor für Entscheidungsmanagement. 
Erstelle einen prägnanten deutschen Executive Brief.
Format: Max 3 Sätze Einleitung (headline), dann 3-5 Bullet Points.
Jeder Bullet hat einen Typ: "problem", "positive" oder "recommendation".
Sei direkt, datengetrieben, konkret. Max 200 Wörter gesamt.`,
            },
            {
              role: "user",
              content: `Generiere einen Daily Brief basierend auf diesen Entscheidungsdaten:\n${JSON.stringify(promptData, null, 2)}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "daily_brief",
              description: "Structured daily executive brief",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "1-3 sentence executive summary" },
                  bullets: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["problem", "positive", "recommendation"] },
                        text: { type: "string" },
                      },
                      required: ["type", "text"],
                      additionalProperties: false,
                    },
                  },
                  urgent_actions: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" },
                },
                required: ["headline", "bullets", "urgent_actions", "recommendation"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "daily_brief" } },
        }),
      });

      let briefContent: any = null;
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          briefContent = JSON.parse(toolCall.function.arguments);
        }
      } else {
        const errText = await aiResponse.text();
        console.error(`AI error for org ${org.id}:`, aiResponse.status, errText);
        // Fallback brief
        briefContent = {
          headline: `${overdueCount} überfällige Entscheidungen, ${active.length} aktiv, Momentum: ${momentumScore}/100.`,
          bullets: overdue.slice(0, 3).map(d => ({ type: "problem", text: `"${d.title}" ist überfällig (${d.priority})` })),
          urgent_actions: overdue.map(d => `${d.title} sofort bearbeiten`),
          recommendation: "Überfällige Entscheidungen priorisieren und Reviewer kontaktieren.",
        };
      }

      // Save to daily_briefs
      const momentumBreakdown = { velocity: velocityScore, throughput: throughputScore, health: healthScore, cod: codScore };
      const briefStats = {
        total, active: active.length, implemented: implemented.length,
        overdue: overdueCount, avg_velocity: Math.round(avgVelocity * 10) / 10,
        total_cod: totalCod,
      };
      const costSummary = {
        total_delay_cost: totalCod * 7, // weekly
        decisions_in_delay: overdueCount,
        top_costs: highCod.map(d => ({ title: d.title, cost_per_day: d.cost_per_day, priority: d.priority })),
      };

      await supabase.from("daily_briefs").upsert({
        org_id: org.id,
        brief_date: today,
        content: briefContent,
        momentum_score: momentumScore,
        momentum_breakdown: momentumBreakdown,
        stats: briefStats,
        cost_summary: costSummary,
      }, { onConflict: "org_id,brief_date" });

      processed++;
    }

    return new Response(JSON.stringify({ processed, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

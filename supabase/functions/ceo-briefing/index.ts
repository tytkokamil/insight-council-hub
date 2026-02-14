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

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch all decision data for this user's org
    const { data: decisions } = await supabase
      .from("decisions")
      .select("id, title, status, priority, category, created_at, implemented_at, due_date, ai_risk_score, ai_impact_score, actual_impact_score, outcome_notes, escalation_level");

    if (!decisions || decisions.length === 0) {
      return new Response(JSON.stringify({
        momentum_score: 0,
        briefing: "Noch keine Entscheidungen vorhanden.",
        cost_summary: { total_delay_cost: 0, decisions_in_delay: 0 },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch teams for hourly rates
    const { data: teams } = await supabase.from("teams").select("id, name, hourly_rate");
    const { data: notifications } = await supabase
      .from("notifications")
      .select("title, message")
      .eq("user_id", user.id)
      .eq("read", false)
      .limit(5);

    const now = new Date();

    // Calculate Decision Cost
    const reviewDecisions = decisions.filter(d => ["review", "draft"].includes(d.status) && d.due_date);
    const defaultRate = 75;
    let totalDelayCost = 0;
    const costBreakdown: any[] = [];

    reviewDecisions.forEach(d => {
      const created = new Date(d.created_at);
      const daysOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      // Assume 2 people involved per decision, 2 hours/day overhead
      const cost = Math.round(daysOpen * 2 * 2 * defaultRate);
      totalDelayCost += cost;
      if (daysOpen > 7) {
        costBreakdown.push({ title: d.title, days: Math.round(daysOpen), cost, priority: d.priority });
      }
    });

    // Calculate Momentum Score
    const implemented = decisions.filter(d => d.status === "implemented");
    const total = decisions.length;
    
    // Velocity component (0-25): avg days to implement
    const velocities = implemented
      .filter(d => d.implemented_at)
      .map(d => (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const avgVelocity = velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 30;
    const velocityScore = Math.max(0, Math.min(25, Math.round(25 * (1 - avgVelocity / 60))));

    // Quality component (0-25): outcome accuracy
    const withOutcome = implemented.filter(d => d.actual_impact_score !== null && d.ai_impact_score);
    const accuracies = withOutcome.map(d => 100 - Math.abs(d.ai_impact_score - d.actual_impact_score));
    const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 50;
    const qualityScore = Math.round(avgAccuracy / 4);

    // Throughput component (0-25): implementation rate
    const implRate = total > 0 ? implemented.length / total : 0;
    const throughputScore = Math.round(implRate * 25);

    // Health component (0-25): low bottleneck + low overdue
    const overdue = decisions.filter(d => d.due_date && new Date(d.due_date) < now && !["implemented", "rejected"].includes(d.status));
    const overdueRate = total > 0 ? 1 - (overdue.length / total) : 1;
    const healthScore = Math.round(overdueRate * 25);

    const momentumScore = velocityScore + qualityScore + throughputScore + healthScore;

    // Generate CEO Morning Brief via AI
    const briefingPrompt = `Du bist der KI-Berater für ein Entscheidungsmanagement-System. Erstelle ein prägnantes Morning Briefing.

Daten:
- Gesamt-Entscheidungen: ${total}
- Implementiert: ${implemented.length}
- In Review: ${decisions.filter(d => d.status === "review").length}
- Überfällig: ${overdue.length}
- Momentum Score: ${momentumScore}/100
- Ø Entscheidungsgeschwindigkeit: ${Math.round(avgVelocity * 10) / 10} Tage
- Gesamte Verzögerungskosten: ${totalDelayCost}€
- Top überfällige: ${overdue.slice(0, 3).map(d => d.title).join(", ") || "Keine"}
- Eskalationen: ${notifications?.length || 0} ungelesene

Erstelle ein kurzes, actionables Briefing.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein C-Level Business Advisor. Sei direkt, prägnant, actionable. Nutze Emojis sparsam. Max 200 Wörter." },
          { role: "user", content: briefingPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "morning_brief",
            description: "Structured CEO morning briefing",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "One-line headline summarizing the day, in German" },
                urgent_actions: { type: "array", items: { type: "string" }, description: "2-3 urgent action items in German" },
                wins: { type: "array", items: { type: "string" }, description: "1-2 recent wins or positive trends in German" },
                risks: { type: "array", items: { type: "string" }, description: "1-2 risks to watch in German" },
                recommendation: { type: "string", description: "One key recommendation for today in German" },
              },
              required: ["headline", "urgent_actions", "wins", "risks", "recommendation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "morning_brief" } },
      }),
    });

    let briefing = null;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        briefing = JSON.parse(toolCall.function.arguments);
      }
    }

    // Save briefing
    if (briefing) {
      await supabase.from("briefings").insert({
        user_id: user.id,
        content: briefing,
      });
    }

    return new Response(JSON.stringify({
      momentum_score: momentumScore,
      momentum_breakdown: { velocity: velocityScore, quality: qualityScore, throughput: throughputScore, health: healthScore },
      cost_summary: {
        total_delay_cost: totalDelayCost,
        decisions_in_delay: reviewDecisions.length,
        top_costs: costBreakdown.sort((a, b) => b.cost - a.cost).slice(0, 5),
      },
      briefing,
      stats: {
        total, implemented: implemented.length, overdue: overdue.length,
        avg_velocity: Math.round(avgVelocity * 10) / 10,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ceo-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

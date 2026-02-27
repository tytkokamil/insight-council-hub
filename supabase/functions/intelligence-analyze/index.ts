import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callLovableAI(systemPrompt: string, userPrompt: string, tools: any[], toolChoice: any): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const body: any = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice; }

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) { console.error("AI error", r.status); return null; }
  const d = await r.json();
  const tc = d.choices?.[0]?.message?.tool_calls?.[0];
  return tc ? JSON.parse(tc.function.arguments) : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { type, context } = await req.json();
    // type: "pattern" | "dna" | "bottleneck"

    const systemPrompt = "Du bist ein Senior Business Intelligence Analyst für Entscheidungsmanagement. Antworte auf Deutsch, prägnant und datenbasiert. Liefere konkrete, umsetzbare Insights. WICHTIG: Verwende NIEMALS technische Feldnamen oder Variablennamen (wie predictedDaysLeft, confidence, ai_risk_score etc.) in deinen Texten. Nutze stattdessen natürliche Begriffe wie 'verbleibende Tage', 'Konfidenz', 'Risikobewertung'.";

    if (type === "pattern") {
      const tools = [{
        type: "function",
        function: {
          name: "pattern_insights",
          description: "AI-generated pattern analysis insights",
          parameters: {
            type: "object",
            properties: {
              deep_patterns: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, confidence: { type: "number" }, actionable_tip: { type: "string" } }, required: ["title", "description", "confidence", "actionable_tip"] } },
              prediction: { type: "string", description: "Prognose für die nächsten 30 Tage" },
              hidden_correlation: { type: "string", description: "Eine überraschende Korrelation in den Daten" },
            },
            required: ["deep_patterns", "prediction", "hidden_correlation"],
            additionalProperties: false,
          },
        },
      }];

      const result = await callLovableAI(systemPrompt,
        `Analysiere diese Entscheidungsmuster und finde tiefgreifende Insights:\n\n${JSON.stringify(context)}`,
        tools, { type: "function", function: { name: "pattern_insights" } });

      return new Response(JSON.stringify({ insights: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "dna") {
      const tools = [{
        type: "function",
        function: {
          name: "dna_insights",
          description: "AI-generated organizational DNA analysis",
          parameters: {
            type: "object",
            properties: {
              archetype_deep_dive: { type: "string", description: "Detaillierte Analyse des Organisations-Archetyps (3-4 Sätze)" },
              strengths: { type: "array", items: { type: "string" }, description: "Top 3 Stärken mit konkreter Begründung" },
              growth_areas: { type: "array", items: { type: "object", properties: { area: { type: "string" }, action: { type: "string" }, expected_impact: { type: "string" } }, required: ["area", "action", "expected_impact"] } },
              benchmark_comparison: { type: "string", description: "Vergleich mit Best-Practice-Benchmarks" },
            },
            required: ["archetype_deep_dive", "strengths", "growth_areas", "benchmark_comparison"],
            additionalProperties: false,
          },
        },
      }];

      const result = await callLovableAI(systemPrompt,
        `Analysiere das Decision DNA Profil dieser Organisation und liefere tiefe Insights:\n\n${JSON.stringify(context)}`,
        tools, { type: "function", function: { name: "dna_insights" } });

      return new Response(JSON.stringify({ insights: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "bottleneck") {
      const tools = [{
        type: "function",
        function: {
          name: "bottleneck_insights",
          description: "AI-generated bottleneck and process intelligence",
          parameters: {
            type: "object",
            properties: {
              root_causes: { type: "array", items: { type: "object", properties: { cause: { type: "string" }, evidence: { type: "string" }, fix: { type: "string" }, priority: { type: "string", enum: ["critical", "high", "medium"] } }, required: ["cause", "evidence", "fix", "priority"] } },
              process_health_summary: { type: "string", description: "Gesamtbewertung der Prozessgesundheit (2-3 Sätze)" },
              quick_wins: { type: "array", items: { type: "string" }, description: "3 sofort umsetzbare Verbesserungen" },
            },
            required: ["root_causes", "process_health_summary", "quick_wins"],
            additionalProperties: false,
          },
        },
      }];

      const result = await callLovableAI(systemPrompt,
        `Analysiere die Engpass- und Prozessdaten und identifiziere Ursachen und Lösungen:\n\n${JSON.stringify(context)}`,
        tools, { type: "function", function: { name: "bottleneck_insights" } });

      return new Response(JSON.stringify({ insights: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use: pattern, dna, bottleneck" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intelligence-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

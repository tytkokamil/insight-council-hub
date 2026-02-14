import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { decision, scenarios } = await req.json();

    const prompt = `Analysiere diese Geschäftsentscheidung mit den folgenden Was-Wäre-Wenn-Szenarien.

Entscheidung: ${decision.title}
Beschreibung: ${decision.description || "Keine"}
Kategorie: ${decision.category}
Priorität: ${decision.priority}

Szenarien:
${scenarios.map((s: any, i: number) => `${i + 1}. ${s.title} (Wahrscheinlichkeit: ${s.probability}%): ${s.description || ""}`).join("\n")}

Analysiere jedes Szenario und gib eine strukturierte Bewertung.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein strategischer Berater. Analysiere Szenarien realistisch und gib actionable Empfehlungen. Antworte NUR mit dem Tool-Call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "scenario_analysis",
            description: "Analyze what-if scenarios for a business decision",
            parameters: {
              type: "object",
              properties: {
                scenario_results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scenario_title: { type: "string" },
                      risk_level: { type: "string", description: "hoch/mittel/niedrig" },
                      expected_outcome: { type: "string", description: "Expected outcome description in German, 1-2 sentences" },
                      mitigation: { type: "string", description: "How to mitigate risks in German, 1-2 sentences" },
                      opportunity: { type: "string", description: "Potential opportunities in German, 1 sentence" },
                      impact_score: { type: "number", description: "0-100 impact score" },
                    },
                    required: ["scenario_title", "risk_level", "expected_outcome", "mitigation", "opportunity", "impact_score"],
                    additionalProperties: false,
                  },
                },
                overall_recommendation: { type: "string", description: "Overall recommendation considering all scenarios, in German, 2-3 sentences" },
                best_case_probability: { type: "number", description: "Probability of best case outcome 0-100" },
                worst_case_probability: { type: "number", description: "Probability of worst case outcome 0-100" },
              },
              required: ["scenario_results", "overall_recommendation", "best_case_probability", "worst_case_probability"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "scenario_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate-scenarios error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

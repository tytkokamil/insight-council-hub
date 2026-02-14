import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { decision, teamMembers, historicalStats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Du bist ein KI-Co-Pilot für Geschäftsentscheidungen. Analysiere diese Entscheidung und gib strategische Steuerungsempfehlungen.

ENTSCHEIDUNG:
- Titel: ${decision.title}
- Beschreibung: ${decision.description || "Keine"}
- Kategorie: ${decision.category}
- Priorität: ${decision.priority}
- Status: ${decision.status}
- Erstellt am: ${decision.created_at}
- Fällig am: ${decision.due_date || "Kein Datum"}
- KI-Risiko-Score: ${decision.ai_risk_score ?? "Nicht analysiert"}
- KI-Impact-Score: ${decision.ai_impact_score ?? "Nicht analysiert"}
- Eskalationslevel: ${decision.escalation_level || 0}

TEAM-MITGLIEDER (verfügbar für Delegation/Review):
${teamMembers?.map((m: any) => `- ${m.name} (Rolle: ${m.role})`).join("\n") || "Keine Teammitglieder"}

HISTORISCHE STATISTIKEN:
- Durchschnittliche Entscheidungsdauer (Tage): ${historicalStats?.avgDurationDays ?? "Unbekannt"}
- Ablehnungsrate (%): ${historicalStats?.rejectionRate ?? "Unbekannt"}
- Durchschnittliche Reviews pro Entscheidung: ${historicalStats?.avgReviews ?? "Unbekannt"}
- Häufigste Ablehnungsgründe: ${historicalStats?.topRejectionReasons?.join(", ") || "Keine Daten"}

Generiere konkrete, umsetzbare Empfehlungen.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "copilot_recommendations",
          description: "Generate AI Co-Pilot steering recommendations",
          parameters: {
            type: "object",
            properties: {
              rejection_probability: {
                type: "number",
                description: "Estimated rejection probability 0-100 based on historical patterns and decision characteristics",
              },
              rejection_reasons: {
                type: "array",
                items: { type: "string" },
                description: "2-3 most likely reasons for rejection in German",
              },
              delegation_suggestion: {
                type: "object",
                properties: {
                  recommended_person: { type: "string", description: "Name of recommended person or 'Beibehalten' if current owner is best" },
                  reason: { type: "string", description: "Why this person, in German, 1 sentence" },
                },
                required: ["recommended_person", "reason"],
                additionalProperties: false,
              },
              reviewer_suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Reviewer name" },
                    reason: { type: "string", description: "Why this reviewer, in German, 1 sentence" },
                    priority: { type: "string", description: "hoch, mittel, niedrig" },
                  },
                  required: ["name", "reason", "priority"],
                  additionalProperties: false,
                },
                description: "2-3 suggested reviewers",
              },
              process_optimizations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string", description: "Concrete action in German" },
                    impact: { type: "string", description: "Expected impact: hoch, mittel, niedrig" },
                    effort: { type: "string", description: "Required effort: gering, mittel, hoch" },
                  },
                  required: ["action", "impact", "effort"],
                  additionalProperties: false,
                },
                description: "3-5 process optimization tips",
              },
              next_best_action: {
                type: "string",
                description: "The single most important next step in German, max 2 sentences",
              },
              confidence: {
                type: "number",
                description: "Overall confidence in recommendations 0-100",
              },
            },
            required: ["rejection_probability", "rejection_reasons", "delegation_suggestion", "reviewer_suggestions", "process_optimizations", "next_best_action", "confidence"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein strategischer KI-Co-Pilot für Entscheidungsmanagement. Antworte NUR mit dem Tool-Call." },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "copilot_recommendations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("decision-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

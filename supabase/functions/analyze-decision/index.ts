import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, priority, context, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isAutopilot = mode === "autopilot";

    const prompt = isAutopilot
      ? `Analysiere diese Geschäftsentscheidung und generiere 3 konkrete Handlungsoptionen mit Pro/Contra und ROI-Schätzung.

Titel: ${title}
Beschreibung: ${description || "Keine"}
Kategorie: ${category}
Priorität: ${priority}
Kontext: ${context || "Keiner"}

Generiere 3 verschiedene Optionen, bewerte jede mit Vor-/Nachteilen und schätze den ROI.`
      : `Analysiere diese Geschäftsentscheidung und gib eine strukturierte Bewertung ab.

Titel: ${title}
Beschreibung: ${description || "Keine"}
Kategorie: ${category}
Priorität: ${priority}
Kontext: ${context || "Keiner"}

Bewerte die Entscheidung nach Risiko und Impact.`;

    const tools = isAutopilot
      ? [
          {
            type: "function",
            function: {
              name: "decision_autopilot",
              description: "Generate decision options with pro/contra and ROI",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100" },
                  impact_score: { type: "number", description: "Impact score 0-100" },
                  risk_factors: { type: "array", items: { type: "string" }, description: "2-4 risk factors in German" },
                  success_factors: { type: "array", items: { type: "string" }, description: "2-4 success factors in German" },
                  summary: { type: "string", description: "Brief summary in German, max 2 sentences" },
                  recommendation: { type: "string", description: "Which option is recommended and why, in German, max 3 sentences" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Option title in German" },
                        description: { type: "string", description: "Option description in German, 1-2 sentences" },
                        pros: { type: "array", items: { type: "string" }, description: "2-3 pros in German" },
                        cons: { type: "array", items: { type: "string" }, description: "2-3 cons in German" },
                        estimated_roi: { type: "string", description: "ROI estimate e.g. 'Hoch', 'Mittel', 'Niedrig' with brief justification" },
                        confidence: { type: "number", description: "Confidence in this option 0-100" },
                      },
                      required: ["title", "description", "pros", "cons", "estimated_roi", "confidence"],
                      additionalProperties: false,
                    },
                    description: "Exactly 3 options",
                  },
                },
                required: ["risk_score", "impact_score", "risk_factors", "success_factors", "summary", "recommendation", "options"],
                additionalProperties: false,
              },
            },
          },
        ]
      : [
          {
            type: "function",
            function: {
              name: "decision_analysis",
              description: "Structured analysis of a business decision",
              parameters: {
                type: "object",
                properties: {
                  risk_score: { type: "number", description: "Risk score 0-100" },
                  impact_score: { type: "number", description: "Impact score 0-100" },
                  risk_factors: { type: "array", items: { type: "string" }, description: "2-4 risk factors in German" },
                  success_factors: { type: "array", items: { type: "string" }, description: "2-4 success factors in German" },
                  summary: { type: "string", description: "Brief summary in German, max 2 sentences" },
                },
                required: ["risk_score", "impact_score", "risk_factors", "success_factors", "summary"],
                additionalProperties: false,
              },
            },
          },
        ];

    const toolName = isAutopilot ? "decision_autopilot" : "decision_analysis";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Du bist ein KI-Berater für Geschäftsentscheidungen. Analysiere Entscheidungen und gib strukturierte Bewertungen. Antworte NUR mit dem Tool-Call.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
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

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-decision error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

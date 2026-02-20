import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { decisionId } = await req.json();
    if (!decisionId) throw new Error("decisionId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    // Fetch the source decision
    const { data: source, error: srcErr } = await client
      .from("decisions")
      .select("id,title,description,category,priority,status,outcome_notes,context")
      .eq("id", decisionId)
      .single();
    if (srcErr || !source) throw new Error("Decision not found");

    // Fetch candidate decisions (completed, excluding source)
    const { data: candidates } = await client
      .from("decisions")
      .select("id,title,description,category,priority,status,outcome_notes,context")
      .in("status", ["implemented", "approved", "rejected"])
      .neq("id", decisionId)
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ similarities: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI similarity analysis
    const sourceDesc = `Titel: ${source.title}\nBeschreibung: ${source.description || "–"}\nKategorie: ${source.category}\nPriorität: ${source.priority}\nKontext: ${source.context || "–"}\nErgebnis: ${source.outcome_notes || "–"}`;

    const candidateList = candidates.map((c: any, i: number) =>
      `[${i}] Titel: ${c.title} | Beschreibung: ${c.description || "–"} | Kategorie: ${c.category} | Priorität: ${c.priority} | Kontext: ${c.context || "–"} | Ergebnis: ${c.outcome_notes || "–"}`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `Du bist ein Entscheidungsanalyse-Experte. Analysiere die Ähnlichkeit zwischen einer Quell-Entscheidung und Kandidaten basierend auf:
- Thematische Übereinstimmung (Inhalt, Kontext, Domäne)
- Strukturelle Ähnlichkeit (Kategorie, Priorität, Komplexität)
- Ergebnis-Muster (ähnliche Outcomes, Risiken)

Bewerte jede relevante Übereinstimmung mit einem Score von 0-100 und einer kurzen Begründung auf Deutsch.
Gib NUR die Top 5 ähnlichsten Entscheidungen zurück, sortiert nach Score absteigend.
Ignoriere Entscheidungen mit Score unter 20.`
          },
          {
            role: "user",
            content: `QUELL-ENTSCHEIDUNG:\n${sourceDesc}\n\nKANDIDATEN:\n${candidateList}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_similarities",
            description: "Return similarity scores for candidate decisions",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number", description: "Index of the candidate in the list" },
                      score: { type: "number", description: "Similarity score 0-100" },
                      reason: { type: "string", description: "Short German explanation of similarity" },
                    },
                    required: ["index", "score", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["results"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_similarities" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const similarities = (parsed.results || [])
      .filter((r: any) => r.index >= 0 && r.index < candidates.length && r.score >= 20)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((r: any) => ({
        decision_id: candidates[r.index].id,
        score: r.score,
        reason: r.reason,
      }));

    return new Response(JSON.stringify({ similarities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("similarity-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

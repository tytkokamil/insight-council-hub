import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category } = await req.json();
    if (!title) throw new Error("title required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    // Fetch all lessons with their decision context
    const { data: lessons } = await client
      .from("lessons_learned")
      .select("id, decision_id, key_takeaway, what_went_well, what_went_wrong, recommendations, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch related decisions
    const decisionIds = [...new Set(lessons.map(l => l.decision_id))];
    const { data: decisions } = await client
      .from("decisions")
      .select("id, title, category, priority, status, outcome_notes")
      .in("id", decisionIds);

    const decMap = new Map((decisions ?? []).map(d => [d.id, d]));

    // Build lesson summaries for AI
    const lessonList = lessons.map((l, i) => {
      const d = decMap.get(l.decision_id);
      return `[${i}] Entscheidung: "${d?.title || "?"}" (${d?.category || "?"}) | Takeaway: ${l.key_takeaway} | Empfehlung: ${l.recommendations || "–"} | Gut: ${l.what_went_well || "–"} | Schlecht: ${l.what_went_wrong || "–"}`;
    }).join("\n");

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
            content: `Du bist ein Wissensmanagement-Experte. Deine Aufgabe: Finde die relevantesten Lessons Learned für eine NEUE Entscheidung.

Bewerte jedes Learning anhand von:
1. Thematische Relevanz (gleiches Themenfeld, ähnliche Herausforderung)
2. Übertragbarkeit (sind die Erkenntnisse auf die neue Situation anwendbar?)
3. Handlungsrelevanz (gibt es konkrete Empfehlungen?)

Gib für jedes relevante Learning einen Score (0-100), eine kurze Begründung und einen konkreten Anwendungstipp für die neue Entscheidung.
Nur Lessons mit Score >= 30 zurückgeben. Max 5 Ergebnisse.`,
          },
          {
            role: "user",
            content: `NEUE ENTSCHEIDUNG:\nTitel: ${title}\nBeschreibung: ${description || "–"}\nKategorie: ${category || "–"}\n\nVERFÜGBARE LESSONS LEARNED:\n${lessonList}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_suggestions",
            description: "Return relevant lessons learned with scores and application tips",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number", description: "Index of the lesson in the list" },
                      score: { type: "number", description: "Relevance score 0-100" },
                      reason: { type: "string", description: "Why this lesson is relevant (German, max 2 sentences)" },
                      application_tip: { type: "string", description: "Concrete tip for applying this learning (German, 1 sentence)" },
                    },
                    required: ["index", "score", "reason", "application_tip"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["results"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

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
    if (!response.ok) {
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const suggestions = (parsed.results || [])
      .filter((r: any) => r.index >= 0 && r.index < lessons.length && r.score >= 30)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((r: any) => {
        const lesson = lessons[r.index];
        const decision = decMap.get(lesson.decision_id);
        return {
          lesson_id: lesson.id,
          decision_id: lesson.decision_id,
          decision_title: decision?.title || "",
          decision_category: decision?.category || "",
          key_takeaway: lesson.key_takeaway,
          what_went_well: lesson.what_went_well,
          what_went_wrong: lesson.what_went_wrong,
          recommendations: lesson.recommendations,
          score: r.score,
          reason: r.reason,
          application_tip: r.application_tip,
        };
      });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-knowledge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

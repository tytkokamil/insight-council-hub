import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { decisionId, mode } = await req.json();
    if (!decisionId) throw new Error("decisionId required");

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    // Fetch the source decision
    const { data: source, error: srcErr } = await client
      .from("decisions")
      .select("id,title,description,category,priority,status,outcome_notes,context")
      .eq("id", decisionId)
      .single();
    if (srcErr || !source) throw new Error("Decision not found");

    // Fetch existing dependencies to exclude them
    const { data: existingDeps } = await client
      .from("decision_dependencies")
      .select("target_decision_id, target_task_id")
      .eq("source_decision_id", decisionId);
    const excludeIds = new Set([
      decisionId,
      ...(existingDeps || []).filter(d => d.target_decision_id).map(d => d.target_decision_id),
    ]);

    // mode=dependencies: suggest links to ALL active decisions
    // mode=similarities (default): find similar past decisions
    const isDepsMode = mode === "dependencies";

    let candidates: any[];
    if (isDepsMode) {
      const { data } = await client
        .from("decisions")
        .select("id,title,description,category,priority,status,context")
        .is("deleted_at", null)
        .not("id", "in", `(${Array.from(excludeIds).join(",")})`)
        .limit(60);
      candidates = data || [];
    } else {
      const { data } = await client
        .from("decisions")
        .select("id,title,description,category,priority,status,outcome_notes,context")
        .in("status", ["implemented", "approved", "rejected"])
        .neq("id", decisionId)
        .limit(50);
      candidates = data || [];
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ similarities: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceDesc = `Titel: ${source.title}\nBeschreibung: ${source.description || "–"}\nKategorie: ${source.category}\nPriorität: ${source.priority}\nKontext: ${source.context || "–"}\nStatus: ${source.status}`;

    const candidateList = candidates.map((c: any, i: number) =>
      `[${i}] Titel: ${c.title} | Beschreibung: ${c.description || "–"} | Kategorie: ${c.category} | Status: ${c.status} | Kontext: ${c.context || "–"}`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = isDepsMode
      ? `Du bist ein Entscheidungs-Governance-Experte. Analysiere die Quell-Entscheidung und erkenne automatisch mögliche Abhängigkeiten zu den Kandidaten.

Dependency-Typen:
- "blocks": Die Quell-Entscheidung BLOCKIERT den Kandidaten (Kandidat kann nicht umgesetzt werden ohne Quell-Entscheidung)
- "requires": Die Quell-Entscheidung BENÖTIGT den Kandidaten (Quell-Entscheidung hängt vom Kandidaten ab)
- "influences": Die Quell-Entscheidung BEEINFLUSST den Kandidaten (inhaltliche Überschneidung, Auswirkung)

Gib NUR echte, begründbare Abhängigkeiten zurück (max. 5). Confidence 0-100. Kurze Begründung auf Deutsch.`
      : `Du bist ein Entscheidungsanalyse-Experte. Analysiere die Ähnlichkeit zwischen einer Quell-Entscheidung und Kandidaten basierend auf:
- Thematische Übereinstimmung (Inhalt, Kontext, Domäne)
- Strukturelle Ähnlichkeit (Kategorie, Priorität, Komplexität)
- Ergebnis-Muster (ähnliche Outcomes, Risiken)

Bewerte jede relevante Übereinstimmung mit einem Score von 0-100 und einer kurzen Begründung auf Deutsch.
Gib NUR die Top 5 ähnlichsten Entscheidungen zurück, sortiert nach Score absteigend.
Ignoriere Entscheidungen mit Score unter 20.`;

    const toolDef = isDepsMode
      ? {
          name: "return_dependencies",
          description: "Return suggested dependency links",
          parameters: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number", description: "Index of the candidate" },
                    dependency_type: { type: "string", enum: ["blocks", "requires", "influences"], description: "Type of dependency" },
                    confidence: { type: "number", description: "Confidence 0-100" },
                    reason: { type: "string", description: "Short German explanation" },
                  },
                  required: ["index", "dependency_type", "confidence", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["results"],
            additionalProperties: false,
          },
        }
      : {
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
        };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `QUELL-ENTSCHEIDUNG:\n${sourceDesc}\n\nKANDIDATEN:\n${candidateList}` },
        ],
        tools: [{ type: "function", function: toolDef }],
        tool_choice: { type: "function", function: { name: toolDef.name } },
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
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);

    if (isDepsMode) {
      const suggestions = (parsed.results || [])
        .filter((r: any) => r.index >= 0 && r.index < candidates.length && r.confidence >= 30)
        .sort((a: any, b: any) => b.confidence - a.confidence)
        .slice(0, 5)
        .map((r: any) => ({
          decision_id: candidates[r.index].id,
          title: candidates[r.index].title,
          status: candidates[r.index].status,
          dependency_type: r.dependency_type,
          confidence: r.confidence,
          reason: r.reason,
        }));
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
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
    }
  } catch (e) {
    console.error("similarity-score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

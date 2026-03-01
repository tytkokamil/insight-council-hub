import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, category, priority } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du bist ein Entscheidungs-Experte. Analysiere den Titel und die Beschreibung einer neuen Entscheidung und gib strukturierte Vorschläge zurück.

Antworte IMMER mit genau diesem JSON-Format (keine Markdown, kein Code-Block, nur reines JSON):
{
  "improvedTitle": "Ein klarerer, präziserer Titel",
  "suggestedCategory": "strategic|budget|hr|technical|operational|marketing",
  "suggestedPriority": "low|medium|high|critical",
  "suggestedTemplate": "Name einer passenden Vorlage aus: Budget-Freigabe, Strategische Entscheidung, HR-Entscheidung, Technische Architektur, Operative Entscheidung, Marketing-Kampagne",
  "suggestedReviewers": ["Rolle 1", "Rolle 2"],
  "suggestedSlaDays": 7,
  "riskLevel": "low|medium|high",
  "riskReason": "Kurze Begründung der Risiko-Einschätzung",
  "risks": ["Risiko 1", "Risiko 2"],
  "affectedTeams": ["Team 1", "Team 2"],
  "similarDecisions": ["Ähnliche Entscheidung 1", "Ähnliche Entscheidung 2"]
}

Regeln:
- improvedTitle: Klar, präzise, handlungsorientiert formuliert
- suggestedCategory: Die passendste Kategorie basierend auf dem Titel/Beschreibung
- suggestedPriority: "low", "medium", "high" oder "critical" basierend auf Dringlichkeit
- suggestedTemplate: Eine der genannten Vorlagen, die am besten passt
- suggestedReviewers: 1-3 Rollen-Vorschläge basierend auf dem Entscheidungstyp
- suggestedSlaDays: Realistische Dauer je nach Komplexität (3-30 Tage)
- riskLevel: "low", "medium" oder "high" basierend auf Titel/Beschreibung
- riskReason: 1 Satz warum diese Einschätzung
- risks: 1-3 konkrete Risiken die bei dieser Entscheidung bestehen (nur wenn Beschreibung vorhanden)
- affectedTeams: 1-3 Teams/Abteilungen die betroffen sein könnten (nur wenn Beschreibung vorhanden)
- similarDecisions: 1-2 Beispiele für ähnliche Entscheidungen aus der Praxis (generische Beispielnamen)`;

    const userPrompt = `Titel: "${title}"${description ? `\nBeschreibung: "${description}"` : ""}${category ? `\nKategorie: ${category}` : ""}${priority ? `\nPriorität: ${priority}` : ""}`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let suggestions;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("decision-suggestions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

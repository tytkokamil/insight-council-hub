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
  if (!r.ok) {
    const status = r.status;
    if (status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (status === 402) throw new Error("AI credits exhausted. Please add credits.");
    console.error("AI error", status);
    return null;
  }
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

    const { type, decisionId, query } = await req.json();

    // ═══ TYPE: summary — Generate archive summary for a decision ═══
    if (type === "summary" && decisionId) {
      // Check cache first (ai_analysis_cache.archive_summary)
      const { data: decision } = await supabase
        .from("decisions")
        .select("id, title, description, status, category, priority, created_at, updated_at, implemented_at, archived_at, outcome, outcome_type, outcome_notes, owner_id, assignee_id, ai_analysis_cache")
        .eq("id", decisionId)
        .single();

      if (!decision) throw new Error("Decision not found");

      // Check cache validity (7 days)
      const cache = decision.ai_analysis_cache as any;
      if (cache?.archive_summary && cache?.archive_summary_at) {
        const cacheAge = Date.now() - new Date(cache.archive_summary_at).getTime();
        if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
          return new Response(JSON.stringify({ summary: cache.archive_summary, cached: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Fetch related data
      const [commentsRes, auditRes, profilesRes] = await Promise.all([
        supabase.from("comments").select("content, created_at, user_id").eq("decision_id", decisionId).order("created_at").limit(20),
        supabase.from("audit_logs").select("action, field_name, old_value, new_value, created_at, user_id").eq("decision_id", decisionId).order("created_at").limit(30),
        supabase.from("profiles").select("user_id, full_name"),
      ]);

      const nameMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || "Unbekannt"; });

      const context = {
        title: decision.title,
        description: decision.description,
        category: decision.category,
        priority: decision.priority,
        status: decision.status,
        created_at: decision.created_at,
        implemented_at: decision.implemented_at,
        archived_at: decision.archived_at,
        outcome: decision.outcome,
        outcome_type: decision.outcome_type,
        outcome_notes: decision.outcome_notes,
        owner: nameMap[decision.owner_id] || "Unbekannt",
        assignee: decision.assignee_id ? nameMap[decision.assignee_id] : null,
        comments: (commentsRes.data || []).map((c: any) => ({
          author: nameMap[c.user_id] || "Unbekannt",
          content: c.content,
          date: c.created_at,
        })),
        auditTrail: (auditRes.data || []).map((a: any) => ({
          action: a.action,
          field: a.field_name,
          from: a.old_value,
          to: a.new_value,
          date: a.created_at,
          by: nameMap[a.user_id] || "Unbekannt",
        })),
      };

      const tools = [{
        type: "function",
        function: {
          name: "archive_summary",
          description: "Generate an archive summary for a decision",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "2-3 Sätze Zusammenfassung: Situation, diskutierte Optionen, Entscheidung und Begründung" },
              owner_name: { type: "string", description: "Name des Hauptverantwortlichen" },
              result: { type: "string", description: "Status und Konsequenzen der Entscheidung" },
              months_ago: { type: "number", description: "Wie viele Monate ist die Entscheidung her" },
            },
            required: ["summary", "owner_name", "result", "months_ago"],
            additionalProperties: false,
          },
        },
      }];

      const systemPrompt = "Du bist ein Business Analyst. Erstelle eine prägnante Zusammenfassung einer archivierten Entscheidung auf Deutsch. Verwende natürliche Sprache ohne technische Feldnamen. Die Zusammenfassung soll Kontext, Optionen, Entscheidung und Ergebnis abdecken.";

      const result = await callLovableAI(
        systemPrompt,
        `Erstelle eine Archiv-Zusammenfassung für diese Entscheidung:\n\n${JSON.stringify(context)}`,
        tools,
        { type: "function", function: { name: "archive_summary" } }
      );

      if (result) {
        // Cache the result
        const updatedCache = { ...(cache || {}), archive_summary: result, archive_summary_at: new Date().toISOString() };
        await supabase.from("decisions").update({ ai_analysis_cache: updatedCache }).eq("id", decisionId);
      }

      return new Response(JSON.stringify({ summary: result, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ TYPE: search — Natural language search in archive ═══
    if (type === "search" && query) {
      const tools = [{
        type: "function",
        function: {
          name: "search_filters",
          description: "Extract search filters from natural language query",
          parameters: {
            type: "object",
            properties: {
              keywords: { type: "array", items: { type: "string" }, description: "Key search terms to match against title and description" },
              category: { type: "string", enum: ["strategic", "budget", "hr", "technical", "operational", "marketing", "general", ""], description: "Category filter if mentioned" },
              year: { type: "number", description: "Year filter if mentioned (e.g. 2023)" },
              person_name: { type: "string", description: "Person name if mentioned in the query" },
              status_filter: { type: "string", enum: ["implemented", "rejected", "archived", "approved", ""], description: "Status filter if mentioned" },
            },
            required: ["keywords"],
            additionalProperties: false,
          },
        },
      }];

      const result = await callLovableAI(
        "Du bist ein Such-Assistent. Extrahiere strukturierte Filter aus einer natürlichsprachlichen Suchanfrage für ein Entscheidungsarchiv. Sei präzise.",
        `Suchanfrage: "${query}"`,
        tools,
        { type: "function", function: { name: "search_filters" } }
      );

      if (!result) {
        return new Response(JSON.stringify({ filters: { keywords: [query] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ filters: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use: summary, search" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("archive-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

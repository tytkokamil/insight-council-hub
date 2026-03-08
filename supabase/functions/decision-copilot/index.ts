import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AiSettings { provider: string; api_key: string | null; model: string | null; }
const DEFAULT_MODELS: Record<string, string> = { openai: "gpt-4o", anthropic: "claude-sonnet-4-20250514", google: "gemini-2.5-flash" };

async function getUserAiSettings(userId: string): Promise<AiSettings> {
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await client.from("user_ai_settings").select("provider, api_key, model").eq("user_id", userId).single();
  return data || { provider: "lovable", api_key: null, model: null };
}

async function extractUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error } = await anonClient.auth.getUser(auth.replace("Bearer ", ""));
    if (error || !user) return null;
    return user.id;
  } catch { return null; }
}

async function callProvider(settings: AiSettings, messages: any[], tools: any[], toolChoice: any): Promise<any> {
  const { provider, api_key, model: userModel } = settings;
  const model = userModel || DEFAULT_MODELS[provider] || "";

  if (provider === "openai") {
    const body: any = { model, messages }; if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice; }
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`OpenAI error (${r.status}): ${await r.text()}`);
    const d = await r.json(); const tc = d.choices?.[0]?.message?.tool_calls?.[0];
    return tc ? JSON.parse(tc.function.arguments) : d.choices?.[0]?.message?.content;
  }
  if (provider === "anthropic") {
    const sys = messages.find((m: any) => m.role === "system")?.content || "";
    const msgs = messages.filter((m: any) => m.role !== "system").map((m: any) => ({ role: m.role, content: m.content }));
    const aTools = tools?.map((t: any) => ({ name: t.function.name, description: t.function.description, input_schema: t.function.parameters }));
    const body: any = { model, max_tokens: 4096, system: sys, messages: msgs };
    if (aTools?.length) { body.tools = aTools; if (toolChoice) body.tool_choice = { type: "tool", name: toolChoice.function.name }; }
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": api_key!, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`Anthropic error (${r.status}): ${await r.text()}`);
    const d = await r.json(); const tb = d.content?.find((b: any) => b.type === "tool_use");
    return tb ? tb.input : d.content?.find((b: any) => b.type === "text")?.text;
  }
  if (provider === "google") {
    const sys = messages.find((m: any) => m.role === "system")?.content;
    const contents = messages.filter((m: any) => m.role !== "system").map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const body: any = { contents }; if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    if (tools?.length) { body.tools = [{ functionDeclarations: tools.map((t: any) => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters })) }]; if (toolChoice) body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [toolChoice.function.name] } }; }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`Google error (${r.status}): ${await r.text()}`);
    const d = await r.json(); const part = d.candidates?.[0]?.content?.parts?.[0];
    return part?.functionCall ? part.functionCall.args : part?.text;
  }

  // Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY"); if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const body: any = { model: "google/gemini-3-flash-preview", messages }; if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice; }
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (r.status === 429) throw new Error("RATE_LIMIT"); if (r.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!r.ok) throw new Error(`AI gateway error (${r.status}): ${await r.text()}`);
  const d = await r.json(); const tc = d.choices?.[0]?.message?.tool_calls?.[0];
  return tc ? JSON.parse(tc.function.arguments) : d.choices?.[0]?.message?.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const userId = await extractUserId(req);
    
    // ── Plan guard: AI copilot requires Pro or Enterprise ──
    if (userId) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: prof } = await adminClient.from("profiles").select("org_id").eq("user_id", userId).single();
      if (prof?.org_id) {
        const { data: orgRow } = await adminClient.from("organizations").select("plan, subscription_status").eq("id", prof.org_id).single();
        const effPlan = orgRow?.subscription_status === "trialing" ? "professional"
          : orgRow?.subscription_status === "suspended" ? "free"
          : orgRow?.plan || "free";
        if (!["professional", "enterprise"].includes(effPlan)) {
          return new Response(JSON.stringify({
            error: "upgrade_required",
            feature: "ai_analysis",
            message: "KI-Copilot ist ab dem Professional-Plan verfügbar.",
            min_plan: "professional",
          }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }
    
    const settings = userId ? await getUserAiSettings(userId) : { provider: "lovable", api_key: null, model: null };

    // Thread summary mode
    if (body.mode === "thread_summary") {
      const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: comments } = await client.from("comments").select("content, created_at, profiles!comments_user_id_fkey(full_name)").eq("decision_id", body.decisionId).order("created_at", { ascending: true });
      const { data: dec } = await client.from("decisions").select("title, description").eq("id", body.decisionId).single();
      if (!comments?.length || comments.length < 5) return new Response(JSON.stringify({ summary: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const commentText = comments.map((c: any) => `${c.profiles?.full_name || "?"}: ${c.content}`).join("\n");
      const msgs = [
        { role: "system", content: "Fasse die bisherige Diskussion in 2-3 Sätzen zusammen. Nenne die wichtigsten Punkte und offene Fragen. Antworte auf Deutsch." },
        { role: "user", content: `Entscheidung: ${dec?.title}\n\nDiskussion (${comments.length} Kommentare):\n${commentText}` },
      ];
      const result = await callProvider(settings, msgs, [], undefined);
      const text = typeof result === "string" ? result : JSON.stringify(result);
      return new Response(JSON.stringify({ summary: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Free-form prompt mode (used by Meeting Mode)
    if (body.prompt && !body.decision) {
      const messages = [
        { role: "system", content: "Du bist ein professioneller KI-Assistent für Geschäftsentscheidungen. Antworte auf Deutsch." },
        { role: "user", content: body.prompt },
      ];
      const result = await callProvider(settings, messages, [], undefined);
      const text = typeof result === "string" ? result : JSON.stringify(result);
      return new Response(JSON.stringify({ response: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { decision, teamMembers, historicalStats } = body;

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

TEAM-MITGLIEDER:
${teamMembers?.map((m: any) => `- ${m.name} (Rolle: ${m.role})`).join("\n") || "Keine"}

HISTORISCHE STATISTIKEN:
- Avg. Dauer (Tage): ${historicalStats?.avgDurationDays ?? "Unbekannt"}
- Ablehnungsrate: ${historicalStats?.rejectionRate ?? "Unbekannt"}%
- Avg. Reviews: ${historicalStats?.avgReviews ?? "Unbekannt"}

Generiere konkrete, umsetzbare Empfehlungen.`;

    const tools = [{
      type: "function",
      function: {
        name: "copilot_recommendations",
        description: "Generate AI Co-Pilot steering recommendations",
        parameters: {
          type: "object",
          properties: {
            rejection_probability: { type: "number" },
            rejection_reasons: { type: "array", items: { type: "string" } },
            delegation_suggestion: {
              type: "object",
              properties: { recommended_person: { type: "string" }, reason: { type: "string" } },
              required: ["recommended_person", "reason"], additionalProperties: false,
            },
            reviewer_suggestions: {
              type: "array",
              items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" }, priority: { type: "string" } }, required: ["name", "reason", "priority"], additionalProperties: false },
            },
            process_optimizations: {
              type: "array",
              items: { type: "object", properties: { action: { type: "string" }, impact: { type: "string" }, effort: { type: "string" } }, required: ["action", "impact", "effort"], additionalProperties: false },
            },
            next_best_action: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["rejection_probability", "rejection_reasons", "delegation_suggestion", "reviewer_suggestions", "process_optimizations", "next_best_action", "confidence"],
          additionalProperties: false,
        },
      },
    }];

    const messages = [
      { role: "system", content: "Du bist ein strategischer KI-Co-Pilot für Entscheidungsmanagement. Antworte NUR mit dem Tool-Call." },
      { role: "user", content: prompt },
    ];

    const result = await callProvider(settings, messages, tools, { type: "function", function: { name: "copilot_recommendations" } });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("decision-copilot error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMIT") return new Response(JSON.stringify({ error: "Rate limit erreicht." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (msg === "PAYMENT_REQUIRED") return new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

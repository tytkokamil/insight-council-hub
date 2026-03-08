import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AiSettings {
  provider: string;
  api_key: string | null;
  model: string | null;
}

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-flash",
};

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
    const body: any = { model, messages };
    if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice; }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`OpenAI error (${r.status}): ${await r.text()}`);
    const d = await r.json();
    const tc = d.choices?.[0]?.message?.tool_calls?.[0];
    return tc ? JSON.parse(tc.function.arguments) : d.choices?.[0]?.message?.content;
  }

  if (provider === "anthropic") {
    const sys = messages.find((m: any) => m.role === "system")?.content || "";
    const msgs = messages.filter((m: any) => m.role !== "system").map((m: any) => ({ role: m.role, content: m.content }));
    const aTools = tools?.map((t: any) => ({ name: t.function.name, description: t.function.description, input_schema: t.function.parameters }));
    const body: any = { model, max_tokens: 4096, system: sys, messages: msgs };
    if (aTools?.length) { body.tools = aTools; if (toolChoice) body.tool_choice = { type: "tool", name: toolChoice.function.name }; }
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": api_key!, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Anthropic error (${r.status}): ${await r.text()}`);
    const d = await r.json();
    const tb = d.content?.find((b: any) => b.type === "tool_use");
    return tb ? tb.input : d.content?.find((b: any) => b.type === "text")?.text;
  }

  if (provider === "google") {
    const sys = messages.find((m: any) => m.role === "system")?.content;
    const contents = messages.filter((m: any) => m.role !== "system").map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const body: any = { contents };
    if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    if (tools?.length) {
      body.tools = [{ functionDeclarations: tools.map((t: any) => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters })) }];
      if (toolChoice) body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [toolChoice.function.name] } };
    }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${api_key}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Google error (${r.status}): ${await r.text()}`);
    const d = await r.json();
    const part = d.candidates?.[0]?.content?.parts?.[0];
    return part?.functionCall ? part.functionCall.args : part?.text;
  }

  // Default: Lovable AI Gateway
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const body: any = { model: "google/gemini-3-flash-preview", messages };
  if (tools?.length) { body.tools = tools; body.tool_choice = toolChoice; }
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (r.status === 429) throw new Error("RATE_LIMIT");
  if (r.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!r.ok) throw new Error(`AI gateway error (${r.status}): ${await r.text()}`);
  const d = await r.json();
  const tc = d.choices?.[0]?.message?.tool_calls?.[0];
  return tc ? JSON.parse(tc.function.arguments) : d.choices?.[0]?.message?.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { decision, scenarios } = await req.json();
    const userId = await extractUserId(req);
    const settings = userId ? await getUserAiSettings(userId) : { provider: "lovable", api_key: null, model: null };

    const prompt = `Analysiere diese Geschäftsentscheidung mit den folgenden Was-Wäre-Wenn-Szenarien.

Entscheidung: ${decision.title}
Beschreibung: ${decision.description || "Keine"}
Kategorie: ${decision.category}
Priorität: ${decision.priority}

Szenarien:
${scenarios.map((s: any, i: number) => `${i + 1}. ${s.title} (Wahrscheinlichkeit: ${s.probability}%): ${s.description || ""}`).join("\n")}

Analysiere jedes Szenario und gib eine strukturierte Bewertung.`;

    const tools = [{
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
    }];

    const messages = [
      { role: "system", content: "Du bist ein strategischer Berater. Analysiere Szenarien realistisch und gib actionable Empfehlungen. Antworte NUR mit dem Tool-Call." },
      { role: "user", content: prompt },
    ];

    const analysis = await callProvider(settings, messages, tools, { type: "function", function: { name: "scenario_analysis" } });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate-scenarios error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMIT") {
      return new Response(JSON.stringify({ error: "Rate limit erreicht." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (msg === "PAYMENT_REQUIRED") {
      return new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

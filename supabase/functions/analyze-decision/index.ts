import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Import AI proxy logic inline since Deno edge functions can't import across function dirs
// We replicate the core routing logic here

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
    const body = await req.json();
    const { type } = body;

    const userId = await extractUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══ STUCK DIAGNOSIS MODE ═══
    if (type === "stuck-diagnosis") {
      const { decision } = body;
      const settings = await getUserAiSettings(userId);
      const diagnosisPrompt = `Analysiere warum diese Entscheidung feststeckt und gib eine konkrete Empfehlung in max. 2 Sätzen auf Deutsch.

Entscheidung: "${decision.title}"
Status: ${decision.status}
Priorität: ${decision.priority}
Seit ${decision.daysStuck} Tagen feststeckend
Blocker: ${decision.blockerDetail}
Gründe: ${decision.reasons?.join(", ") || "Unbekannt"}
Geschätzte Verzögerungskosten: ${decision.delayCost}€

Antworte NUR mit dem Tool-Call.`;

      const diagnosisTools = [{
        type: "function",
        function: {
          name: "stuck_diagnosis",
          description: "Diagnose why a decision is stuck",
          parameters: {
            type: "object",
            properties: {
              diagnosis: { type: "string", description: "Root cause and recommendation in German, max 2 sentences" },
            },
            required: ["diagnosis"],
            additionalProperties: false,
          },
        },
      }];

      const diagMessages = [
        { role: "system", content: "Du bist ein KI-Berater für Entscheidungsprozesse. Diagnostiziere Blockaden und empfehle konkrete nächste Schritte. Sei direkt und spezifisch." },
        { role: "user", content: diagnosisPrompt },
      ];

      const result = await callProvider(settings, diagMessages, diagnosisTools, { type: "function", function: { name: "stuck_diagnosis" } });
      const diagnosis = typeof result === "string" ? result : result?.diagnosis || "Analyse konnte nicht erstellt werden.";

      return new Response(JSON.stringify({ diagnosis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ STANDARD ANALYSIS MODE ═══
    const { title, description, category, priority, context, mode } = body;

    // ── Plan guard: AI analysis requires Pro or Enterprise ──
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
          message: "KI-Analyse ist ab dem Professional-Plan verfügbar.",
          min_plan: "professional",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const settings = await getUserAiSettings(userId);

    const isAutopilot = mode === "autopilot";

    const prompt = isAutopilot
      ? `Analysiere diese Geschäftsentscheidung und generiere 3 konkrete Handlungsoptionen mit Pro/Contra und ROI-Schätzung.\n\nTitel: ${title}\nBeschreibung: ${description || "Keine"}\nKategorie: ${category}\nPriorität: ${priority}\nKontext: ${context || "Keiner"}\n\nGeneriere 3 verschiedene Optionen, bewerte jede mit Vor-/Nachteilen und schätze den ROI.`
      : `Analysiere diese Geschäftsentscheidung und gib eine strukturierte Bewertung ab.\n\nTitel: ${title}\nBeschreibung: ${description || "Keine"}\nKategorie: ${category}\nPriorität: ${priority}\nKontext: ${context || "Keiner"}\n\nBewerte die Entscheidung nach Risiko und Impact.`;

    const tools = isAutopilot
      ? [{
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
                      title: { type: "string" },
                      description: { type: "string" },
                      pros: { type: "array", items: { type: "string" } },
                      cons: { type: "array", items: { type: "string" } },
                      estimated_roi: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["title", "description", "pros", "cons", "estimated_roi", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["risk_score", "impact_score", "risk_factors", "success_factors", "summary", "recommendation", "options"],
              additionalProperties: false,
            },
          },
        }]
      : [{
          type: "function",
          function: {
            name: "decision_analysis",
            description: "Structured analysis of a business decision with explainability",
            parameters: {
              type: "object",
              properties: {
                risk_score: { type: "number", description: "Risk score 0-100" },
                impact_score: { type: "number", description: "Impact score 0-100" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level of the analysis based on data quality and completeness" },
                confidence_reason: { type: "string", description: "Why this confidence level, 1 sentence in German" },
                risk_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string", description: "Risk factor description in German" },
                      weight: { type: "number", description: "Importance weight 1-10" },
                    },
                    required: ["factor", "weight"],
                    additionalProperties: false,
                  },
                  description: "Top 3 risk factors with weights",
                },
                success_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string", description: "Success factor description in German" },
                      weight: { type: "number", description: "Importance weight 1-10" },
                    },
                    required: ["factor", "weight"],
                    additionalProperties: false,
                  },
                  description: "Top 3 success factors with weights",
                },
                risk_explanation: { type: "string", description: "Why this risk score, referencing the top factors, 2 sentences in German" },
                summary: { type: "string", description: "Brief summary in German, max 2 sentences" },
              },
              required: ["risk_score", "impact_score", "confidence", "confidence_reason", "risk_factors", "success_factors", "risk_explanation", "summary"],
              additionalProperties: false,
            },
          },
        }];

    const toolName = isAutopilot ? "decision_autopilot" : "decision_analysis";
    const messages = [
      { role: "system", content: "Du bist ein KI-Berater für Geschäftsentscheidungen. Analysiere Entscheidungen und gib strukturierte Bewertungen. Antworte NUR mit dem Tool-Call." },
      { role: "user", content: prompt },
    ];

    const analysis = await callProvider(settings, messages, tools, { type: "function", function: { name: toolName } });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-decision error:", e);
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

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
    const userId = await extractUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Nicht authentifiziert" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, fileName } = await req.json();
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Kein Inhalt übergeben" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = await getUserAiSettings(userId);

    const tools = [{
      type: "function",
      function: {
        name: "extract_decisions",
        description: "Extract decision items from the provided document content",
        parameters: {
          type: "object",
          properties: {
            decisions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Kurzer, prägnanter Titel der Entscheidung" },
                  description: { type: "string", description: "Detaillierte Beschreibung und Kontext" },
                  category: { type: "string", enum: ["strategic", "budget", "hr", "technical", "operational", "marketing"] },
                  priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  due_date: { type: "string", description: "Fälligkeitsdatum im Format YYYY-MM-DD falls erkennbar, sonst null" },
                },
                required: ["title", "description", "category", "priority"],
              },
            },
            summary: { type: "string", description: "Kurze Zusammenfassung der analysierten Datei" },
          },
          required: ["decisions", "summary"],
        },
      },
    }];

    const messages = [
      {
        role: "system",
        content: `Du bist ein Experte für Entscheidungsmanagement. Deine Aufgabe ist es, ALLE Entscheidungen, Aufgaben und To-Dos aus dem Dokument zu extrahieren – auch implizite.

Wichtige Regeln:
- Lies das GESAMTE Dokument sorgfältig durch, nicht nur den Anfang
- Extrahiere JEDE identifizierbare Entscheidung, Aufgabe, Aktion oder To-Do als eigenen Eintrag
- Auch indirekt formulierte Aufgaben erkennen (z.B. "wir müssen...", "es sollte...", "bis nächste Woche...", "jemand kümmert sich um...")
- Tabellarische Daten: Jede Zeile kann eine eigene Entscheidung sein
- Meeting-Protokolle: Jeden Beschluss und jede Aktion einzeln erfassen
- E-Mails: Alle Anfragen, Genehmigungen und Aufträge extrahieren
- Vergib passende Kategorien: strategic, budget, hr, technical, operational, marketing
- Schätze die Priorität basierend auf Dringlichkeit und Auswirkung ein (low, medium, high, critical)
- Falls ein Datum erkennbar ist, setze es als due_date (YYYY-MM-DD)
- Titel sollten kurz und prägnant sein (max 80 Zeichen)
- Beschreibungen sollten den Kontext aus dem Dokument enthalten
- Liefere lieber zu viele als zu wenige Ergebnisse
- Antworte auf Deutsch`,
      },
      {
        role: "user",
        content: `Dateiname: ${fileName || "Unbekannt"}\n\nInhalt:\n${content.substring(0, 60000)}`,
      },
    ];

    const toolChoice = { type: "function", function: { name: "extract_decisions" } };
    const result = await callProvider(settings, messages, tools, toolChoice);

    // Handle both structured tool response and plain text
    let decisions: any[] = [];
    let summary = "";

    if (typeof result === "object" && result.decisions) {
      decisions = result.decisions;
      summary = result.summary || "";
    } else if (typeof result === "string") {
      // Try to parse JSON from text response
      try {
        const parsed = JSON.parse(result);
        decisions = parsed.decisions || [];
        summary = parsed.summary || "";
      } catch {
        summary = result;
      }
    }

    return new Response(JSON.stringify({ decisions, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-decisions error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "RATE_LIMIT" ? 429 : msg === "PAYMENT_REQUIRED" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-flash",
};

async function getUserAiSettings(userId: string): Promise<AiSettings> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);
  
  const { data } = await client
    .from("user_ai_settings")
    .select("provider, api_key, model")
    .eq("user_id", userId)
    .single();
  
  return data || { provider: "lovable", api_key: null, model: null };
}

async function getOrgModelPreference(userId: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(supabaseUrl, serviceKey);
  
  const { data: profile } = await client
    .from("profiles")
    .select("org_id")
    .eq("user_id", userId)
    .single();
  
  if (!profile?.org_id) return "auto";
  
  const { data: org } = await client
    .from("organizations")
    .select("ai_model_preference")
    .eq("id", profile.org_id)
    .single();
  
  return (org as any)?.ai_model_preference || "auto";
}

async function extractUserIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error } = await anonClient.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

async function callLovableGateway(messages: any[], tools?: any[], toolChoice?: any, orgModelPref?: string, taskType?: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  // Resolve model based on org preference
  let model = "google/gemini-3-flash-preview";
  if (orgModelPref === "flash") {
    model = "google/gemini-2.5-flash";
  } else if (orgModelPref === "pro") {
    model = "google/gemini-2.5-pro";
  } else if (orgModelPref === "auto") {
    // Auto: use pro for heavy analysis, flash for everything else
    const heavyTasks = ["analyze-decision", "daily-brief", "ceo-briefing", "intelligence-analyze"];
    if (taskType && heavyTasks.includes(taskType)) {
      model = "google/gemini-2.5-pro";
    } else {
      model = "google/gemini-2.5-flash";
    }
  }

  const body: any = {
    model,
    messages,
  };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { response, modelUsed: model };
}

async function callOpenAI(apiKey: string, model: string, messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = { model, messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function callAnthropic(apiKey: string, model: string, messages: any[], tools?: any[], toolChoice?: any) {
  // Convert OpenAI-style messages to Anthropic format
  const systemMsg = messages.find((m: any) => m.role === "system")?.content || "";
  const nonSystemMsgs = messages.filter((m: any) => m.role !== "system").map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  // Convert tools to Anthropic format
  const anthropicTools = tools?.map((t: any) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const body: any = {
    model,
    max_tokens: 4096,
    system: systemMsg,
    messages: nonSystemMsgs,
  };
  if (anthropicTools?.length) {
    body.tools = anthropicTools;
    if (toolChoice) {
      body.tool_choice = { type: "tool", name: toolChoice.function.name };
    }
  }

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function callGoogle(apiKey: string, model: string, messages: any[], tools?: any[], toolChoice?: any) {
  // Convert to Gemini format
  const systemMsg = messages.find((m: any) => m.role === "system")?.content;
  const contents = messages
    .filter((m: any) => m.role !== "system")
    .map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: any = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg }] };
  }

  // Convert tools to Gemini format
  if (tools?.length) {
    body.tools = [{
      functionDeclarations: tools.map((t: any) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }];
    if (toolChoice) {
      body.toolConfig = {
        functionCallingConfig: {
          mode: "ANY",
          allowedFunctionNames: [toolChoice.function.name],
        },
      };
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Normalize responses from different providers to a common format
async function normalizeResponse(provider: string, response: Response): Promise<any> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${provider} API error (${response.status}): ${text}`);
  }

  const data = await response.json();

  if (provider === "lovable" || provider === "openai") {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }
    return { text: data.choices?.[0]?.message?.content };
  }

  if (provider === "anthropic") {
    const toolBlock = data.content?.find((b: any) => b.type === "tool_use");
    if (toolBlock) {
      return toolBlock.input;
    }
    const textBlock = data.content?.find((b: any) => b.type === "text");
    return { text: textBlock?.text };
  }

  if (provider === "google") {
    const part = data.candidates?.[0]?.content?.parts?.[0];
    if (part?.functionCall) {
      return part.functionCall.args;
    }
    return { text: part?.text };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// Export a function that other edge functions can use
export async function callAI(
  req: Request,
  messages: any[],
  tools?: any[],
  toolChoice?: any,
  taskType?: string,
): Promise<{ data: any; response: Response | null; modelUsed?: string }> {
  const userId = await extractUserIdFromAuth(req);
  const settings = userId ? await getUserAiSettings(userId) : { provider: "lovable", api_key: null, model: null };

  const provider = settings.provider;
  const model = settings.model || DEFAULT_MODELS[provider] || "";
  const apiKey = settings.api_key || "";

  let response: Response;
  let modelUsed = model;

  switch (provider) {
    case "openai":
      if (!apiKey) throw new Error("OpenAI API-Key nicht konfiguriert. Bitte in Settings eingeben.");
      response = await callOpenAI(apiKey, model, messages, tools, toolChoice);
      break;
    case "anthropic":
      if (!apiKey) throw new Error("Anthropic API-Key nicht konfiguriert. Bitte in Settings eingeben.");
      response = await callAnthropic(apiKey, model, messages, tools, toolChoice);
      break;
    case "google":
      if (!apiKey) throw new Error("Google API-Key nicht konfiguriert. Bitte in Settings eingeben.");
      response = await callGoogle(apiKey, model, messages, tools, toolChoice);
      break;
    default: {
      // Get org model preference
      const orgPref = userId ? await getOrgModelPreference(userId) : "auto";
      const result = await callLovableGateway(messages, tools, toolChoice, orgPref, taskType);
      response = result.response;
      modelUsed = result.modelUsed;
      if (response.status === 429) {
        return {
          data: null,
          response: new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }), {
            status: 429, headers: { "Content-Type": "application/json" },
          }),
        };
      }
      if (response.status === 402) {
        return {
          data: null,
          response: new Response(JSON.stringify({ error: "KI-Kontingent aufgebraucht." }), {
            status: 402, headers: { "Content-Type": "application/json" },
          }),
        };
      }
      break;
    }
  }

  const data = await normalizeResponse(provider, response);
  // Attach model info to response data
  if (data && typeof data === "object") {
    data._model_used = modelUsed;
  }
  return { data, response: null, modelUsed };
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// This function can also be called directly for testing
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = await extractUserIdFromAuth(req);

    // Require authentication — block unauthenticated callers
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side rate limiting
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Rate limit erreicht. Bitte warte eine Minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, tools, tool_choice } = await req.json();
    const { data, response: errorResponse } = await callAI(req, messages, tools, tool_choice);

    if (errorResponse) {
      const headers = new Headers(errorResponse.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
      return new Response(errorResponse.body, { status: errorResponse.status, headers });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-proxy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

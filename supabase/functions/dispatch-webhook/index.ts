import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [0, 5000, 30000]; // immediate, 5s, 30s

/**
 * Universal Webhook Dispatcher
 * Dispatches events to registered webhook endpoints with HMAC-SHA256 signing.
 *
 * Available events:
 * decision.created, decision.approved, decision.rejected, decision.escalated,
 * decision.sla_violated, reviewer.assigned, reviewer.overdue, daily.brief.generated
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth check — verify caller belongs to the target org
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event, org_id, decision_id, extra, test } = await req.json();

    if (!event || !org_id) {
      return new Response(JSON.stringify({ error: "event and org_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is a member of the target org
    const { data: membership } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("org_id", org_id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden — not a member of this organization" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find all webhook endpoints for this org that subscribe to this event
    const { data: endpoints } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("org_id", org_id)
      .eq("enabled", true)
      .contains("events", [event]);

    if (!endpoints?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: "No webhooks subscribed to this event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload
    let decisionData: any = null;
    if (decision_id) {
      const { data } = await supabase
        .from("decisions")
        .select("id, title, category, status, priority, due_date, cost_per_day, escalation_level, created_by, implemented_at, created_at")
        .eq("id", decision_id)
        .single();
      if (data) {
        // Calculate duration & cost
        const createdAt = new Date(data.created_at);
        const endAt = data.implemented_at ? new Date(data.implemented_at) : new Date();
        const durationDays = Math.round((endAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const costOfDelayTotal = (data.cost_per_day || 0) * durationDays;

        // Get approver name if applicable
        let approvedBy: string | null = null;
        if (event === "decision.approved" || event === "decision.rejected") {
          const { data: reviews } = await supabase
            .from("decision_reviews")
            .select("reviewer_id")
            .eq("decision_id", decision_id)
            .not("reviewed_at", "is", null)
            .order("reviewed_at", { ascending: false })
            .limit(1);
          if (reviews?.[0]) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", reviews[0].reviewer_id)
              .single();
            approvedBy = profile?.full_name || null;
          }
        }

        decisionData = {
          id: data.id,
          title: data.title,
          category: data.category,
          status: data.status,
          priority: data.priority,
          approved_by: approvedBy,
          cost_of_delay_total: costOfDelayTotal,
          duration_days: durationDays,
        };
      }
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      organization_id: org_id,
      ...(decisionData ? { decision: decisionData } : {}),
      ...(extra || {}),
      ...(test ? { test: true } : {}),
    };

    const payloadStr = JSON.stringify(payload);

    // Dispatch to all matching endpoints
    const results = [];
    for (const endpoint of endpoints) {
      const result = await deliverWithRetry(supabase, endpoint, event, payloadStr, payload);
      results.push(result);
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("dispatch-webhook error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function deliverWithRetry(
  supabase: any,
  endpoint: any,
  event: string,
  payloadStr: string,
  payload: any
) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt - 1] || 5000));
    }

    const startTime = Date.now();
    try {
      // Sign payload with HMAC-SHA256
      const signature = await signPayload(payloadStr, endpoint.secret_token);

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Decivio-Signature": `sha256=${signature}`,
          "X-Decivio-Event": event,
          "X-Decivio-Delivery": crypto.randomUUID(),
          "User-Agent": "Decivio-Webhook/1.0",
        },
        body: payloadStr,
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text();
      const isSuccess = response.status >= 200 && response.status < 300;

      // Log delivery
      await supabase.from("webhook_deliveries").insert({
        webhook_id: endpoint.id,
        event,
        payload,
        response_status: response.status,
        response_body: responseBody.substring(0, 2000),
        duration_ms: durationMs,
        status: isSuccess ? "success" : (attempt === MAX_RETRIES ? "failed" : "retrying"),
        attempt,
        error_message: isSuccess ? null : `HTTP ${response.status}`,
      });

      if (isSuccess) {
        return { endpoint_id: endpoint.id, status: "success", response_status: response.status, attempt };
      }

      if (attempt === MAX_RETRIES) {
        return { endpoint_id: endpoint.id, status: "failed", response_status: response.status, attempt };
      }
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : "Network error";

      await supabase.from("webhook_deliveries").insert({
        webhook_id: endpoint.id,
        event,
        payload,
        response_status: null,
        duration_ms: durationMs,
        status: attempt === MAX_RETRIES ? "failed" : "retrying",
        attempt,
        error_message: errMsg,
      });

      if (attempt === MAX_RETRIES) {
        return { endpoint_id: endpoint.id, status: "failed", error: errMsg, attempt };
      }
    }
  }
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [0, 300_000, 1_800_000]; // immediate, 5min, 30min

/**
 * Universal Webhook Dispatcher
 * Dispatches events to registered webhook endpoints with HMAC-SHA256 signing.
 *
 * Events: decision.created, decision.approved, decision.rejected, decision.overdue,
 * decision.escalated, decision.sla_violated, task.created, task.completed,
 * review.requested, escalation.triggered, reviewer.assigned, daily.brief.generated
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    const internalSecret = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
    const token = authHeader?.replace("Bearer ", "");

    // Check if this is an internal service call using the shared secret
    const isInternalCall = !!(internalSecret && token === internalSecret);

    if (!isInternalCall) {
      // All non-internal calls must provide a valid JWT
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token!);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { event, org_id, decision_id, task_id, extra, test } = await req.json();

    if (!event || !org_id) {
      return new Response(JSON.stringify({ error: "event and org_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      return new Response(JSON.stringify({ skipped: true, reason: "No webhooks subscribed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build standardized payload
    const data: Record<string, any> = {};

    if (decision_id) {
      const { data: d } = await supabase
        .from("decisions")
        .select("id, title, category, status, priority, due_date, cost_per_day, escalation_level, created_by, owner_id, implemented_at, created_at")
        .eq("id", decision_id)
        .single();
      if (d) {
        const createdAt = new Date(d.created_at);
        const endAt = d.implemented_at ? new Date(d.implemented_at) : new Date();
        const durationDays = Math.round((endAt.getTime() - createdAt.getTime()) / 86400000);
        const costOfDelay = (d.cost_per_day || 0) * durationDays;

        let approvedBy: string | null = null;
        if (["decision.approved", "decision.rejected"].includes(event)) {
          const { data: reviews } = await supabase
            .from("decision_reviews")
            .select("reviewer_id")
            .eq("decision_id", decision_id)
            .not("reviewed_at", "is", null)
            .order("reviewed_at", { ascending: false })
            .limit(1);
          if (reviews?.[0]) {
            const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", reviews[0].reviewer_id).single();
            approvedBy = profile?.full_name || null;
          }
        }

        data.decision = {
          id: d.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          category: d.category,
          cost_of_delay: costOfDelay,
          cost_per_day: d.cost_per_day,
          duration_days: durationDays,
          due_date: d.due_date,
          approved_by: approvedBy,
          approved_at: d.implemented_at,
          escalation_level: d.escalation_level,
        };
      }
    }

    if (task_id) {
      const { data: t } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, decision_id, created_at")
        .eq("id", task_id)
        .single();
      if (t) {
        data.task = {
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          decision_id: t.decision_id,
        };
      }
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      org_id,
      data: Object.keys(data).length > 0 ? data : (extra || {}),
      ...(test ? { test: true } : {}),
    };

    const payloadStr = JSON.stringify(payload);

    // Dispatch to all matching endpoints
    const results = [];
    for (const endpoint of endpoints) {
      const result = await deliverWithRetry(supabase, endpoint, event, payloadStr, payload, org_id);
      results.push(result);
    }

    return new Response(JSON.stringify({ dispatched: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("dispatch-webhook error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function deliverWithRetry(
  supabase: any,
  endpoint: any,
  event: string,
  payloadStr: string,
  payload: any,
  orgId: string,
) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      // For edge function context, we can only do short delays
      // Real retry delays would be handled by a cron/queue system
      await new Promise((r) => setTimeout(r, Math.min(RETRY_DELAYS[attempt - 1], 10_000)));
    }

    const startTime = Date.now();
    try {
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

      // After final failed attempt, notify org admin
      if (attempt === MAX_RETRIES) {
        await notifyWebhookFailure(supabase, endpoint, event, orgId);
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
        await notifyWebhookFailure(supabase, endpoint, event, orgId);
        return { endpoint_id: endpoint.id, status: "failed", error: errMsg, attempt };
      }
    }
  }
}

async function notifyWebhookFailure(supabase: any, endpoint: any, event: string, orgId: string) {
  try {
    // Find org admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("org_id", orgId)
      .in("role", ["org_owner", "org_admin"]);

    if (admins?.length) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          user_id: admin.user_id,
          title: "Webhook fehlgeschlagen",
          message: `Webhook an ${endpoint.url} für Event "${event}" ist nach 3 Versuchen fehlgeschlagen.`,
          type: "system",
        });
      }
    }
  } catch (e) {
    console.error("Failed to notify about webhook failure:", e);
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

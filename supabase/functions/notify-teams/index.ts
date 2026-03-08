import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Microsoft Teams Notification Edge Function
 * Sends Adaptive Cards to Teams channels via Incoming Webhook.
 * 
 * Supported notification types:
 * - new_decision: New decision created
 * - sla_violation: SLA breach with Cost-of-Delay
 * - escalation: Urgent escalation with red accent
 * - review_request: Review/approval needed
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { type, decision_id, org_id, extra } = await req.json();

    if (!type || !org_id) {
      return new Response(JSON.stringify({ error: "type and org_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Teams config for this org
    const { data: config } = await supabase
      .from("teams_integration_config")
      .select("*")
      .eq("org_id", org_id)
      .single();

    if (!config || !config.enabled || !config.webhook_url) {
      return new Response(JSON.stringify({ skipped: true, reason: "Teams not configured or disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this notification type is enabled
    const typeEnabled: Record<string, boolean> = {
      new_decision: config.notify_new_decision,
      sla_violation: config.notify_sla_violation,
      escalation: config.notify_escalation,
      review_request: config.notify_review_request,
    };

    if (typeEnabled[type] === false) {
      return new Response(JSON.stringify({ skipped: true, reason: `${type} notifications disabled` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch decision data if provided
    let decision: any = null;
    if (decision_id) {
      const { data } = await supabase
        .from("decisions")
        .select("id, title, priority, status, due_date, category, cost_per_day, escalation_level, created_by, assignee_id")
        .eq("id", decision_id)
        .single();
      decision = data;
    }

    // Get creator name
    let creatorName = "Unbekannt";
    if (decision?.created_by) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", decision.created_by)
        .single();
      if (profile) creatorName = profile.full_name || "Unbekannt";
    }

    // Build Adaptive Card based on notification type
    const appUrl = extra?.app_url || "https://decivio.com";
    const decisionUrl = decision ? `${appUrl}/decisions/${decision.id}` : appUrl;
    const card = buildAdaptiveCard(type, decision, creatorName, decisionUrl, extra);

    // Send to Teams webhook
    const teamsResponse = await fetch(config.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });

    const status = teamsResponse.ok ? "sent" : "failed";
    const errorMessage = teamsResponse.ok ? null : await teamsResponse.text();

    // Log the notification
    await supabase.from("teams_notification_log").insert({
      org_id,
      decision_id: decision_id || null,
      notification_type: type,
      status,
      error_message: errorMessage,
    });

    if (!teamsResponse.ok) {
      console.error("Teams webhook error:", errorMessage);
      return new Response(JSON.stringify({ error: "Teams webhook failed", details: errorMessage }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-teams error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Adaptive Card Builders ──

function buildAdaptiveCard(type: string, decision: any, creatorName: string, url: string, extra?: any) {
  switch (type) {
    case "new_decision":
      return buildNewDecisionCard(decision, creatorName, url);
    case "sla_violation":
      return buildSlaViolationCard(decision, url, extra);
    case "escalation":
      return buildEscalationCard(decision, url);
    case "review_request":
      return buildReviewRequestCard(decision, creatorName, url);
    default:
      return buildGenericCard(type, decision, url);
  }
}

function wrapInTeamsPayload(card: any) {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
  };
}

const priorityColors: Record<string, string> = {
  critical: "Attention",
  high: "Warning",
  medium: "Accent",
  low: "Good",
};

const priorityEmoji: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🔵",
  low: "🟢",
};

function buildNewDecisionCard(decision: any, creatorName: string, url: string) {
  const prio = decision?.priority || "medium";
  return wrapInTeamsPayload({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: priorityColors[prio] || "Accent",
        items: [
          {
            type: "TextBlock",
            text: "📋 Neue Entscheidung",
            weight: "Bolder",
            size: "Medium",
            color: priorityColors[prio] || "Accent",
          },
        ],
      },
      {
        type: "FactSet",
        facts: [
          { title: "Titel", value: decision?.title || "–" },
          { title: "Ersteller", value: creatorName },
          { title: "Priorität", value: `${priorityEmoji[prio] || ""} ${prio.charAt(0).toUpperCase() + prio.slice(1)}` },
          { title: "Kategorie", value: decision?.category || "–" },
          ...(decision?.due_date ? [{ title: "Deadline", value: new Date(decision.due_date).toLocaleDateString("de-DE") }] : []),
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "In Decivio öffnen",
        url,
      },
    ],
  });
}

function buildSlaViolationCard(decision: any, url: string, extra?: any) {
  const daysOverdue = extra?.days_overdue || 0;
  const costPerDay = decision?.cost_per_day || 0;
  const totalCost = daysOverdue * costPerDay;

  return wrapInTeamsPayload({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "Attention",
        items: [
          {
            type: "TextBlock",
            text: "⚠️ SLA-Verletzung",
            weight: "Bolder",
            size: "Medium",
            color: "Attention",
          },
        ],
      },
      {
        type: "FactSet",
        facts: [
          { title: "Entscheidung", value: decision?.title || "–" },
          { title: "Überfällig", value: `${daysOverdue} Tag${daysOverdue !== 1 ? "e" : ""}` },
          ...(costPerDay > 0 ? [
            { title: "Cost-of-Delay", value: `€${costPerDay.toLocaleString("de-DE")}/Tag` },
            { title: "Gesamtkosten", value: `€${totalCost.toLocaleString("de-DE")}` },
          ] : []),
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Jetzt bearbeiten",
        url,
      },
    ],
  });
}

function buildEscalationCard(decision: any, url: string) {
  const level = decision?.escalation_level || 1;
  const levelLabels = ["", "⚠️ Warnung", "🔴 Dringend", "🚨 Überfällig"];

  return wrapInTeamsPayload({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "Attention",
        bleed: true,
        items: [
          {
            type: "TextBlock",
            text: `🚨 Eskalation — ${levelLabels[level] || "Stufe " + level}`,
            weight: "Bolder",
            size: "Medium",
            color: "Attention",
          },
        ],
      },
      {
        type: "TextBlock",
        text: decision?.title || "–",
        weight: "Bolder",
        size: "Large",
        wrap: true,
      },
      {
        type: "FactSet",
        facts: [
          { title: "Priorität", value: `${priorityEmoji[decision?.priority] || ""} ${decision?.priority || "–"}` },
          { title: "Status", value: decision?.status || "–" },
          ...(decision?.due_date ? [{ title: "Deadline", value: new Date(decision.due_date).toLocaleDateString("de-DE") }] : []),
        ],
      },
      {
        type: "TextBlock",
        text: "Diese Entscheidung erfordert sofortige Aufmerksamkeit.",
        wrap: true,
        color: "Attention",
        weight: "Bolder",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "🔥 Sofort bearbeiten",
        url,
      },
    ],
  });
}

function buildReviewRequestCard(decision: any, creatorName: string, url: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const actionUrl = `${supabaseUrl}/functions/v1/teams-action`;
  const costPerDay = decision?.cost_per_day || 0;

  return wrapInTeamsPayload({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "Container",
        style: "Accent",
        items: [
          {
            type: "TextBlock",
            text: "✅ Freigabe erforderlich",
            weight: "Bolder",
            size: "Medium",
          },
        ],
      },
      {
        type: "TextBlock",
        text: decision?.title || "–",
        weight: "Bolder",
        size: "Large",
        wrap: true,
      },
      {
        type: "FactSet",
        facts: [
          { title: "Angefordert von", value: creatorName },
          { title: "Priorität", value: `${priorityEmoji[decision?.priority] || ""} ${decision?.priority || "–"}` },
          ...(costPerDay > 0 ? [{ title: "Cost-of-Delay", value: `€${costPerDay.toLocaleString("de-DE")}/Tag` }] : []),
          ...(decision?.due_date ? [{ title: "Deadline", value: new Date(decision.due_date).toLocaleDateString("de-DE") }] : []),
        ],
      },
      {
        type: "Input.Text",
        id: "comment",
        placeholder: "Kommentar (optional)",
        isMultiline: false,
      },
    ],
    actions: [
      {
        type: "Action.Http",
        title: "✓ Genehmigen",
        method: "POST",
        url: actionUrl,
        headers: [{ name: "Content-Type", value: "application/json" }],
        body: JSON.stringify({
          action: "approve",
          decision_id: decision?.id,
          user_email: "{{userEmail}}",
          comment: "{{comment.value}}",
        }),
        style: "positive",
      },
      {
        type: "Action.Http",
        title: "✗ Ablehnen",
        method: "POST",
        url: actionUrl,
        headers: [{ name: "Content-Type", value: "application/json" }],
        body: JSON.stringify({
          action: "reject",
          decision_id: decision?.id,
          user_email: "{{userEmail}}",
          comment: "{{comment.value}}",
        }),
        style: "destructive",
      },
      {
        type: "Action.OpenUrl",
        title: "Details ansehen",
        url,
      },
    ],
  });
}

function buildGenericCard(type: string, decision: any, url: string) {
  return wrapInTeamsPayload({
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: `Decivio: ${type}`,
        weight: "Bolder",
        size: "Medium",
      },
      ...(decision ? [{
        type: "TextBlock",
        text: decision.title,
        wrap: true,
      }] : []),
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Öffnen",
        url,
      },
    ],
  });
}

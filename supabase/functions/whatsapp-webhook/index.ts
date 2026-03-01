import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Twilio WhatsApp Webhook handler
 * Processes incoming WhatsApp replies:
 *   1 = Approve pending review
 *   2 = Reject pending review
 *   3 = Reply with decision link
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Twilio sends form-urlencoded data
    const formData = await req.formData();
    const from = (formData.get("From") as string || "").replace("whatsapp:", "");
    const body = (formData.get("Body") as string || "").trim();

    if (!from || !body) {
      return new Response("<Response></Response>", {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    // Find user by phone number
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, whatsapp_phone")
      .eq("whatsapp_verified", true)
      .eq("whatsapp_enabled", true);

    const matchedPref = (prefs || []).find(
      (p) => p.whatsapp_phone?.replace(/[^+\d]/g, "") === from.replace(/[^+\d]/g, "")
    );

    if (!matchedPref) {
      return twimlReply("Ihre Nummer ist nicht bei Decivio registriert. Bitte aktivieren Sie WhatsApp in den Einstellungen.");
    }

    const userId = matchedPref.user_id;

    // Get user's pending reviews
    const { data: pendingReviews } = await supabase
      .from("decision_reviews")
      .select("id, decision_id, decisions!decision_reviews_decision_id_fkey(title, cost_per_day)")
      .eq("reviewer_id", userId)
      .eq("status", "review")
      .order("created_at", { ascending: false })
      .limit(1);

    const latestReview = pendingReviews?.[0];

    if (!latestReview) {
      return twimlReply("Sie haben derzeit keine offenen Reviews.");
    }

    const decisionTitle = (latestReview as any).decisions?.title || "Entscheidung";
    const decisionId = latestReview.decision_id;

    // Get user name for audit
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();
    const userName = profile?.full_name || "Unbekannt";

    const command = body.charAt(0);

    if (command === "1") {
      // Approve
      await supabase
        .from("decision_reviews")
        .update({ status: "approved", feedback: null, reviewed_at: new Date().toISOString() })
        .eq("id", latestReview.id);

      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: userId,
        action: "review.approved",
        field_name: "review",
        new_value: `${userName} hat via WhatsApp genehmigt`,
      });

      return twimlReply(`✅ "${decisionTitle}" wurde genehmigt. Die Aktion wurde im Audit Trail dokumentiert.`);
    }

    if (command === "2") {
      // Reject
      await supabase
        .from("decision_reviews")
        .update({ status: "rejected", feedback: null, reviewed_at: new Date().toISOString() })
        .eq("id", latestReview.id);

      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: userId,
        action: "review.rejected",
        field_name: "review",
        new_value: `${userName} hat via WhatsApp abgelehnt`,
      });

      return twimlReply(`❌ "${decisionTitle}" wurde abgelehnt. Die Aktion wurde im Audit Trail dokumentiert.`);
    }

    if (command === "3") {
      // Send link
      const appUrl = Deno.env.get("APP_URL") || "https://id-preview--eaca1dce-1b8a-4a7b-8183-2b9fae92043c.lovable.app";
      return twimlReply(`📋 Details: ${appUrl}/decisions/${decisionId}`);
    }

    return twimlReply(
      `Unbekannter Befehl. Bitte antworten Sie:\n1 = Genehmigen\n2 = Ablehnen\n3 = Mehr Details`
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return twimlReply("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
  }
});

function twimlReply(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, {
    headers: { "Content-Type": "text/xml", "Access-Control-Allow-Origin": "*" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

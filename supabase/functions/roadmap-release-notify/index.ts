import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Allow internal secret OR authenticated platform admin
    const secret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
    const hasInternalSecret = secret && secret === expectedSecret;

    if (!hasInternalSecret) {
      // Check if caller is an authenticated platform admin
      const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const { data: admin } = await supabaseAdmin
        .from("platform_admins")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!admin) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
    }

    const { item_id } = await req.json();
    if (!item_id) {
      return new Response(JSON.stringify({ error: "item_id required" }), { status: 400, headers: corsHeaders });
    }

    // Get roadmap item (reuse supabaseAdmin from above)

    // Get roadmap item
    const { data: item } = await supabaseAdmin
      .from("roadmap_items")
      .select("title, description")
      .eq("id", item_id)
      .single();

    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), { status: 404, headers: corsHeaders });
    }

    // Get all voter emails
    const { data: votes } = await supabaseAdmin
      .from("roadmap_votes")
      .select("voter_email")
      .eq("item_id", item_id);

    const emails = (votes || []).map((v: any) => v.voter_email);

    // Log the notification (actual email sending would use a transactional email service)
    console.log(`[roadmap-release-notify] Feature "${item.title}" released. Notifying ${emails.length} voters.`);

    return new Response(
      JSON.stringify({
        success: true,
        feature: item.title,
        voters_notified: emails.length,
        emails,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("roadmap-release-notify error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});

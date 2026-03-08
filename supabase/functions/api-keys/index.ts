import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return "dk_live_" + Array.from(arr, b => chars[b % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user's org_id and check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.org_id) return json({ error: "No organization found" }, 400);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!roleData || !["org_owner", "org_admin"].includes(roleData.role)) {
      return json({ error: "Insufficient permissions. Only org_owner and org_admin can manage API keys." }, 403);
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const { name, expiry = "never" } = body;
        if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
          return json({ error: "Invalid key name" }, 400);
        }

        const plainKey = generateApiKey();
        const keyHash = await sha256Hex(plainKey);
        const keyPreview = plainKey.substring(0, 12) + "•••" + plainKey.substring(plainKey.length - 4);

        let expiresAt: string | null = null;
        if (expiry !== "never") {
          const days = parseInt(expiry);
          if (!isNaN(days) && days > 0) {
            expiresAt = new Date(Date.now() + days * 86400000).toISOString();
          }
        }

        const { error: insertErr } = await supabase.from("api_keys").insert({
          name: name.trim(),
          key_hash: keyHash,
          key_preview: keyPreview,
          created_by: userId,
          org_id: profile.org_id,
          expires_at: expiresAt,
          is_active: true,
        });

        if (insertErr) return json({ error: insertErr.message }, 500);

        return json({ key: plainKey, preview: keyPreview });
      }

      case "revoke": {
        const { keyId } = body;
        if (!keyId) return json({ error: "Missing keyId" }, 400);

        // Only allow revoking keys from the same org
        const { data: existingKey } = await supabase
          .from("api_keys")
          .select("id, org_id")
          .eq("id", keyId)
          .eq("org_id", profile.org_id)
          .single();

        if (!existingKey) return json({ error: "Key not found" }, 404);

        const { error: updateErr } = await supabase
          .from("api_keys")
          .update({ is_active: false })
          .eq("id", keyId);

        if (updateErr) return json({ error: updateErr.message }, 500);

        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error("api-keys error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

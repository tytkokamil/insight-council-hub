import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Verify audit trail integrity by re-computing SHA-256 hash chain.
 * Returns: { valid: boolean, total: number, verified: number, broken_at?: number }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's org_id to scope audit logs
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.org_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch audit logs scoped to the user's organization
    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("id, created_at, user_id, action, old_value, new_value, integrity_hash, previous_hash")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({ valid: true, total: 0, verified: 0, last_hash: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Re-compute hash chain using Web Crypto API
    let prevHash = "GENESIS";
    let brokenAt: number | null = null;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Skip entries without hashes (pre-migration entries)
      if (!log.integrity_hash) continue;

      // Verify previous_hash link
      if (log.previous_hash !== prevHash) {
        brokenAt = i;
        break;
      }

      // Recompute hash
      const hashInput = prevHash + "|" +
        (log.created_at || "") + "|" +
        (log.user_id || "") + "|" +
        (log.action || "") + "|" +
        (log.old_value || "") + "|" +
        (log.new_value || "");

      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      if (computedHash !== log.integrity_hash) {
        brokenAt = i;
        break;
      }

      prevHash = log.integrity_hash;
    }

    const lastHash = logs[logs.length - 1]?.integrity_hash || null;
    const hashedCount = logs.filter(l => l.integrity_hash).length;

    return new Response(JSON.stringify({
      valid: brokenAt === null,
      total: logs.length,
      verified: brokenAt === null ? hashedCount : brokenAt,
      hashed_entries: hashedCount,
      broken_at: brokenAt,
      last_hash: lastHash,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-audit error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

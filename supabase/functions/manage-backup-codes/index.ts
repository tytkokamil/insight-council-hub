import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PBKDF2 with 100,000 iterations
async function hashCode(code: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateSecureCode(): string {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  // Convert to XXXX-XXXX format using hex
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return hex.slice(0, 4) + "-" + hex.slice(4, 8);
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { action, code } = await req.json();

    if (action === "generate") {
      // Generate 8 backup codes
      const plaintextCodes: string[] = [];
      const hashes: string[] = [];
      const salts: string[] = [];

      for (let i = 0; i < 8; i++) {
        const c = generateSecureCode();
        const s = generateSalt();
        const h = await hashCode(c, s);
        plaintextCodes.push(c);
        hashes.push(h);
        salts.push(s);
      }

      // Store ONLY hashes + salts, never plaintext
      await adminClient.from("mfa_settings").upsert({
        user_id: user.id,
        backup_codes: [],  // Clear plaintext column
        backup_codes_hash: hashes,
        backup_codes_salt: salts,
        backup_codes_count: 8,
        backup_codes_reset_needed: false,
      }, { onConflict: "user_id" });

      // Return plaintext codes ONCE to show to user
      return new Response(JSON.stringify({ success: true, codes: plaintextCodes }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "verify") {
      if (!code || typeof code !== "string") {
        return new Response(JSON.stringify({ error: "Code required" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const normalizedCode = code.trim().toUpperCase();

      const { data: settings } = await adminClient
        .from("mfa_settings")
        .select("backup_codes_hash, backup_codes_salt, backup_codes_count")
        .eq("user_id", user.id)
        .single();

      if (!settings || !settings.backup_codes_hash?.length) {
        return new Response(JSON.stringify({ error: "No backup codes configured" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const codeHashes = settings.backup_codes_hash as string[];
      const codeSalts = settings.backup_codes_salt as string[];

      // Check each hash
      let matchIndex = -1;
      for (let i = 0; i < codeHashes.length; i++) {
        const h = await hashCode(normalizedCode, codeSalts[i]);
        if (h === codeHashes[i]) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex === -1) {
        return new Response(JSON.stringify({ error: "Invalid backup code", verified: false }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Remove the used code (one-time use)
      const newHashes = [...codeHashes];
      const newSalts = [...codeSalts];
      newHashes.splice(matchIndex, 1);
      newSalts.splice(matchIndex, 1);

      await adminClient.from("mfa_settings").update({
        backup_codes_hash: newHashes,
        backup_codes_salt: newSalts,
        backup_codes_count: newHashes.length,
      }).eq("user_id", user.id);

      return new Response(JSON.stringify({ success: true, verified: true, remaining: newHashes.length }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "status") {
      const { data: settings } = await adminClient
        .from("mfa_settings")
        .select("backup_codes_count, backup_codes_reset_needed")
        .eq("user_id", user.id)
        .single();

      return new Response(JSON.stringify({
        count: settings?.backup_codes_count || 0,
        reset_needed: settings?.backup_codes_reset_needed || false,
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Backup codes error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

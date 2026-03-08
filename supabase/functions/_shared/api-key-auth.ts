// Shared API Key authentication for public API endpoints
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Rate limiter (in-memory per instance — sufficient for edge functions)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 100; // 100 requests per hour
const RATE_WINDOW = 3600000; // 1 hour in ms

function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(keyId);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimitMap.set(keyId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export interface ApiKeyAuth {
  org_id: string;
  user_id: string;
  key_id: string;
}

export async function authenticateApiKey(authHeader: string | null): Promise<ApiKeyAuth | null> {
  if (!authHeader?.startsWith("Bearer dk_live_")) return null;

  const plainKey = authHeader.replace("Bearer ", "");
  const keyHash = await sha256Hex(plainKey);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get all active keys and compare with timing-safe comparison
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, org_id, created_by, key_hash, expires_at, is_active")
    .eq("is_active", true);

  if (!keys || keys.length === 0) return null;

  const matchedKey = keys.find(k => timingSafeEqual(k.key_hash, keyHash));
  if (!matchedKey) return null;

  // Check expiration
  if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
    return null;
  }

  // Rate limit check
  if (!checkRateLimit(matchedKey.id)) {
    return null; // Caller should return 429
  }

  // Update last_used_at (fire and forget)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", matchedKey.id)
    .then(() => {});

  return {
    org_id: matchedKey.org_id!,
    user_id: matchedKey.created_by,
    key_id: matchedKey.id,
  };
}

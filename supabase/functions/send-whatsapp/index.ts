import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { mode, phone, code, decision_id, message } = await req.json();
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

    // ── Send verification code ──
    if (mode === "send_verification") {
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone number required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      const verifyCode = String(arr[0] % 1000000).padStart(6, "0");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Store verification code
      await supabase.from("whatsapp_verifications").insert({
        user_id: userId,
        phone,
        code: verifyCode,
        expires_at: expiresAt,
      });

      // Send via Twilio if configured
      if (twilioSid && twilioToken) {
        const cleanPhone = phone.replace(/[^+\d]/g, "");
        const body = `[Decivio] Ihr Verifizierungscode: ${verifyCode}. Gültig für 10 Minuten.`;
        
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const formData = new URLSearchParams({
          From: twilioFrom,
          To: `whatsapp:${cleanPhone}`,
          Body: body,
        });

        await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });
      }

      return new Response(
        JSON.stringify({ success: true, demo_code: !twilioSid ? verifyCode : undefined }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Verify code ──
    if (mode === "verify") {
      if (!code || !phone) {
        return new Response(JSON.stringify({ error: "Code and phone required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: verification } = await supabase
        .from("whatsapp_verifications")
        .select("*")
        .eq("user_id", userId)
        .eq("phone", phone)
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!verification) {
        return new Response(JSON.stringify({ error: "invalid_code", message: "Ungültiger oder abgelaufener Code." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark as used
      await supabase
        .from("whatsapp_verifications")
        .update({ used: true })
        .eq("id", verification.id);

      // Update notification preferences
      await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: userId, whatsapp_phone: phone, whatsapp_verified: true, whatsapp_enabled: true },
          { onConflict: "user_id" }
        );

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Send critical notification ──
    if (mode === "send_notification") {
      if (!decision_id || !message) {
        return new Response(JSON.stringify({ error: "decision_id and message required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user's WhatsApp phone
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("whatsapp_phone, whatsapp_verified, whatsapp_enabled")
        .eq("user_id", userId)
        .single();

      if (!prefs?.whatsapp_enabled || !prefs?.whatsapp_verified || !prefs?.whatsapp_phone) {
        return new Response(
          JSON.stringify({ error: "whatsapp_not_configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (twilioSid && twilioToken) {
        const cleanPhone = prefs.whatsapp_phone.replace(/[^+\d]/g, "");
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const formData = new URLSearchParams({
          From: twilioFrom,
          To: `whatsapp:${cleanPhone}`,
          Body: message,
        });

        await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

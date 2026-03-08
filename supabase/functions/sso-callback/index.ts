import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SSO Callback Edge Function
 * 
 * Handles SAML 2.0 responses from Identity Providers.
 * 
 * IMPORTANT: This is a simplified implementation. For production use,
 * full XML signature verification with a library like `samlify` is required.
 * The current implementation validates the basic SAML assertion structure
 * and maps attributes to create/update Supabase users.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const appUrl = "https://app.decivio.com";

  try {
    // SAML responses come as POST with form-encoded body
    const contentType = req.headers.get("content-type") || "";
    let samlResponse: string | null = null;
    let relayState: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      samlResponse = formData.get("SAMLResponse") as string;
      relayState = formData.get("RelayState") as string;
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      samlResponse = body.SAMLResponse;
      relayState = body.RelayState;
    }

    if (!samlResponse) {
      return new Response(
        redirectHtml(appUrl + "/auth?error=no_saml_response"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Decode SAML Response (Base64)
    const decodedXml = atob(samlResponse);

    // Extract key attributes from SAML assertion
    // NOTE: In production, use proper XML parsing and signature verification
    const email = extractAttribute(decodedXml, "email") || extractNameId(decodedXml);
    const firstName = extractAttribute(decodedXml, "given_name") || extractAttribute(decodedXml, "firstName") || "";
    const lastName = extractAttribute(decodedXml, "family_name") || extractAttribute(decodedXml, "lastName") || "";
    const issuer = extractIssuer(decodedXml);

    if (!email) {
      console.error("No email found in SAML assertion");
      return new Response(
        redirectHtml(appUrl + "/auth?error=no_email_in_assertion"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Look up SSO configuration by entity_id
    const { data: ssoConfig } = await supabase
      .from("sso_configurations")
      .select("*")
      .eq("entity_id", issuer)
      .eq("is_active", true)
      .single();

    if (!ssoConfig) {
      console.error("No active SSO config found for issuer:", issuer);
      return new Response(
        redirectHtml(appUrl + "/auth?error=unknown_sso_provider"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // TODO: Production — verify XML signature against ssoConfig.certificate
    // This requires a proper SAML library for Deno (e.g., XML DSig verification)

    const fullName = [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0];

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update profile name if changed
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", userId);
    } else {
      // Create new user via admin API (no password — SSO only)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, sso_provider: ssoConfig.provider_name },
      });

      if (createError || !newUser.user) {
        console.error("Failed to create SSO user:", createError);
        return new Response(
          redirectHtml(appUrl + "/auth?error=user_creation_failed"),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
        );
      }

      userId = newUser.user.id;

      // Set org_id on profile
      await supabase.from("profiles").update({
        org_id: ssoConfig.org_id,
        full_name: fullName,
      }).eq("user_id", userId);

      // Assign default role
      await supabase.from("user_roles").upsert({
        user_id: userId,
        role: "org_member",
        org_id: ssoConfig.org_id,
      }, { onConflict: "user_id,role" });
    }

    // Generate a session token for the user
    // NOTE: This uses the admin API to generate a magic link
    // which the user will be redirected to for automatic login
    const { data: magicLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: appUrl + "/dashboard" },
    });

    if (linkError || !magicLink?.properties?.action_link) {
      console.error("Failed to generate session:", linkError);
      return new Response(
        redirectHtml(appUrl + "/auth?error=session_creation_failed"),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
      );
    }

    // Redirect user to magic link for automatic session creation
    return new Response(
      redirectHtml(magicLink.properties.action_link),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );

  } catch (err: any) {
    console.error("SSO callback error:", err);
    return new Response(
      redirectHtml(appUrl + "/auth?error=sso_failed"),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  }
});

// Helper: Generate redirect HTML
function redirectHtml(url: string): string {
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url}"><script>window.location.href="${url}";</script></head><body>Redirecting...</body></html>`;
}

// Helper: Extract NameID from SAML XML
function extractNameId(xml: string): string | null {
  const match = xml.match(/<(?:saml2?:)?NameID[^>]*>([^<]+)<\/(?:saml2?:)?NameID>/);
  return match ? match[1].trim() : null;
}

// Helper: Extract Issuer from SAML XML
function extractIssuer(xml: string): string | null {
  const match = xml.match(/<(?:saml2?:)?Issuer[^>]*>([^<]+)<\/(?:saml2?:)?Issuer>/);
  return match ? match[1].trim() : null;
}

// Helper: Extract attribute from SAML assertion
function extractAttribute(xml: string, name: string): string | null {
  // Match various SAML attribute name formats
  const patterns = [
    new RegExp(`<(?:saml2?:)?Attribute[^>]*Name="${name}"[^>]*>\\s*<(?:saml2?:)?AttributeValue[^>]*>([^<]+)`, "i"),
    new RegExp(`<(?:saml2?:)?Attribute[^>]*FriendlyName="${name}"[^>]*>\\s*<(?:saml2?:)?AttributeValue[^>]*>([^<]+)`, "i"),
    // OID format for common attributes
    ...(name === "email" ? [/Name="http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress"[^>]*>\s*<[^>]*AttributeValue[^>]*>([^<]+)/i] : []),
    ...(name === "given_name" ? [/Name="http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/givenname"[^>]*>\s*<[^>]*AttributeValue[^>]*>([^<]+)/i] : []),
    ...(name === "family_name" ? [/Name="http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/surname"[^>]*>\s*<[^>]*AttributeValue[^>]*>([^<]+)/i] : []),
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

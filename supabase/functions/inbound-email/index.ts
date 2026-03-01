import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Inbound Email Webhook
 * Processes incoming emails from providers like SendGrid Inbound Parse, Mailgun, etc.
 * Creates decisions with AI-extracted metadata.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Support both JSON and form-data (SendGrid sends multipart/form-data)
    let emailData: {
      to: string;
      from: string;
      subject: string;
      text?: string;
      html?: string;
      cc?: string;
      attachments?: Array<{ filename: string; content: string; type: string }>;
    };

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      emailData = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData();
      emailData = {
        to: (formData.get("to") as string) || "",
        from: (formData.get("from") as string) || "",
        subject: (formData.get("subject") as string) || "",
        text: (formData.get("text") as string) || "",
        html: (formData.get("html") as string) || "",
        cc: (formData.get("cc") as string) || "",
      };
      // Parse attachment info if present
      const attachmentInfo = formData.get("attachment-info");
      if (attachmentInfo) {
        try {
          const info = JSON.parse(attachmentInfo as string);
          emailData.attachments = [];
          for (const key of Object.keys(info)) {
            const file = formData.get(key) as File;
            if (file) {
              const buffer = await file.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              emailData.attachments.push({
                filename: info[key].filename || file.name,
                content: base64,
                type: info[key].type || file.type,
              });
            }
          }
        } catch { /* ignore parse errors */ }
      }
    } else {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Extract org from the "to" address: entscheidungen@[org-slug].decivio.com
    const toAddress = emailData.to.toLowerCase();
    const toMatch = toAddress.match(/<?\s*([^@>]+)@([^.>]+)\.decivio\.com\s*>?/);
    if (!toMatch) {
      return new Response(JSON.stringify({ error: "invalid_recipient", message: "Keine gültige Decivio-Adresse." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgSlugFromEmail = toMatch[2];

    // 2. Find the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, slug, name")
      .eq("slug", orgSlugFromEmail)
      .single();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "org_not_found", message: "Organisation nicht gefunden." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check inbound email config
    const { data: config } = await supabase
      .from("inbound_email_config")
      .select("*")
      .eq("org_id", org.id)
      .single();

    if (config && !config.enabled) {
      await logEmail(supabase, org.id, emailData.from, emailData.subject, "rejected", "Inbound email disabled");
      return new Response(JSON.stringify({ error: "disabled", message: "E-Mail-Eingang ist deaktiviert." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Validate sender domain
    const fromEmail = extractEmail(emailData.from);
    const fromDomain = fromEmail.split("@")[1]?.toLowerCase();

    if (config?.allowed_domains?.length) {
      const allowed = config.allowed_domains.map((d: string) => d.toLowerCase());
      if (!allowed.includes(fromDomain)) {
        await logEmail(supabase, org.id, fromEmail, emailData.subject, "rejected", `Domain ${fromDomain} not allowed`);
        return new Response(JSON.stringify({ error: "domain_not_allowed", message: "Diese E-Mail-Domain ist nicht verifiziert." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 5. Find the sender user in the org
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("user_id, full_name, org_id")
      .eq("org_id", org.id);

    // Try to match by email from auth.users (via service role)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const senderAuth = authUsers?.users?.find((u) => u.email?.toLowerCase() === fromEmail.toLowerCase());
    const senderUser = senderProfile?.find((p) => p.user_id === senderAuth?.id);

    if (!senderUser) {
      await logEmail(supabase, org.id, fromEmail, emailData.subject, "rejected", "Sender not found in org");
      return new Response(JSON.stringify({ error: "sender_not_found", message: "Absender ist kein Mitglied dieser Organisation." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. AI extraction of priority, deadline, reviewers from email body
    const bodyText = emailData.text || stripHtml(emailData.html || "");
    const ccEmails = extractCcEmails(emailData.cc || "");
    let aiExtraction: any = {};

    try {
      aiExtraction = await extractWithAi(bodyText, emailData.subject, ccEmails);
    } catch (e) {
      console.error("AI extraction failed, using defaults:", e);
      aiExtraction = { priority: "medium", category: "operational", due_date: null, reviewers: ccEmails };
    }

    // 7. Create the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .insert({
        title: emailData.subject.substring(0, 200),
        description: bodyText.substring(0, 10000),
        status: "draft",
        priority: aiExtraction.priority || "medium",
        category: aiExtraction.category || "operational",
        due_date: aiExtraction.due_date || null,
        created_by: senderUser.user_id,
        owner_id: senderUser.user_id,
        org_id: org.id,
      })
      .select("id, title")
      .single();

    if (decisionError || !decision) {
      await logEmail(supabase, org.id, fromEmail, emailData.subject, "error", decisionError?.message || "Failed to create decision");
      return new Response(JSON.stringify({ error: "creation_failed", message: "Entscheidung konnte nicht erstellt werden." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Add reviewers from CC addresses
    const reviewerEmails = aiExtraction.reviewers || ccEmails;
    if (reviewerEmails.length > 0 && authUsers?.users) {
      for (const ccEmail of reviewerEmails) {
        const ccUser = authUsers.users.find((u) => u.email?.toLowerCase() === ccEmail.toLowerCase());
        if (ccUser) {
          const inOrg = senderProfile?.find((p) => p.user_id === ccUser.id);
          if (inOrg) {
            await supabase.from("decision_reviews").insert({
              decision_id: decision.id,
              reviewer_id: ccUser.id,
              status: "review",
              step_order: 1,
            });
          }
        }
      }
    }

    // 9. Handle attachments
    if (emailData.attachments?.length) {
      for (const att of emailData.attachments) {
        try {
          const bytes = Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0));
          const filePath = `${decision.id}/${Date.now()}_${att.filename}`;

          await supabase.storage
            .from("decision-attachments")
            .upload(filePath, bytes, { contentType: att.type });

          const { data: urlData } = supabase.storage
            .from("decision-attachments")
            .getPublicUrl(filePath);

          await supabase.from("decision_attachments").insert({
            decision_id: decision.id,
            uploaded_by: senderUser.user_id,
            file_name: att.filename,
            file_url: urlData.publicUrl,
            file_type: att.type,
            file_size: bytes.length,
          });
        } catch (e) {
          console.error("Attachment upload error:", e);
        }
      }
    }

    // 10. Audit log
    await supabase.from("audit_logs").insert({
      decision_id: decision.id,
      user_id: senderUser.user_id,
      action: "decision.created_via_email",
      field_name: "source",
      new_value: `Erstellt via E-Mail von ${fromEmail}`,
    });

    // 11. Log success
    await logEmail(supabase, org.id, fromEmail, emailData.subject, "processed", null, decision.id, aiExtraction);

    // 12. Send confirmation notification
    await supabase.from("notifications").insert({
      user_id: senderUser.user_id,
      title: "Entscheidung via E-Mail erstellt",
      message: `Ihre E-Mail "${emailData.subject}" wurde als Entscheidung erfasst.`,
      type: "system",
      decision_id: decision.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        decision_id: decision.id,
        decision_title: decision.title,
        ai_extraction: aiExtraction,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Inbound email error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ──

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim().toLowerCase();
}

function extractCcEmails(cc: string): string[] {
  if (!cc) return [];
  return cc
    .split(",")
    .map((s) => extractEmail(s))
    .filter((e) => e.includes("@") && !e.includes("decivio.com"));
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function logEmail(
  supabase: any,
  orgId: string,
  fromEmail: string,
  subject: string,
  status: string,
  errorMessage?: string | null,
  decisionId?: string,
  aiExtraction?: any
) {
  await supabase.from("inbound_email_log").insert({
    org_id: orgId,
    from_email: fromEmail,
    subject,
    status,
    error_message: errorMessage || null,
    decision_id: decisionId || null,
    ai_extraction: aiExtraction || null,
  });
}

async function extractWithAi(body: string, subject: string, ccEmails: string[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return { priority: "medium", category: "operational", due_date: null, reviewers: ccEmails };
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "extract_email_metadata",
        description: "Extract decision metadata from an email",
        parameters: {
          type: "object",
          properties: {
            priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Priority based on keywords like 'dringend', 'sofort', 'kritisch', 'ASAP'" },
            category: { type: "string", enum: ["strategic", "budget", "hr", "technical", "operational", "marketing"], description: "Category based on email content" },
            due_date: { type: "string", description: "Deadline in YYYY-MM-DD format if mentioned, otherwise null" },
            reviewers: { type: "array", items: { type: "string" }, description: "Email addresses of people who should review (from CC + mentions)" },
          },
          required: ["priority", "category", "reviewers"],
        },
      },
    },
  ];

  const messages = [
    {
      role: "system",
      content: `Du analysierst E-Mails und extrahierst Metadaten für Entscheidungen.
Regeln:
- Priorität: 'critical' bei Wörtern wie 'sofort', 'dringend', 'ASAP', 'Notfall'. 'high' bei 'wichtig', 'prioritär'. 'low' bei 'irgendwann', 'nice-to-have'. Sonst 'medium'.
- Kategorie: Basierend auf Inhalt (strategic, budget, hr, technical, operational, marketing).
- Deadline: Wenn ein konkretes Datum genannt wird, extrahiere es im Format YYYY-MM-DD. Relative Angaben wie 'nächste Woche' oder 'bis Freitag' umrechnen basierend auf heute.
- Reviewer: CC-Adressen übernehmen, plus im Text erwähnte Personen/E-Mails.
Heutiges Datum: ${new Date().toISOString().split("T")[0]}`,
    },
    {
      role: "user",
      content: `Betreff: ${subject}\n\nCC: ${ccEmails.join(", ") || "keine"}\n\nInhalt:\n${body.substring(0, 3000)}`,
    },
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      tools,
      tool_choice: { type: "function", function: { name: "extract_email_metadata" } },
    }),
  });

  if (!response.ok) {
    console.error("AI extraction error:", response.status);
    return { priority: "medium", category: "operational", due_date: null, reviewers: ccEmails };
  }

  const data = await response.json();
  const tc = data.choices?.[0]?.message?.tool_calls?.[0];
  if (tc) {
    return JSON.parse(tc.function.arguments);
  }
  return { priority: "medium", category: "operational", due_date: null, reviewers: ccEmails };
}

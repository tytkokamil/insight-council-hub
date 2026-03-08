import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const ab = enc.encode(a), bb = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Shared-secret auth guard for internal/cron functions
  const secret = Deno.env.get("INTERNAL_FUNCTIONS_SECRET");
  const provided = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
  if (!secret || !timingSafeEqual(provided, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: { org_id: string; status: string; error?: string }[] = [];

  try {
    // ═══════════════════════════════════════════════════════
    // TRIAL MANAGEMENT (runs before org loop)
    // ═══════════════════════════════════════════════════════

    // TRIAL STEP 1: Send first reminder (3 days before expiry)
    const { data: trialReminder1 } = await supabase
      .from("organizations")
      .select("id, name, trial_ends_at")
      .eq("subscription_status", "trialing")
      .eq("trial_reminder_sent", false)
      .lte("trial_ends_at", new Date(Date.now() + 3 * 86400000).toISOString())
      .gt("trial_ends_at", new Date().toISOString());

    if (trialReminder1) {
      for (const org of trialReminder1) {
        const daysLeft = Math.ceil((new Date(org.trial_ends_at!).getTime() - Date.now()) / 86400000);
        // Get org owner
        const { data: ownerRole } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("org_id", org.id)
          .eq("role", "org_owner")
          .limit(1)
          .single();

        if (ownerRole) {
          // Call trial-reminder edge function
          try {
            await fetch(`${supabaseUrl}/functions/v1/trial-reminder`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                org_id: org.id,
                org_name: org.name,
                user_id: ownerRole.user_id,
                days_left: daysLeft,
                reminder_type: "first",
              }),
            });
          } catch (e) {
            console.error("Trial reminder failed:", e);
          }

          // Send in-app notification
          await supabase.from("notifications").insert({
            user_id: ownerRole.user_id,
            org_id: org.id,
            type: "trial_warning",
            title: `Testphase endet in ${daysLeft} Tagen`,
            message: `Ihre kostenlose Testphase endet in ${daysLeft} Tagen. Upgraden Sie jetzt um alle Features zu behalten.`,
          });
        }

        await supabase
          .from("organizations")
          .update({ trial_reminder_sent: true })
          .eq("id", org.id);
      }
    }

    // TRIAL STEP 2: Send final reminder (1 day before expiry)
    const { data: trialReminder2 } = await supabase
      .from("organizations")
      .select("id, name, trial_ends_at")
      .eq("subscription_status", "trialing")
      .eq("trial_final_reminder_sent", false)
      .lte("trial_ends_at", new Date(Date.now() + 1 * 86400000).toISOString())
      .gt("trial_ends_at", new Date().toISOString());

    if (trialReminder2) {
      for (const org of trialReminder2) {
        const { data: ownerRole } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("org_id", org.id)
          .eq("role", "org_owner")
          .limit(1)
          .single();

        if (ownerRole) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/trial-reminder`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                org_id: org.id,
                org_name: org.name,
                user_id: ownerRole.user_id,
                days_left: 1,
                reminder_type: "final",
              }),
            });
          } catch (e) {
            console.error("Final trial reminder failed:", e);
          }

          await supabase.from("notifications").insert({
            user_id: ownerRole.user_id,
            org_id: org.id,
            type: "trial_warning",
            title: "Testphase endet morgen!",
            message: "Ihre Testphase endet morgen. Upgraden Sie jetzt um Ihre Features nicht zu verlieren.",
          });
        }

        await supabase
          .from("organizations")
          .update({ trial_final_reminder_sent: true })
          .eq("id", org.id);
      }
    }

    // TRIAL STEP 3: Expire trials that have ended
    const { data: expiredTrials } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("subscription_status", "trialing")
      .lte("trial_ends_at", new Date().toISOString());

    if (expiredTrials) {
      for (const org of expiredTrials) {
        // Downgrade to free
        await supabase
          .from("organizations")
          .update({
            plan: "free",
            subscription_status: "trial_expired",
          })
          .eq("id", org.id);

        // Notify org owner
        const { data: ownerRole } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("org_id", org.id)
          .eq("role", "org_owner")
          .limit(1)
          .single();

        if (ownerRole) {
          await supabase.from("notifications").insert({
            user_id: ownerRole.user_id,
            org_id: org.id,
            type: "trial_expired",
            title: "Testphase abgelaufen",
            message: "Ihre kostenlose Testphase ist abgelaufen. Upgraden Sie jetzt um alle Premium-Features wieder freizuschalten.",
          });

          try {
            await fetch(`${supabaseUrl}/functions/v1/trial-reminder`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({
                org_id: org.id,
                org_name: org.name,
                user_id: ownerRole.user_id,
                days_left: 0,
                reminder_type: "expired",
              }),
            });
          } catch (e) {
            console.error("Trial expired email failed:", e);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // DUNNING MANAGEMENT (past_due orgs)
    // ═══════════════════════════════════════════════════════
    const { data: pastDueOrgs } = await supabase
      .from("organizations")
      .select("id, name, payment_failed_at, dunning_step, dunning_last_sent_at")
      .eq("subscription_status", "past_due")
      .not("payment_failed_at", "is", null);

    if (pastDueOrgs) {
      for (const org of pastDueOrgs) {
        const daysSinceFailure = Math.floor(
          (Date.now() - new Date(org.payment_failed_at!).getTime()) / 86400000
        );

        let nextStep = 0;
        if (daysSinceFailure >= 10) nextStep = 4; // suspend
        else if (daysSinceFailure >= 7) nextStep = 3; // final warning
        else if (daysSinceFailure >= 3) nextStep = 2; // reminder
        else nextStep = 1; // already sent on day 0

        const currentStep = org.dunning_step || 0;

        if (nextStep > currentStep) {
          // Get org owner
          const { data: ownerRole } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("org_id", org.id)
            .eq("role", "org_owner")
            .limit(1)
            .single();

          if (ownerRole) {
            if (nextStep === 4) {
              // Day 10: Suspend — downgrade to free
              await supabase
                .from("organizations")
                .update({
                  plan: "free",
                  subscription_status: "suspended",
                  dunning_step: 4,
                  dunning_last_sent_at: new Date().toISOString(),
                })
                .eq("id", org.id);

              await supabase.from("notifications").insert({
                user_id: ownerRole.user_id,
                org_id: org.id,
                type: "payment_suspended",
                title: "Zugang eingeschränkt",
                message: "Ihr Zugang wurde auf den Free-Plan zurückgestuft. Aktualisieren Sie Ihre Zahlungsmethode um wieder vollen Zugang zu erhalten.",
              });
            } else {
              await supabase
                .from("organizations")
                .update({
                  dunning_step: nextStep,
                  dunning_last_sent_at: new Date().toISOString(),
                })
                .eq("id", org.id);

              // Notification messages per step
              const notifMessages: Record<number, { title: string; message: string }> = {
                2: {
                  title: "Erinnerung: Zahlung ausstehend",
                  message: "Ihre Zahlung ist weiterhin ausstehend. Bitte aktualisieren Sie Ihre Zahlungsmethode.",
                },
                3: {
                  title: "Letzte Warnung: Zugang wird in 3 Tagen eingeschränkt",
                  message: "Ohne Zahlungsaktualisierung wird Ihr Plan in 3 Tagen auf Free zurückgestuft.",
                },
              };

              if (notifMessages[nextStep]) {
                await supabase.from("notifications").insert({
                  user_id: ownerRole.user_id,
                  org_id: org.id,
                  type: "payment_warning",
                  title: notifMessages[nextStep].title,
                  message: notifMessages[nextStep].message,
                });
              }
            }

            // Send dunning email
            try {
              await fetch(`${supabaseUrl}/functions/v1/dunning-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                  org_id: org.id,
                  org_name: org.name,
                  user_id: ownerRole.user_id,
                  dunning_step: nextStep,
                }),
              });
            } catch (e) {
              console.error("Dunning email failed:", e);
            }
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // RE-ENGAGEMENT EMAILS
    // ═══════════════════════════════════════════════════════
    const supabasePublicUrl = supabaseUrl.replace("/auth/v1", "").replace(/\/+$/, "");

    const { data: inactiveProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, last_seen_at, email_reengagement_opt_out, reengagement_7d_sent, reengagement_14d_sent, reengagement_30d_sent, org_id")
      .eq("email_reengagement_opt_out", false);

    if (inactiveProfiles) {
      for (const profile of inactiveProfiles) {
        if (!profile.last_seen_at) continue;
        const daysSinceSeen = Math.floor((Date.now() - new Date(profile.last_seen_at).getTime()) / 86400000);

        // Get user email via auth admin
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
        if (!authUser?.user?.email) continue;

        // Generate a secure opt-out token for the unsubscribe link
        let unsubscribeUrl = `${supabasePublicUrl}/functions/v1/reengagement-optout?uid=${profile.user_id}`;
        try {
          const optoutToken = crypto.randomUUID() + "-" + crypto.randomUUID();
          // Use a dummy decision_id and review_id since reengagement tokens don't relate to a decision
          const dummyId = "00000000-0000-0000-0000-000000000000";
          await supabase.from("email_action_tokens").insert({
            token: optoutToken,
            action_type: "reengagement_optout",
            user_id: profile.user_id,
            decision_id: dummyId,
            review_id: dummyId,
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
          });
          unsubscribeUrl = `${supabasePublicUrl}/functions/v1/reengagement-optout?token=${optoutToken}`;
        } catch (e) {
          console.error("Failed to generate optout token, using legacy URL:", e);
        }
        const appUrl = "https://app.decivio.com";

        // Day 7 re-engagement
        if (daysSinceSeen >= 7 && daysSinceSeen < 14 && !profile.reengagement_7d_sent) {
          // Find last open decision
          const { data: lastDec } = await supabase
            .from("decisions")
            .select("id, title, cost_per_day")
            .eq("created_by", profile.user_id)
            .in("status", ["draft", "review"])
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          if (lastDec) {
            const totalCod = (lastDec.cost_per_day || 85) * daysSinceSeen;
            try {
              const { reengagementDay7Email } = await import("../_shared/email-templates.ts");
              const email = reengagementDay7Email({
                userName: profile.full_name || "dort",
                lastDecisionTitle: lastDec.title,
                costOfDelay: totalCod,
                decisionUrl: `${appUrl}/decisions/${lastDec.id}`,
                unsubscribeUrl,
              });

              await fetch(`${supabaseUrl}/functions/v1/review-notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
                body: JSON.stringify({ to: authUser.user.email, subject: email.subject, html: email.html }),
              });
            } catch (e) { console.error("Reengagement day 7 email failed:", e); }

            await supabase.from("profiles").update({ reengagement_7d_sent: true }).eq("user_id", profile.user_id);
          }
        }

        // Day 14 re-engagement
        if (daysSinceSeen >= 14 && daysSinceSeen < 30 && !profile.reengagement_14d_sent) {
          const { data: openDecs, count } = await supabase
            .from("decisions")
            .select("cost_per_day", { count: "exact" })
            .eq("created_by", profile.user_id)
            .in("status", ["draft", "review"])
            .is("deleted_at", null);

          const totalCod = (openDecs || []).reduce((s, d) => s + (d.cost_per_day || 0), 0) * daysSinceSeen;

          try {
            const { reengagementDay14Email } = await import("../_shared/email-templates.ts");
            const email = reengagementDay14Email({
              userName: profile.full_name || "dort",
              openDecisionCount: count || 0,
              totalCod,
              appUrl,
              unsubscribeUrl,
            });

            await fetch(`${supabaseUrl}/functions/v1/review-notify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
              body: JSON.stringify({ to: authUser.user.email, subject: email.subject, html: email.html }),
            });
          } catch (e) { console.error("Reengagement day 14 email failed:", e); }

          await supabase.from("profiles").update({ reengagement_14d_sent: true }).eq("user_id", profile.user_id);
        }

        // Day 30 re-engagement (only free/trial)
        if (daysSinceSeen >= 30 && !profile.reengagement_30d_sent && profile.org_id) {
          const { data: org } = await supabase
            .from("organizations")
            .select("subscription_status, plan")
            .eq("id", profile.org_id)
            .single();

          if (org && (org.subscription_status === "trialing" || org.plan === "free" || org.subscription_status === "trial_expired")) {
            try {
              const { reengagementDay30Email } = await import("../_shared/email-templates.ts");
              const email = reengagementDay30Email({
                userName: profile.full_name || "dort",
                features: [
                  "KI-gestützter Decision Copilot für schnellere Analysen",
                  "Automatische Eskalationsregeln mit SLA-Tracking",
                  "Executive Dashboard mit Portfolio-Risikoübersicht",
                ],
                appUrl,
                unsubscribeUrl,
              });

              await fetch(`${supabaseUrl}/functions/v1/review-notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
                body: JSON.stringify({ to: authUser.user.email, subject: email.subject, html: email.html }),
              });
            } catch (e) { console.error("Reengagement day 30 email failed:", e); }

            await supabase.from("profiles").update({ reengagement_30d_sent: true }).eq("user_id", profile.user_id);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // EXISTING ORG LOOP
    // ═══════════════════════════════════════════════════════

    // Fetch all active organizations
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name");

    if (orgErr || !orgs) {
      return new Response(JSON.stringify({ error: "Failed to fetch orgs", detail: orgErr }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const org of orgs) {
      try {
        // ───────────────────────────────────────────────
        // STEP 0: Data Retention — Auto-Archive & Cleanup
        // ───────────────────────────────────────────────
        const { data: orgConfig } = await supabase
          .from("organizations")
          .select("data_retention_config")
          .eq("id", org.id)
          .single();

        const retention = orgConfig?.data_retention_config as any || {};
        const archiveMonths = retention.archive_after_months ?? 24;
        const deleteArchivedMonths = retention.delete_archived_months ?? null;
        const notifDeleteDays = retention.notification_delete_days ?? 90;

        // Auto-archive implemented decisions older than threshold
        const archiveCutoff = new Date(Date.now() - archiveMonths * 30 * 86400000).toISOString();
        const { data: toArchive } = await supabase
          .from("decisions")
          .select("id")
          .eq("org_id", org.id)
          .eq("status", "implemented")
          .is("deleted_at", null)
          .is("archived_at", null)
          .lt("updated_at", archiveCutoff);

        if (toArchive && toArchive.length > 0) {
          const ids = toArchive.map(d => d.id);
          await supabase
            .from("decisions")
            .update({ status: "archived", archived_at: new Date().toISOString() })
            .in("id", ids);

          // Notify org admins
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("org_id", org.id)
            .in("role", ["org_admin", "org_owner"]);

          if (adminRoles) {
            for (const admin of adminRoles) {
              await supabase.from("notifications").insert({
                user_id: admin.user_id,
                org_id: org.id,
                type: "retention",
                title: `${ids.length} Entscheidungen automatisch archiviert`,
                message: `${ids.length} abgeschlossene Entscheidungen wurden gemäß Ihrer Aufbewahrungsrichtlinie (${archiveMonths} Monate) archiviert.`,
              });
            }
          }
          console.log(`[retention] Archived ${ids.length} decisions for org ${org.id}`);
        }

        // Delete archived decisions past deletion threshold
        if (deleteArchivedMonths !== null) {
          const deleteCutoff = new Date(Date.now() - deleteArchivedMonths * 30 * 86400000).toISOString();
          const { data: toDelete } = await supabase
            .from("decisions")
            .select("id")
            .eq("org_id", org.id)
            .eq("status", "archived")
            .is("deleted_at", null)
            .lt("archived_at", deleteCutoff);

          if (toDelete && toDelete.length > 0) {
            await supabase
              .from("decisions")
              .update({ deleted_at: new Date().toISOString() })
              .in("id", toDelete.map(d => d.id));
            console.log(`[retention] Soft-deleted ${toDelete.length} archived decisions for org ${org.id}`);
          }
        }

        // Delete old notifications
        const notifCutoff = new Date(Date.now() - notifDeleteDays * 86400000).toISOString();
        await supabase
          .from("notifications")
          .delete()
          .eq("org_id", org.id)
          .eq("read", true)
          .lt("created_at", notifCutoff);
        // ───────────────────────────────────────────────
        // STEP 1: Calculate Cost-of-Delay for open decisions
        // ───────────────────────────────────────────────
        const { data: openDecisions } = await supabase
          .from("decisions")
          .select("id, created_at, team_id, priority")
          .eq("org_id", org.id)
          .in("status", ["draft", "review"])
          .is("deleted_at", null)
          .is("archived_at", null);

        if (openDecisions && openDecisions.length > 0) {
          const teamIds = [...new Set(openDecisions.map((d) => d.team_id).filter(Boolean))];
          let teamConfigMap: Record<string, { hourlyRate: number; persons: number; overhead: number }> = {};

          if (teamIds.length > 0) {
            const { data: teams } = await supabase
              .from("teams")
              .select("id, hourly_rate, cod_persons, cod_overhead_factor")
              .in("id", teamIds);

            if (teams) {
              for (const t of teams) {
                teamConfigMap[t.id] = {
                  hourlyRate: t.hourly_rate ?? 85,
                  persons: t.cod_persons ?? 3,
                  overhead: Number(t.cod_overhead_factor) || 1.5,
                };
              }
            }
          }

          const defaultConfig = { hourlyRate: 85, persons: 3, overhead: 1.5 };

          for (const d of openDecisions) {
            const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
            const cfg = d.team_id && teamConfigMap[d.team_id] ? teamConfigMap[d.team_id] : defaultConfig;
            const dailyCost = Math.round(cfg.hourlyRate * 8 * cfg.persons * cfg.overhead);

            await supabase
              .from("decisions")
              .update({ cost_per_day: dailyCost })
              .eq("id", d.id);
          }
        }

        // ───────────────────────────────────────────────
        // STEP 2: Identify decisions becoming critical (SLA < 24h)
        // ───────────────────────────────────────────────
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        const { data: slaDecisions } = await supabase
          .from("decisions")
          .select("id, title, due_date, owner_id")
          .eq("org_id", org.id)
          .in("status", ["draft", "review"])
          .is("deleted_at", null)
          .not("due_date", "is", null)
          .lte("due_date", tomorrow)
          .gte("due_date", now);

        if (slaDecisions) {
          for (const d of slaDecisions) {
            await supabase.from("notifications").insert({
              user_id: d.owner_id,
              org_id: org.id,
              decision_id: d.id,
              type: "sla_warning",
              title: `SLA-Frist läuft ab: ${d.title}`,
              message: `Die Frist für "${d.title}" läuft in weniger als 24 Stunden ab.`,
            });
          }
        }

        // ───────────────────────────────────────────────
        // STEP 3: Identify overdue reviewers (> 48h no response)
        // ───────────────────────────────────────────────
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const { data: overdueReviews } = await supabase
          .from("decision_reviews")
          .select("id, decision_id, reviewer_id, created_at, decisions!decision_reviews_decision_id_fkey(title, org_id)")
          .eq("status", "review")
          .lte("created_at", twoDaysAgo);

        if (overdueReviews) {
          for (const r of overdueReviews) {
            const decisionData = r.decisions as any;
            if (decisionData?.org_id !== org.id) continue;

            await supabase.from("notifications").insert({
              user_id: r.reviewer_id,
              org_id: org.id,
              decision_id: r.decision_id,
              type: "reviewer_overdue",
              title: `Erinnerung: Review ausstehend`,
              message: `Sie haben seit über 48 Stunden nicht auf "${decisionData?.title}" reagiert.`,
            });
          }
        }

        // ───────────────────────────────────────────────
        // STEP 4: Generate AI Daily Brief (store summary)
        // ───────────────────────────────────────────────
        const { data: orgProfiles } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("org_id", org.id);

        const totalOpen = openDecisions?.length ?? 0;
        const criticalCount = slaDecisions?.length ?? 0;
        const overdueCount = overdueReviews?.filter((r) => (r.decisions as any)?.org_id === org.id).length ?? 0;

        const briefContent = {
          date: new Date().toISOString().split("T")[0],
          summary: {
            open_decisions: totalOpen,
            critical_sla: criticalCount,
            overdue_reviewers: overdueCount,
          },
          generated_at: new Date().toISOString(),
        };

        if (orgProfiles) {
          for (const p of orgProfiles) {
            await supabase.from("briefings").upsert(
              {
                user_id: p.user_id,
                content: briefContent,
                generated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
          }
        }

        // ───────────────────────────────────────────────
        // STEP 5: Trigger automation rules
        // ───────────────────────────────────────────────
        const { data: rules } = await supabase
          .from("automation_rules")
          .select("*")
          .eq("org_id", org.id)
          .eq("enabled", true)
          .eq("trigger_event", "scheduled_daily");

        if (rules && openDecisions) {
          for (const rule of rules) {
            for (const d of openDecisions) {
              const fieldValue = (d as any)[rule.condition_field];
              let matches = false;

              if (rule.condition_operator === "equals") matches = String(fieldValue) === rule.condition_value;
              else if (rule.condition_operator === "gt") matches = Number(fieldValue) > Number(rule.condition_value);
              else if (rule.condition_operator === "lt") matches = Number(fieldValue) < Number(rule.condition_value);

              if (matches) {
                await supabase.from("automation_rule_logs").insert({
                  rule_id: rule.id,
                  decision_id: d.id,
                  action_taken: rule.action_type,
                  details: `Auto-triggered by daily engine: ${rule.name}`,
                });

                if (rule.action_type === "set_priority") {
                  await supabase.from("decisions").update({ priority: rule.action_value }).eq("id", d.id);
                } else if (rule.action_type === "notify") {
                  await supabase.from("notifications").insert({
                    user_id: (d as any).owner_id ?? rule.created_by,
                    org_id: org.id,
                    decision_id: d.id,
                    type: "automation",
                    title: `Automatische Regel: ${rule.name}`,
                    message: rule.description || rule.action_value,
                  });
                }
              }
            }
          }
        }

        // ───────────────────────────────────────────────
        // STEP 6: Churn Risk Score Calculation
        // ───────────────────────────────────────────────
        try {
          let churnScore = 0;
          const riskFactors: string[] = [];

          // Get all org members with their profiles
          const { data: orgMembers } = await supabase
            .from("profiles")
            .select("user_id, last_seen_at, onboarding_completed")
            .eq("org_id", org.id);

          // Factor 1: No login in 7+ days (+30)
          const latestSeen = orgMembers?.reduce((latest: string | null, m) => {
            if (!m.last_seen_at) return latest;
            if (!latest) return m.last_seen_at;
            return new Date(m.last_seen_at) > new Date(latest) ? m.last_seen_at : latest;
          }, null);

          if (!latestSeen || (Date.now() - new Date(latestSeen).getTime()) > 7 * 86400000) {
            churnScore += 30;
            const daysSince = latestSeen ? Math.floor((Date.now() - new Date(latestSeen).getTime()) / 86400000) : 999;
            riskFactors.push(`Kein Login seit ${daysSince} Tagen`);
          }

          // Factor 2: 0 decisions in last 14 days (+20)
          const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
          const { count: recentDecisions } = await supabase
            .from("decisions")
            .select("id", { count: "exact", head: true })
            .eq("org_id", org.id)
            .gte("created_at", fourteenDaysAgo)
            .is("deleted_at", null);

          if ((recentDecisions ?? 0) === 0) {
            churnScore += 20;
            riskFactors.push("Keine neuen Entscheidungen in 14 Tagen");
          }

          // Factor 3: Trial ends in <3 days and no paid subscription (+15)
          const { data: orgDetails } = await supabase
            .from("organizations")
            .select("subscription_status, trial_ends_at, plan")
            .eq("id", org.id)
            .single();

          if (orgDetails?.subscription_status === "trialing" && orgDetails.trial_ends_at) {
            const daysToExpiry = (new Date(orgDetails.trial_ends_at).getTime() - Date.now()) / 86400000;
            if (daysToExpiry < 3 && daysToExpiry > 0) {
              churnScore += 15;
              riskFactors.push(`Trial endet in ${Math.ceil(daysToExpiry)} Tagen`);
            }
          }

          // Factor 4: subscription_status = 'past_due' (+15)
          if (orgDetails?.subscription_status === "past_due") {
            churnScore += 15;
            riskFactors.push("Zahlung überfällig (past_due)");
          }

          // Factor 5: NPS < 6 (+10) — check latest feedback
          const { data: npsData } = await supabase
            .from("feature_feedback")
            .select("rating")
            .eq("feature", "nps")
            .in("user_id", (orgMembers || []).map(m => m.user_id))
            .order("created_at", { ascending: false })
            .limit(1);

          if (npsData && npsData.length > 0 && npsData[0].rating !== null && npsData[0].rating < 6) {
            churnScore += 10;
            riskFactors.push(`NPS Score: ${npsData[0].rating}`);
          }

          // Factor 6: Onboarding not completed (+10)
          const anyNotOnboarded = orgMembers?.some(m => !m.onboarding_completed);
          if (anyNotOnboarded) {
            churnScore += 10;
            riskFactors.push("Onboarding nicht abgeschlossen");
          }

          // Bonus: AI Daily Brief active (-10)
          const { count: briefCount } = await supabase
            .from("daily_briefs")
            .select("id", { count: "exact", head: true })
            .eq("org_id", org.id)
            .gte("generated_at", new Date(Date.now() - 7 * 86400000).toISOString());

          if ((briefCount ?? 0) > 0) {
            churnScore -= 10;
            riskFactors.push("KI Daily Brief aktiv (-10)");
          }

          // Bonus: > 3 users invited (-10)
          if ((orgMembers?.length ?? 0) > 3) {
            churnScore -= 10;
            riskFactors.push(`${orgMembers?.length} Nutzer eingeladen (-10)`);
          }

          // Bonus: Active paid subscription (-20)
          if (orgDetails?.subscription_status === "active" && orgDetails.plan !== "free") {
            churnScore -= 20;
            riskFactors.push("Aktives bezahltes Abo (-20)");
          }

          // Clamp score
          churnScore = Math.max(0, Math.min(100, churnScore));
          const riskLevel = churnScore > 70 ? "critical" : churnScore > 40 ? "medium" : "low";

          // Insert churn risk log
          await supabase.from("churn_risk_log").insert({
            org_id: org.id,
            score: churnScore,
            risk_level: riskLevel,
            risk_factors: riskFactors,
          });

          // Auto-intervention for critical risk
          if (riskLevel === "critical") {
            // Check if intervention sent in last 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
            const { data: recentIntervention } = await supabase
              .from("churn_risk_log")
              .select("id")
              .eq("org_id", org.id)
              .eq("intervention_sent", true)
              .gte("calculated_at", sevenDaysAgo)
              .limit(1);

            if (!recentIntervention || recentIntervention.length === 0) {
              // Get org owner for re-engagement email
              const { data: ownerRole } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("org_id", org.id)
                .eq("role", "org_owner")
                .limit(1)
                .single();

              if (ownerRole) {
                const { data: authUser } = await supabase.auth.admin.getUserById(ownerRole.user_id);

                if (authUser?.user?.email) {
                  // Send re-engagement email
                  try {
                    await fetch(`${supabaseUrl}/functions/v1/reengagement-optout`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
                      body: JSON.stringify({ user_id: ownerRole.user_id, org_id: org.id, type: "churn_critical" }),
                    });
                  } catch (e) { console.error("Churn intervention email failed:", e); }

                  // Update the log entry with intervention
                  await supabase
                    .from("churn_risk_log")
                    .update({
                      intervention_sent: true,
                      intervention_type: "reengagement_email",
                      intervention_reason: `Critical churn risk (Score: ${churnScore})`,
                    })
                    .eq("org_id", org.id)
                    .order("calculated_at", { ascending: false })
                    .limit(1);

                  // Notify platform admins
                  const { data: platformAdmins } = await supabase
                    .from("platform_admins")
                    .select("user_id");

                  if (platformAdmins) {
                    for (const admin of platformAdmins) {
                      await supabase.from("notifications").insert({
                        user_id: admin.user_id,
                        type: "churn_alert",
                        title: `⚠️ Churn Risk: ${org.name}`,
                        message: `${org.name} hat Churn Risk Score ${churnScore} — ${riskFactors[0] || "Mehrere Risikofaktoren"}`,
                      });
                    }
                  }
                }
              }
            }
          }

          console.log(`[churn] Org ${org.id}: score=${churnScore}, level=${riskLevel}`);
        } catch (churnErr: any) {
          console.error(`[churn] Error for org ${org.id}:`, churnErr.message);
        }

        results.push({ org_id: org.id, status: "success" });
      } catch (orgError: any) {
        results.push({ org_id: org.id, status: "error", error: orgError.message });
      }
    }

    return new Response(
      JSON.stringify({ timestamp: new Date().toISOString(), results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

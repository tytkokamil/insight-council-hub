import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = user.id;

    const { count } = await supabase.from("decisions").select("id", { count: "exact", head: true }).eq("created_by", userId);
    if ((count || 0) > 0) {
      return new Response(JSON.stringify({ error: "Du hast bereits Entscheidungen. Demo-Daten sind nur für neue Accounts." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueIn = (d: number) => { const dt = new Date(now.getTime() + d * 86400000); return dt.toISOString().split("T")[0]; };
    const overdue = (d: number) => { const dt = new Date(now.getTime() - d * 86400000); return dt.toISOString().split("T")[0]; };

    // 1. Create demo team
    const { data: team } = await supabase.from("teams").insert({ name: "Produktteam (Demo)", description: "Cross-funktionales Produktteam", created_by: userId, hourly_rate: 75 }).select().single();
    const teamId = team?.id;

    if (teamId) {
      await supabase.from("team_members").insert({ team_id: teamId, user_id: userId, role: "lead" });
    }

    // 2. Create 12 decisions across different statuses and time periods for ROI Before/After
    const decisions = [
      // --- Current period (last 90 days) - faster, fewer escalations ---
      {
        title: "Cloud-Migration der Legacy-Systeme",
        description: "Migration der bestehenden On-Premise-Infrastruktur zu einem Cloud-nativen Setup. Betrifft 12 Services und 3 Datenbanken.",
        status: "review" as const, priority: "critical" as const, category: "technical" as const,
        due_date: overdue(2), created_at: daysAgo(14), team_id: teamId, created_by: userId, owner_id: userId,
        escalation_level: 1, last_escalated_at: daysAgo(1),
        ai_risk_score: 72, ai_impact_score: 85,
        ai_risk_factors: ["Komplexe Datenbank-Migration", "Downtime-Risiko für 3 Systeme", "Fehlende Cloud-Expertise im Team"],
        ai_success_factors: ["Inkrementeller Rollout", "Parallelbetrieb während Migration", "Automatisierte Tests"],
        context: "Aktuelle Infrastrukturkosten steigen um 15% pro Quartal.",
      },
      {
        title: "Q2 Marketing-Budget Allokation",
        description: "Verteilung des Q2-Budgets auf Performance Marketing, Content und Events.",
        status: "approved" as const, priority: "high" as const, category: "budget" as const,
        due_date: dueIn(5), created_at: daysAgo(10), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 25, ai_impact_score: 60,
        ai_risk_factors: ["ROI von Events schwer messbar"],
        ai_success_factors: ["Klare KPI-Zuordnung pro Kanal", "Wöchentliches Budget-Review"],
      },
      {
        title: "Senior Developer Hiring Pipeline",
        description: "Evaluierung der Recruiting-Strategie: Interne Beförderung vs. externe Headhunter vs. Freelancer.",
        status: "proposed" as const, priority: "high" as const, category: "hr" as const,
        due_date: dueIn(14), created_at: daysAgo(5), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 40, ai_impact_score: 70,
      },
      {
        title: "Pricing-Modell für Enterprise-Kunden",
        description: "Neues Tiered-Pricing mit Volumenrabatten und jährlicher Abrechnung.",
        status: "implemented" as const, priority: "critical" as const, category: "strategic" as const,
        due_date: overdue(5), created_at: daysAgo(30), implemented_at: daysAgo(3),
        team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 55, ai_impact_score: 95, outcome_type: "successful" as const,
        outcome: "Revenue pro Enterprise-Kunde +32% in den ersten 30 Tagen.",
        actual_impact_score: 90,
      },
      {
        title: "Remote Work Policy Update",
        description: "Aktualisierung der Remote-Work-Richtlinie: 3 Tage Home-Office, 2 Tage Office.",
        status: "draft" as const, priority: "medium" as const, category: "operational" as const,
        due_date: dueIn(21), created_at: daysAgo(2), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 15, ai_impact_score: 45,
      },
      {
        title: "API Rate-Limiting Strategie",
        description: "Implementierung von Rate-Limiting für öffentliche API-Endpunkte.",
        status: "implemented" as const, priority: "high" as const, category: "technical" as const,
        created_at: daysAgo(20), implemented_at: daysAgo(8),
        team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 30, ai_impact_score: 65, outcome_type: "successful" as const,
        outcome: "API-Stabilität um 99.8% verbessert. Keine Ausfälle seit Implementierung.",
        actual_impact_score: 75,
      },
      {
        title: "Customer Success Team Aufbau",
        description: "Aufbau eines dedizierten CS-Teams mit 3 FTEs für Enterprise-Kunden.",
        status: "implemented" as const, priority: "high" as const, category: "hr" as const,
        created_at: daysAgo(45), implemented_at: daysAgo(12),
        team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 35, ai_impact_score: 80, outcome_type: "successful" as const,
        outcome: "Churn-Rate um 22% gesunken. NPS von 42 auf 67 gestiegen.",
        actual_impact_score: 85,
      },
      // --- Previous period (90-180 days ago) - slower, more escalations ---
      {
        title: "Datenbank-Refactoring (Legacy)",
        description: "Umstellung der monolithischen Datenbankstruktur auf Microservices.",
        status: "implemented" as const, priority: "critical" as const, category: "technical" as const,
        created_at: daysAgo(160), implemented_at: daysAgo(110),
        team_id: teamId, created_by: userId, owner_id: userId,
        escalation_level: 2, ai_risk_score: 80, ai_impact_score: 75,
        outcome_type: "partial" as const,
        outcome: "Migration abgeschlossen, aber 2 Wochen Verzögerung durch unerwartete Schema-Konflikte.",
        actual_impact_score: 50,
      },
      {
        title: "Q1 Werbekampagne",
        description: "Multi-Channel Kampagne mit €200k Budget für Produktlaunch.",
        status: "implemented" as const, priority: "high" as const, category: "marketing" as const,
        created_at: daysAgo(150), implemented_at: daysAgo(100),
        team_id: teamId, created_by: userId, owner_id: userId,
        escalation_level: 1, ai_risk_score: 45, ai_impact_score: 70,
        outcome_type: "partial" as const,
        outcome: "CAC lag 25% über Ziel. Organischer Traffic jedoch +40%.",
        actual_impact_score: 55,
      },
      {
        title: "Office-Standort Expansion München",
        description: "Evaluierung eines zweiten Bürostandorts in München.",
        status: "rejected" as const, priority: "medium" as const, category: "strategic" as const,
        created_at: daysAgo(140), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 65, ai_impact_score: 50,
      },
      {
        title: "Vendor Lock-in Bewertung AWS",
        description: "Risikobewertung der AWS-Abhängigkeit und Evaluation von Multi-Cloud.",
        status: "implemented" as const, priority: "medium" as const, category: "technical" as const,
        created_at: daysAgo(130), implemented_at: daysAgo(95),
        team_id: teamId, created_by: userId, owner_id: userId,
        escalation_level: 1, ai_risk_score: 50, ai_impact_score: 60,
        outcome_type: "successful" as const,
        outcome: "Multi-Cloud Strategie definiert. Kernservices auf Terraform migriert.",
        actual_impact_score: 65,
      },
      {
        title: "Compliance-Audit DSGVO",
        description: "Vollständiges DSGVO-Audit aller Datenverarbeitungsprozesse.",
        status: "implemented" as const, priority: "critical" as const, category: "operational" as const,
        created_at: daysAgo(120), implemented_at: daysAgo(92),
        team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 70, ai_impact_score: 90,
        outcome_type: "successful" as const,
        outcome: "Audit bestanden. 3 Minor Findings behoben.",
        actual_impact_score: 80,
      },
    ];

    const { data: insertedDecisions } = await supabase.from("decisions").insert(decisions).select("id, title, status, created_at");

    // 3. Create tasks
    if (insertedDecisions && insertedDecisions.length > 0) {
      const tasks = [
        { title: "Cloud-Provider vergleichen (AWS vs. Azure vs. GCP)", status: "in_progress" as const, priority: "high" as const, category: "technical" as const, due_date: dueIn(3), created_by: userId, team_id: teamId },
        { title: "Migrationstimeline erstellen", status: "open" as const, priority: "critical" as const, category: "technical" as const, due_date: dueIn(7), created_by: userId, team_id: teamId },
        { title: "Budget-Proposal finalisieren", status: "done" as const, priority: "high" as const, category: "budget" as const, due_date: overdue(1), created_by: userId, team_id: teamId, completed_at: daysAgo(1) },
        { title: "Stellenausschreibung formulieren", status: "open" as const, priority: "medium" as const, category: "hr" as const, due_date: dueIn(10), created_by: userId, team_id: teamId },
        { title: "Pricing-Tabelle für Sales erstellen", status: "done" as const, priority: "high" as const, category: "strategic" as const, created_by: userId, team_id: teamId, completed_at: daysAgo(5) },
        { title: "Feedback-Umfrage an Mitarbeiter senden", status: "backlog" as const, priority: "low" as const, category: "operational" as const, created_by: userId, team_id: teamId },
        { title: "API-Dokumentation aktualisieren", status: "done" as const, priority: "medium" as const, category: "technical" as const, created_by: userId, team_id: teamId, completed_at: daysAgo(9) },
        { title: "Onboarding-Playbook für CS Team", status: "done" as const, priority: "high" as const, category: "hr" as const, created_by: userId, team_id: teamId, completed_at: daysAgo(14) },
        { title: "Datenschutz-Folgenabschätzung erstellen", status: "done" as const, priority: "critical" as const, category: "operational" as const, created_by: userId, team_id: teamId, completed_at: daysAgo(93) },
      ];
      await supabase.from("tasks").insert(tasks);
    }

    // 4. Create risks
    await supabase.from("risks").insert([
      {
        title: "Datenverlust bei Cloud-Migration",
        description: "Risiko eines partiellen Datenverlusts während der Migrationsphase.",
        likelihood: 3, impact: 5, risk_score: 15,
        status: "open", created_by: userId, team_id: teamId,
        mitigation_plan: "Inkrementelle Migration mit Rollback-Plan und dreifacher Backup-Strategie.",
      },
      {
        title: "Key-Person Dependency Engineering",
        description: "Kritisches Wissen konzentriert bei 2 Senior Engineers.",
        likelihood: 4, impact: 4, risk_score: 16,
        status: "open", created_by: userId, team_id: teamId,
        mitigation_plan: "Knowledge-Sharing Sessions und Dokumentation der Kernarchitektur.",
      },
    ]);

    // 5. Lessons learned for implemented decisions
    const implementedDecs = insertedDecisions?.filter(d => d.status === "implemented") || [];
    if (implementedDecs.length > 0) {
      const lessons = [
        {
          decision_id: implementedDecs[0]?.id, created_by: userId,
          key_takeaway: "Tiered Pricing funktioniert am besten mit klaren Feature-Grenzen zwischen den Stufen.",
          what_went_well: "Schnelle Adoption durch bestehende Kunden. Revenue-Impact war höher als prognostiziert.",
          what_went_wrong: "Initiale Kommunikation war zu technisch. Sales-Team brauchte zusätzliches Training.",
          recommendations: "Immer Sales-Enablement Material parallel zum Pricing erstellen.",
        },
        ...(implementedDecs[1] ? [{
          decision_id: implementedDecs[1].id, created_by: userId,
          key_takeaway: "Rate-Limiting früh einführen — nicht erst nach dem ersten Ausfall.",
          what_went_well: "Schnelle Implementierung dank bestehender API-Gateway-Infrastruktur.",
          what_went_wrong: "Interne Services waren anfangs auch betroffen (fehlende Allowlist).",
          recommendations: "Immer interne und externe Endpunkte getrennt konfigurieren.",
        }] : []),
        ...(implementedDecs[2] ? [{
          decision_id: implementedDecs[2].id, created_by: userId,
          key_takeaway: "CS-Team muss vom ersten Tag an klar definierte Eskalationspfade haben.",
          what_went_well: "Churn-Reduktion übertraf Erwartungen. Team-Chemie war sofort gut.",
          what_went_wrong: "Tooling war anfangs unzureichend — CRM-Integration dauerte 3 Wochen.",
          recommendations: "Tooling und Prozesse VOR Team-Aufbau definieren.",
        }] : []),
      ].filter(l => l.decision_id);
      if (lessons.length > 0) await supabase.from("lessons_learned").insert(lessons);
    }

    // 6. Strategic goals
    const currentYear = now.getFullYear();
    await supabase.from("strategic_goals").insert([
      {
        title: "ARR auf €2M steigern", description: "Annual Recurring Revenue Ziel für das Geschäftsjahr.",
        goal_type: "okr", target_value: 2000000, current_value: 1350000, unit: "€",
        year: currentYear, quarter: "Q4", status: "active", created_by: userId, team_id: teamId,
      },
      {
        title: "Ø Entscheidungszeit unter 5 Tage", description: "Durchschnittliche Zeit von Draft bis Implementierung.",
        goal_type: "kpi", target_value: 5, current_value: 7.2, unit: "Tage",
        year: currentYear, quarter: "Q2", status: "active", created_by: userId, team_id: teamId,
      },
      {
        title: "NPS über 60", description: "Net Promoter Score für Enterprise-Kunden.",
        goal_type: "kpi", target_value: 60, current_value: 67, unit: "Score",
        year: currentYear, quarter: "Q2", status: "active", created_by: userId, team_id: teamId,
      },
    ]);

    // 7. Audit logs for key decisions
    if (insertedDecisions && insertedDecisions.length >= 4) {
      const auditLogs = [
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "created", created_at: daysAgo(14) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "draft", new_value: "proposed", created_at: daysAgo(12) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "proposed", new_value: "review", created_at: daysAgo(8) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "escalated", field_name: "escalation_level", old_value: "0", new_value: "1", created_at: daysAgo(1) },
        { decision_id: insertedDecisions[3].id, user_id: userId, action: "created", created_at: daysAgo(30) },
        { decision_id: insertedDecisions[3].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "review", new_value: "approved", created_at: daysAgo(15) },
        { decision_id: insertedDecisions[3].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "approved", new_value: "implemented", created_at: daysAgo(3) },
      ];
      await supabase.from("audit_logs").insert(auditLogs);
    }

    // 8. Reviews for decisions in review/approved
    if (insertedDecisions) {
      const reviewDec = insertedDecisions.find(d => d.status === "review");
      const approvedDec = insertedDecisions.find(d => d.status === "approved");
      const reviews = [];
      if (reviewDec) {
        reviews.push({ decision_id: reviewDec.id, reviewer_id: userId, step_order: 1, status: "review" as const, feedback: null });
      }
      if (approvedDec) {
        reviews.push({ decision_id: approvedDec.id, reviewer_id: userId, step_order: 1, status: "approved" as const, feedback: "Budget-Verteilung ist schlüssig. Freigabe erteilt.", reviewed_at: daysAgo(2) });
      }
      if (reviews.length > 0) await supabase.from("decision_reviews").insert(reviews);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Demo-Daten erstellt",
      created: {
        team: 1, decisions: insertedDecisions?.length || 0, tasks: 9, risks: 2,
        lessons: implementedDecs.length, goals: 3, auditLogs: 7, reviews: 2,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

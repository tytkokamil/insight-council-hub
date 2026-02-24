import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // If user already has data, clean it first so demo can be re-loaded
    const { count } = await supabase.from("decisions").select("id", { count: "exact", head: true }).eq("created_by", userId);
    if ((count || 0) > 0) {
      // Delete existing user data before seeding
      const { data: existingDecs } = await supabase.from("decisions").select("id").eq("created_by", userId);
      const decIds = (existingDecs || []).map((d: any) => d.id);
      if (decIds.length > 0) {
        await supabase.from("decision_dependencies").delete().or(`source_decision_id.in.(${decIds.join(",")}),target_decision_id.in.(${decIds.join(",")})`);
        await supabase.from("decision_reviews").delete().in("decision_id", decIds);
        await supabase.from("comments").delete().in("decision_id", decIds);
        await supabase.from("decision_votes").delete().in("decision_id", decIds);
        await supabase.from("decision_shares").delete().in("decision_id", decIds);
        await supabase.from("audit_logs").delete().in("decision_id", decIds);
        await supabase.from("decision_tags").delete().in("decision_id", decIds);
        await supabase.from("decision_versions").delete().in("decision_id", decIds);
        await supabase.from("stakeholder_positions").delete().in("decision_id", decIds);
        await supabase.from("decision_goal_links").delete().in("decision_id", decIds);
        await supabase.from("lessons_learned").delete().in("decision_id", decIds);
        await supabase.from("decision_scenarios").delete().in("decision_id", decIds);
        await supabase.from("risk_decision_links").delete().in("decision_id", decIds);
        await supabase.from("decision_watchlist").delete().in("decision_id", decIds);
      }
      const { data: existingTasks } = await supabase.from("tasks").select("id").eq("created_by", userId);
      const taskIds = (existingTasks || []).map((t: any) => t.id);
      if (taskIds.length > 0) {
        await supabase.from("risk_task_links").delete().in("task_id", taskIds);
        await supabase.from("decision_dependencies").delete().or(`source_task_id.in.(${taskIds.join(",")}),target_task_id.in.(${taskIds.join(",")})`);
      }
      await supabase.from("tasks").delete().eq("created_by", userId);
      await supabase.from("decisions").delete().eq("created_by", userId);
      await supabase.from("risks").delete().eq("created_by", userId);
      await supabase.from("strategic_goals").delete().eq("created_by", userId);
      const { data: existingTeams } = await supabase.from("teams").select("id").eq("created_by", userId);
      const teamIds = (existingTeams || []).map((t: any) => t.id);
      if (teamIds.length > 0) {
        await supabase.from("team_messages").delete().in("team_id", teamIds);
        await supabase.from("team_chat_reads").delete().in("team_id", teamIds);
        await supabase.from("team_invitations").delete().in("team_id", teamIds);
        await supabase.from("team_members").delete().in("team_id", teamIds);
        await supabase.from("automation_rules").delete().in("team_id", teamIds);
        await supabase.from("teams").delete().in("id", teamIds);
      }
    }

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueIn = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
    const overdue = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];

    // ── 1. Teams ──
    const teams = [
      { name: "Produktteam", description: "Cross-funktionales Produktteam für Plattform-Entwicklung", created_by: userId, hourly_rate: 85 },
      { name: "Marketing & Growth", description: "Wachstumsstrategie, Kampagnen und Content", created_by: userId, hourly_rate: 70 },
      { name: "Finance & Operations", description: "Budgetplanung, Controlling und operative Prozesse", created_by: userId, hourly_rate: 95 },
    ];
    const { data: insertedTeams } = await supabase.from("teams").insert(teams).select("id, name");
    const teamMap: Record<string, string> = {};
    insertedTeams?.forEach(t => { teamMap[t.name] = t.id; });

    for (const tid of Object.values(teamMap)) {
      await supabase.from("team_members").insert({ team_id: tid, user_id: userId, role: "lead" });
    }

    const prodTeam = teamMap["Produktteam"];
    const mktTeam = teamMap["Marketing & Growth"];
    const finTeam = teamMap["Finance & Operations"];

    // ── 2. 55 Decisions ──
    const decisions = [
      // === CURRENT PERIOD — Active & Recent ===
      // Critical / Review / Proposed
      { title: "Cloud-Migration der Legacy-Systeme", description: "Migration der On-Premise-Infrastruktur zu Cloud-nativem Setup. 12 Services, 3 Datenbanken.", status: "review", priority: "critical", category: "technical", due_date: overdue(2), created_at: daysAgo(14), team_id: prodTeam, created_by: userId, owner_id: userId, escalation_level: 1, last_escalated_at: daysAgo(1), ai_risk_score: 72, ai_impact_score: 85, cost_per_day: 2500, ai_risk_factors: ["Komplexe DB-Migration", "Downtime-Risiko", "Fehlende Cloud-Expertise"], ai_success_factors: ["Inkrementeller Rollout", "Parallelbetrieb", "Automatisierte Tests"], context: "Infrastrukturkosten steigen 15%/Quartal." },
      { title: "Q2 Marketing-Budget Allokation", description: "Verteilung €180k Q2-Budget auf Performance Marketing, Content und Events.", status: "approved", priority: "high", category: "budget", due_date: dueIn(5), created_at: daysAgo(10), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 25, ai_impact_score: 60, cost_per_day: 800, ai_risk_factors: ["ROI von Events schwer messbar"], ai_success_factors: ["Klare KPI-Zuordnung", "Wöchentliches Budget-Review"] },
      { title: "Senior Developer Hiring Pipeline", description: "Recruiting-Strategie: Interne Beförderung vs. Headhunter vs. Freelancer.", status: "proposed", priority: "high", category: "hr", due_date: dueIn(14), created_at: daysAgo(5), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 40, ai_impact_score: 70, cost_per_day: 1200 },
      { title: "Vendor Lock-in Bewertung AWS", description: "Risikobewertung AWS-Abhängigkeit. Multi-Cloud vs. Single-Cloud Strategie.", status: "review", priority: "medium", category: "technical", due_date: dueIn(10), created_at: daysAgo(8), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 55, ai_impact_score: 65 },
      { title: "Datenschutz-Folgenabschätzung KI-Module", description: "DPIA für alle KI-gestützten Features gemäß Art. 35 DSGVO.", status: "proposed", priority: "critical", category: "operational", due_date: dueIn(7), created_at: daysAgo(3), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 60, ai_impact_score: 80 },
      { title: "Remote Work Policy Update", description: "3 Tage Home-Office, 2 Tage Office. Auswirkung auf Produktivität und Kultur.", status: "draft", priority: "medium", category: "operational", due_date: dueIn(21), created_at: daysAgo(2), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "Feature-Flag-Architektur für Rollouts", description: "Schrittweise Feature-Releases mit Flag-basierter Steuerung.", status: "draft", priority: "medium", category: "technical", due_date: dueIn(18), created_at: daysAgo(1), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "Partner-Programm Konzept", description: "Reseller- und Integrations-Partnerprogramm für indirekte Vertriebskanäle.", status: "proposed", priority: "high", category: "strategic", due_date: dueIn(30), created_at: daysAgo(4), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "Content-Strategie Q2/Q3", description: "Blog, Whitepaper und Case Studies für Thought Leadership.", status: "approved", priority: "medium", category: "marketing", due_date: dueIn(12), created_at: daysAgo(7), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "SOC 2 Type II Zertifizierung", description: "Anstreben der SOC 2 Zertifizierung für Enterprise-Kunden.", status: "proposed", priority: "critical", category: "operational", due_date: dueIn(60), created_at: daysAgo(6), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 45, ai_impact_score: 90 },
      { title: "Mobile App (PWA) Evaluierung", description: "Bewertung Progressive Web App vs. Native App für mobilen Zugriff.", status: "draft", priority: "low", category: "technical", due_date: dueIn(45), created_at: daysAgo(1), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 25, ai_impact_score: 40 },
      { title: "Internationalisierung Expansion UK", description: "Go-to-Market-Strategie für den britischen Markt.", status: "draft", priority: "medium", category: "strategic", due_date: dueIn(90), created_at: daysAgo(2), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 50, ai_impact_score: 85 },
      
      // === RECENTLY IMPLEMENTED — Good outcomes ===
      { title: "Pricing-Modell für Enterprise-Kunden", description: "Tiered-Pricing mit Volumenrabatten und jährlicher Abrechnung.", status: "implemented", priority: "critical", category: "strategic", created_at: daysAgo(30), implemented_at: daysAgo(3), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 55, ai_impact_score: 95, outcome_type: "successful", outcome: "Revenue pro Enterprise-Kunde +32% in 30 Tagen.", actual_impact_score: 90 },
      { title: "API Rate-Limiting Strategie", description: "Rate-Limiting für öffentliche API-Endpunkte.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(20), implemented_at: daysAgo(8), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 30, ai_impact_score: 65, outcome_type: "successful", outcome: "API-Stabilität 99.8%. Keine Ausfälle seit Implementierung.", actual_impact_score: 75 },
      { title: "Customer Success Team Aufbau", description: "Dediziertes CS-Team mit 3 FTEs für Enterprise-Kunden.", status: "implemented", priority: "high", category: "hr", created_at: daysAgo(45), implemented_at: daysAgo(12), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 35, ai_impact_score: 80, outcome_type: "successful", outcome: "Churn-Rate -22%. NPS von 42 auf 67.", actual_impact_score: 85 },
      { title: "CI/CD Pipeline Modernisierung", description: "Migration von Jenkins zu GitHub Actions mit parallelen Test-Suites.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(35), implemented_at: daysAgo(15), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "Deploy-Zeit von 45min auf 8min reduziert.", actual_impact_score: 70 },
      { title: "Onboarding-Flow Redesign", description: "Guided Tour, Checkliste und Demo-Daten für neue Nutzer.", status: "implemented", priority: "high", category: "product", created_at: daysAgo(25), implemented_at: daysAgo(10), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 70, outcome_type: "successful", outcome: "Activation Rate von 35% auf 58% gestiegen.", actual_impact_score: 80 },
      { title: "DSGVO-Audit Q1", description: "Vollständiges Audit aller Datenverarbeitungsprozesse.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(40), implemented_at: daysAgo(18), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Audit bestanden. 3 Minor Findings behoben.", actual_impact_score: 80 },
      { title: "Design System v2", description: "Einheitliches Design System mit Token-basiertem Theming.", status: "implemented", priority: "medium", category: "technical", created_at: daysAgo(50), implemented_at: daysAgo(22), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 55, outcome_type: "successful", outcome: "UI-Konsistenz +40%. Entwicklungszeit für neue Features -25%.", actual_impact_score: 60 },
      { title: "SEO-Strategie Landing Page", description: "On-Page SEO, technisches SEO und Content-Optimierung.", status: "implemented", priority: "medium", category: "marketing", created_at: daysAgo(38), implemented_at: daysAgo(20), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 50, outcome_type: "successful", outcome: "Organischer Traffic +65% in 4 Wochen.", actual_impact_score: 55 },

      // === PREVIOUS PERIOD (90-180 days) — Mixed outcomes ===
      { title: "Datenbank-Refactoring (Legacy)", description: "Umstellung monolithische DB auf Microservices.", status: "implemented", priority: "critical", category: "technical", created_at: daysAgo(160), implemented_at: daysAgo(110), team_id: prodTeam, created_by: userId, owner_id: userId, escalation_level: 2, ai_risk_score: 80, ai_impact_score: 75, outcome_type: "partial", outcome: "Migration abgeschlossen, aber 2 Wochen Verzögerung.", actual_impact_score: 50 },
      { title: "Q1 Werbekampagne", description: "Multi-Channel Kampagne €200k Budget.", status: "implemented", priority: "high", category: "marketing", created_at: daysAgo(150), implemented_at: daysAgo(100), team_id: mktTeam, created_by: userId, owner_id: userId, escalation_level: 1, ai_risk_score: 45, ai_impact_score: 70, outcome_type: "partial", outcome: "CAC 25% über Ziel. Organischer Traffic +40%.", actual_impact_score: 55 },
      { title: "Office-Standort Expansion München", description: "Zweiter Bürostandort in München.", status: "rejected", priority: "medium", category: "strategic", created_at: daysAgo(140), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 65, ai_impact_score: 50 },
      { title: "Compliance-Audit ISO 27001", description: "Vorbereitung auf ISO 27001 Zertifizierung.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(120), implemented_at: daysAgo(92), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Zertifizierung erhalten. Zero Non-Conformities.", actual_impact_score: 85 },
      { title: "Support-Ticketing System", description: "Einführung Zendesk vs. Intercom vs. Eigenentwicklung.", status: "implemented", priority: "high", category: "operational", created_at: daysAgo(130), implemented_at: daysAgo(105), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 25, ai_impact_score: 55, outcome_type: "successful", outcome: "Ø Antwortzeit von 4h auf 45min.", actual_impact_score: 65 },
      { title: "Performance-Bonus-Modell", description: "Variables Vergütungsmodell für alle Abteilungen.", status: "implemented", priority: "high", category: "hr", created_at: daysAgo(135), implemented_at: daysAgo(98), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 40, ai_impact_score: 65, outcome_type: "partial", outcome: "Akzeptanz 70%. Engineering bevorzugt Equity.", actual_impact_score: 45 },
      { title: "Monitoring & Alerting Stack", description: "Datadog vs. Grafana Cloud für Observability.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(125), implemented_at: daysAgo(100), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "MTTR von 2h auf 15min. Proaktive Alerts verhindern 80% der Incidents.", actual_impact_score: 70 },
      { title: "Freelancer vs. Festanstellung Backend", description: "Personalstrategie für Backend-Kapazitäten.", status: "implemented", priority: "medium", category: "hr", created_at: daysAgo(145), implemented_at: daysAgo(115), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 35, ai_impact_score: 50, outcome_type: "successful", outcome: "Mix-Modell: 2 FTE + 1 Freelancer. Velocity +40%.", actual_impact_score: 55 },

      // === More recent active decisions for variety ===
      { title: "A/B Testing Framework", description: "Implementierung systematischer A/B Tests für Conversion-Optimierung.", status: "approved", priority: "medium", category: "technical", due_date: dueIn(15), created_at: daysAgo(6), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 55 },
      { title: "Kundenfeedback-Systematik", description: "Strukturiertes Feedback-System: NPS, CSAT, Feature Requests.", status: "proposed", priority: "medium", category: "product", due_date: dueIn(20), created_at: daysAgo(4), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "Data Warehouse Evaluierung", description: "BigQuery vs. Snowflake vs. Redshift für Analytics-Pipeline.", status: "draft", priority: "medium", category: "technical", due_date: dueIn(35), created_at: daysAgo(3), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 30, ai_impact_score: 60 },
      { title: "Slack-Integration für Notifications", description: "Entscheidungs-Updates und Quick-Actions in Slack.", status: "proposed", priority: "medium", category: "technical", due_date: dueIn(25), created_at: daysAgo(5), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "Employer Branding Kampagne", description: "LinkedIn + Glassdoor Präsenz für Recruiting.", status: "approved", priority: "low", category: "hr", due_date: dueIn(28), created_at: daysAgo(9), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 5, ai_impact_score: 35 },
      { title: "SLA-Framework für Enterprise", description: "Definierte SLAs mit Uptime-Garantien und Response-Times.", status: "review", priority: "high", category: "operational", due_date: dueIn(8), created_at: daysAgo(7), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 30, ai_impact_score: 75 },
      { title: "Backup & Disaster Recovery Plan", description: "RTO/RPO Definition und automatisierte Backup-Strategie.", status: "approved", priority: "critical", category: "technical", due_date: dueIn(10), created_at: daysAgo(8), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 60, ai_impact_score: 85 },
      { title: "Legal Entity Struktur", description: "GmbH vs. UG vs. Holding-Struktur für Wachstumsphase.", status: "implemented", priority: "critical", category: "strategic", created_at: daysAgo(60), implemented_at: daysAgo(30), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 50, ai_impact_score: 80, outcome_type: "successful", outcome: "GmbH gegründet. Steuerliche Optimierung spart €45k/Jahr.", actual_impact_score: 75 },
      { title: "Accessibility Audit (WCAG 2.1)", description: "Barrierefreiheit der Plattform gemäß WCAG 2.1 AA.", status: "proposed", priority: "medium", category: "technical", due_date: dueIn(40), created_at: daysAgo(3), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 50 },
      { title: "Investor-Reporting Dashboard", description: "Quartalsberichte und KPI-Tracking für Investoren.", status: "draft", priority: "medium", category: "budget", due_date: dueIn(25), created_at: daysAgo(2), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 40 },
      { title: "Webinar-Serie Launch", description: "Monatliche Webinare zu Decision Intelligence Best Practices.", status: "approved", priority: "low", category: "marketing", due_date: dueIn(15), created_at: daysAgo(6), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 5, ai_impact_score: 35 },
      { title: "Security Penetration Test", description: "Externer Pentest durch zertifizierten Anbieter.", status: "review", priority: "critical", category: "operational", due_date: dueIn(5), created_at: daysAgo(10), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 55, ai_impact_score: 85 },
      { title: "API-Dokumentation (OpenAPI)", description: "Vollständige OpenAPI 3.0 Spezifikation für Developer Portal.", status: "proposed", priority: "medium", category: "technical", due_date: dueIn(20), created_at: daysAgo(4), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 55 },
      { title: "Customer Advisory Board", description: "Beirat aus 5-8 Enterprise-Kunden für Produktstrategie.", status: "draft", priority: "medium", category: "strategic", due_date: dueIn(45), created_at: daysAgo(2), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 15, ai_impact_score: 60 },
      { title: "Kosten-Optimierung Cloud Infrastructure", description: "Reserved Instances, Spot-Instances und Auto-Scaling.", status: "approved", priority: "high", category: "budget", due_date: dueIn(12), created_at: daysAgo(7), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 20, ai_impact_score: 65 },
      { title: "Knowledge Base Launch", description: "Self-Service Help Center mit Artikeln und Video-Tutorials.", status: "implemented", priority: "medium", category: "product", created_at: daysAgo(28), implemented_at: daysAgo(7), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 50, outcome_type: "successful", outcome: "Support-Tickets -30% in 2 Wochen.", actual_impact_score: 55 },
      { title: "OKR Framework Einführung", description: "Objectives & Key Results als Steuerungsrahmen für alle Teams.", status: "implemented", priority: "high", category: "strategic", created_at: daysAgo(55), implemented_at: daysAgo(25), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 25, ai_impact_score: 70, outcome_type: "successful", outcome: "Team-Alignment deutlich verbessert. Cross-Team Projekte +35%.", actual_impact_score: 65 },
      { title: "Incident Response Playbook", description: "Standardisierte Prozesse für Security Incidents und Outages.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(42), implemented_at: daysAgo(20), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 40, ai_impact_score: 80, outcome_type: "successful", outcome: "MTTR bei Incidents von 4h auf 30min.", actual_impact_score: 75 },
      { title: "Diversity & Inclusion Initiative", description: "D&I Programm mit konkreten Zielen und Maßnahmen.", status: "proposed", priority: "medium", category: "hr", due_date: dueIn(35), created_at: daysAgo(3), team_id: finTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 45 },
      { title: "Competitive Intelligence Setup", description: "Systematisches Monitoring von 5 Hauptwettbewerbern.", status: "approved", priority: "medium", category: "strategic", due_date: dueIn(18), created_at: daysAgo(5), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "Database Encryption at Rest", description: "Verschlüsselung aller Datenbanken mit AES-256.", status: "implemented", priority: "critical", category: "technical", created_at: daysAgo(48), implemented_at: daysAgo(28), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 45, ai_impact_score: 85, outcome_type: "successful", outcome: "Compliance-Anforderung erfüllt. Keine Performance-Einbußen.", actual_impact_score: 80 },
      { title: "Event Sponsoring Strategie", description: "Auswahl und Budget für Tech-Konferenzen 2026.", status: "draft", priority: "low", category: "marketing", due_date: dueIn(50), created_at: daysAgo(1), team_id: mktTeam, created_by: userId, owner_id: userId, ai_risk_score: 10, ai_impact_score: 30 },
      { title: "Technical Debt Sprint", description: "Dedizierter Sprint für kritische technische Schulden.", status: "review", priority: "high", category: "technical", due_date: dueIn(3), created_at: daysAgo(9), team_id: prodTeam, created_by: userId, owner_id: userId, ai_risk_score: 30, ai_impact_score: 60, cost_per_day: 1800 },
    ];

    const { data: insertedDecisions } = await supabase.from("decisions").insert(decisions as any[]).select("id, title, status, created_at");

    // ── 3. Tasks (20+) ──
    const tasks = [
      { title: "Cloud-Provider Vergleichsmatrix erstellen", status: "in_progress", priority: "high", category: "technical", due_date: dueIn(3), created_by: userId, team_id: prodTeam },
      { title: "Migrationstimeline erstellen", status: "open", priority: "critical", category: "technical", due_date: dueIn(7), created_by: userId, team_id: prodTeam },
      { title: "Budget-Proposal Q2 finalisieren", status: "done", priority: "high", category: "budget", due_date: overdue(1), created_by: userId, team_id: finTeam, completed_at: daysAgo(1) },
      { title: "Stellenausschreibung Senior Dev", status: "open", priority: "medium", category: "hr", due_date: dueIn(10), created_by: userId, team_id: prodTeam },
      { title: "Pricing-Tabelle für Sales erstellen", status: "done", priority: "high", category: "strategic", created_by: userId, team_id: finTeam, completed_at: daysAgo(5) },
      { title: "Remote Work Feedback-Umfrage", status: "backlog", priority: "low", category: "operational", created_by: userId, team_id: finTeam },
      { title: "API-Dokumentation v2", status: "done", priority: "medium", category: "technical", created_by: userId, team_id: prodTeam, completed_at: daysAgo(9) },
      { title: "CS-Team Onboarding-Playbook", status: "done", priority: "high", category: "hr", created_by: userId, team_id: mktTeam, completed_at: daysAgo(14) },
      { title: "Datenschutz-Folgenabschätzung erstellen", status: "done", priority: "critical", category: "operational", created_by: userId, team_id: finTeam, completed_at: daysAgo(19) },
      { title: "Pentest-Anbieter evaluieren", status: "in_progress", priority: "critical", category: "operational", due_date: dueIn(3), created_by: userId, team_id: prodTeam },
      { title: "Content-Kalender Q2 erstellen", status: "open", priority: "medium", category: "marketing", due_date: dueIn(8), created_by: userId, team_id: mktTeam },
      { title: "SLA-Dokument für Enterprise", status: "in_progress", priority: "high", category: "operational", due_date: dueIn(5), created_by: userId, team_id: finTeam },
      { title: "Backup-Skripte automatisieren", status: "open", priority: "high", category: "technical", due_date: dueIn(6), created_by: userId, team_id: prodTeam },
      { title: "Competitor Feature Matrix", status: "done", priority: "medium", category: "strategic", created_by: userId, team_id: mktTeam, completed_at: daysAgo(3) },
      { title: "Webinar-Inhalte vorbereiten", status: "open", priority: "low", category: "marketing", due_date: dueIn(12), created_by: userId, team_id: mktTeam },
      { title: "Cost-Optimization Report AWS", status: "open", priority: "high", category: "budget", due_date: dueIn(10), created_by: userId, team_id: finTeam },
      { title: "WCAG Audit Checkliste", status: "backlog", priority: "medium", category: "technical", created_by: userId, team_id: prodTeam },
      { title: "GitHub Actions Pipeline konfigurieren", status: "done", priority: "high", category: "technical", created_by: userId, team_id: prodTeam, completed_at: daysAgo(16) },
      { title: "NPS-Umfrage Q1 auswerten", status: "done", priority: "medium", category: "product", created_by: userId, team_id: mktTeam, completed_at: daysAgo(8) },
      { title: "Incident Response Runbook testen", status: "done", priority: "critical", category: "operational", created_by: userId, team_id: prodTeam, completed_at: daysAgo(21) },
    ];
    await supabase.from("tasks").insert(tasks as any[]);

    // ── 4. Risks (6) ──
    await supabase.from("risks").insert([
      { title: "Datenverlust bei Cloud-Migration", description: "Partieller Datenverlust während Migrationsphase.", likelihood: 3, impact: 5, risk_score: 15, status: "open", created_by: userId, team_id: prodTeam, mitigation_plan: "Inkrementelle Migration mit Rollback und 3x Backup." },
      { title: "Key-Person Dependency Engineering", description: "Kritisches Wissen bei 2 Senior Engineers.", likelihood: 4, impact: 4, risk_score: 16, status: "open", created_by: userId, team_id: prodTeam, mitigation_plan: "Knowledge-Sharing und Dokumentation der Kernarchitektur." },
      { title: "Vendor Lock-in AWS", description: "Hohe Abhängigkeit von AWS-spezifischen Services.", likelihood: 3, impact: 4, risk_score: 12, status: "open", created_by: userId, team_id: prodTeam, mitigation_plan: "Multi-Cloud Abstraktion und Terraform-basiertes IaC." },
      { title: "DSGVO-Verstoß durch KI-Module", description: "Unbeabsichtigte Verarbeitung personenbezogener Daten.", likelihood: 2, impact: 5, risk_score: 10, status: "open", created_by: userId, team_id: finTeam, mitigation_plan: "DPIA durchführen, Anonymisierung implementieren." },
      { title: "Churn-Anstieg bei Pricing-Umstellung", description: "Kunden könnten bei Preiserhöhung abwandern.", likelihood: 3, impact: 3, risk_score: 9, status: "mitigated", created_by: userId, team_id: mktTeam, mitigation_plan: "Bestandskundenpreise 12 Monate grandfathered." },
      { title: "Burnout-Risiko Kernteam", description: "Hohe Arbeitsbelastung in Wachstumsphase.", likelihood: 4, impact: 3, risk_score: 12, status: "open", created_by: userId, team_id: finTeam, mitigation_plan: "Hiring beschleunigen, Workload-Monitoring einführen." },
    ]);

    // ── 5. Lessons Learned ──
    const implementedDecs = insertedDecisions?.filter(d => d.status === "implemented") || [];
    const lessons = implementedDecs.slice(0, 8).map((d, i) => {
      const lessonsData = [
        { key_takeaway: "Tiered Pricing funktioniert am besten mit klaren Feature-Grenzen.", what_went_well: "Schnelle Adoption. Revenue-Impact höher als prognostiziert.", what_went_wrong: "Initiale Kommunikation zu technisch. Sales brauchte Training.", recommendations: "Sales-Enablement parallel zum Pricing erstellen." },
        { key_takeaway: "Rate-Limiting früh einführen — nicht erst nach dem ersten Ausfall.", what_went_well: "Schnelle Implementierung dank API-Gateway.", what_went_wrong: "Interne Services anfangs auch betroffen.", recommendations: "Interne und externe Endpunkte getrennt konfigurieren." },
        { key_takeaway: "CS-Team braucht klar definierte Eskalationspfade vom ersten Tag.", what_went_well: "Churn-Reduktion übertraf Erwartungen.", what_went_wrong: "CRM-Integration dauerte 3 Wochen.", recommendations: "Tooling VOR Team-Aufbau definieren." },
        { key_takeaway: "CI/CD Modernisierung zahlt sich sofort aus.", what_went_well: "Team-Produktivität spürbar gestiegen.", what_went_wrong: "Legacy-Tests brauchten Anpassung.", recommendations: "Test-Migration als eigenes Workstream planen." },
        { key_takeaway: "Gutes Onboarding ist der stärkste Growth-Hebel.", what_went_well: "Activation Rate fast verdoppelt.", what_went_wrong: "Demo-Daten anfangs nicht realistisch genug.", recommendations: "Demo-Daten regelmäßig aktualisieren." },
        { key_takeaway: "DSGVO-Compliance ist kein Projekt sondern ein Prozess.", what_went_well: "Audit beim ersten Versuch bestanden.", what_went_wrong: "Dokumentation war aufwendiger als geplant.", recommendations: "Kontinuierliche Compliance statt Big-Bang-Audits." },
        { key_takeaway: "Design Systems sparen langfristig enorm Zeit.", what_went_well: "Konsistenz sofort sichtbar.", what_went_wrong: "Migration bestehender Komponenten dauerte lange.", recommendations: "Neue Features sofort im Design System bauen." },
        { key_takeaway: "SEO braucht 4-6 Wochen bis Ergebnisse sichtbar sind.", what_went_well: "Traffic-Wachstum übertraf Erwartungen.", what_went_wrong: "Initiale Keyword-Recherche war zu breit.", recommendations: "Mit Long-Tail Keywords starten, dann erweitern." },
      ];
      return { decision_id: d.id, created_by: userId, ...lessonsData[i % lessonsData.length] };
    });
    if (lessons.length > 0) await supabase.from("lessons_learned").insert(lessons);

    // ── 6. Strategic Goals ──
    const currentYear = now.getFullYear();
    await supabase.from("strategic_goals").insert([
      { title: "ARR auf €2M steigern", description: "Annual Recurring Revenue Ziel.", goal_type: "okr", target_value: 2000000, current_value: 1350000, unit: "€", year: currentYear, quarter: "Q4", status: "active", created_by: userId, team_id: finTeam },
      { title: "Ø Entscheidungszeit unter 5 Tage", description: "Durchschnittliche Zeit Draft → Implementierung.", goal_type: "kpi", target_value: 5, current_value: 7.2, unit: "Tage", year: currentYear, quarter: "Q2", status: "active", created_by: userId, team_id: prodTeam },
      { title: "NPS über 60", description: "Net Promoter Score für Enterprise-Kunden.", goal_type: "kpi", target_value: 60, current_value: 67, unit: "Score", year: currentYear, quarter: "Q2", status: "active", created_by: userId, team_id: mktTeam },
      { title: "50 Enterprise-Kunden", description: "Anzahl zahlender Enterprise-Accounts.", goal_type: "okr", target_value: 50, current_value: 28, unit: "Kunden", year: currentYear, quarter: "Q4", status: "active", created_by: userId, team_id: mktTeam },
      { title: "99.9% Uptime", description: "Plattform-Verfügbarkeit.", goal_type: "kpi", target_value: 99.9, current_value: 99.7, unit: "%", year: currentYear, quarter: "Q2", status: "active", created_by: userId, team_id: prodTeam },
    ]);

    // ── 7. Audit Logs ──
    if (insertedDecisions && insertedDecisions.length >= 10) {
      const auditLogs = [
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "created", created_at: daysAgo(14) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "draft", new_value: "proposed", created_at: daysAgo(12) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "status_changed", field_name: "status", old_value: "proposed", new_value: "review", created_at: daysAgo(8) },
        { decision_id: insertedDecisions[0].id, user_id: userId, action: "escalated", field_name: "escalation_level", old_value: "0", new_value: "1", created_at: daysAgo(1) },
        ...insertedDecisions.slice(12, 20).flatMap(d => [
          { decision_id: d.id, user_id: userId, action: "created", created_at: d.created_at },
          { decision_id: d.id, user_id: userId, action: "status_changed", field_name: "status", old_value: "draft", new_value: "implemented", created_at: daysAgo(5) },
        ]),
      ];
      await supabase.from("audit_logs").insert(auditLogs);
    }

    // ── 8. Reviews ──
    if (insertedDecisions) {
      const reviews = insertedDecisions
        .filter(d => d.status === "review" || d.status === "approved")
        .slice(0, 6)
        .map((d, i) => ({
          decision_id: d.id,
          reviewer_id: userId,
          step_order: 1,
          status: d.status === "approved" ? "approved" : "review",
          feedback: d.status === "approved" ? "Freigabe erteilt." : null,
          reviewed_at: d.status === "approved" ? daysAgo(2) : null,
        }));
      if (reviews.length > 0) await supabase.from("decision_reviews").insert(reviews as any[]);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Demo-Daten erstellt — 55 Entscheidungen, 20 Tasks, 6 Risiken, 5 Ziele, 3 Teams",
      created: {
        teams: 3,
        decisions: insertedDecisions?.length || 0,
        tasks: 20,
        risks: 6,
        lessons: lessons.length,
        goals: 5,
        auditLogs: "15+",
        reviews: "6",
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

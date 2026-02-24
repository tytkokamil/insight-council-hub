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

    // ── Clean existing data first ──
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
    const oldTeamIds = (existingTeams || []).map((t: any) => t.id);
    if (oldTeamIds.length > 0) {
      await supabase.from("team_messages").delete().in("team_id", oldTeamIds);
      await supabase.from("team_chat_reads").delete().in("team_id", oldTeamIds);
      await supabase.from("team_invitations").delete().in("team_id", oldTeamIds);
      await supabase.from("team_members").delete().in("team_id", oldTeamIds);
      await supabase.from("automation_rules").delete().in("team_id", oldTeamIds);
      await supabase.from("teams").delete().in("id", oldTeamIds);
    }

    // ── Helpers ──
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueIn = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
    const overdue = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split("T")[0];
    const u = userId;
    const base = { created_by: u, owner_id: u };

    // ── 1. Teams ──
    const teams = [
      { name: "Produktteam", description: "Cross-funktionales Produktteam für Plattform-Entwicklung", created_by: u, hourly_rate: 85 },
      { name: "Marketing & Growth", description: "Wachstumsstrategie, Kampagnen und Content", created_by: u, hourly_rate: 70 },
      { name: "Finance & Operations", description: "Budgetplanung, Controlling und operative Prozesse", created_by: u, hourly_rate: 95 },
    ];
    const { data: insertedTeams } = await supabase.from("teams").insert(teams).select("id, name");
    const teamMap: Record<string, string> = {};
    insertedTeams?.forEach(t => { teamMap[t.name] = t.id; });

    for (const tid of Object.values(teamMap)) {
      await supabase.from("team_members").insert({ team_id: tid, user_id: u, role: "lead" });
    }

    const prod = teamMap["Produktteam"];
    const mkt = teamMap["Marketing & Growth"];
    const fin = teamMap["Finance & Operations"];

    // ── 2. Decisions — Mix aus Persönlich (null) + Team ──
    const decisions = [
      // ═══ PERSÖNLICHE Entscheidungen (team_id: null) ═══
      // Aktiv
      { title: "Weiterbildung: MBA vs. Zertifikat", description: "Persönliche Karriereentwicklung: Vollzeit-MBA oder berufsbegleitendes Product-Management-Zertifikat.", status: "draft", priority: "high", category: "hr", due_date: dueIn(30), created_at: daysAgo(3), ...base, ai_risk_score: 20, ai_impact_score: 70 },
      { title: "Home-Office Setup Upgrade", description: "Ergonomischer Arbeitsplatz: Standing Desk, Monitor-Arm, Noise-Cancelling Headset.", status: "approved", priority: "medium", category: "operational", due_date: dueIn(14), created_at: daysAgo(5), ...base, ai_risk_score: 5, ai_impact_score: 35 },
      { title: "Persönliches OKR-Framework", description: "Quartals-Ziele für persönliche Produktivität und Wachstum definieren.", status: "proposed", priority: "medium", category: "strategic", due_date: dueIn(7), created_at: daysAgo(2), ...base, ai_risk_score: 5, ai_impact_score: 50 },
      { title: "Side-Project: SaaS-Idee validieren", description: "Marktrecherche und Landing Page für persönliches SaaS-Projekt.", status: "draft", priority: "low", category: "strategic", due_date: dueIn(60), created_at: daysAgo(1), ...base, ai_risk_score: 30, ai_impact_score: 45 },
      { title: "Konferenz-Teilnahme WebSummit 2026", description: "Teilnahme, Reiseplanung und Networking-Strategie.", status: "review", priority: "medium", category: "marketing", due_date: dueIn(45), created_at: daysAgo(4), ...base, ai_risk_score: 10, ai_impact_score: 40 },
      { title: "Mentoring-Programm starten", description: "Regelmäßiges Mentoring für 2 Junior-Kollegen aufsetzen.", status: "proposed", priority: "medium", category: "hr", due_date: dueIn(21), created_at: daysAgo(6), ...base, ai_risk_score: 5, ai_impact_score: 55 },
      { title: "Notfallplan persönliche Finanzen", description: "Rücklagen-Strategie, Versicherungs-Check und Investment-Plan.", status: "draft", priority: "high", category: "budget", due_date: dueIn(20), created_at: daysAgo(2), ...base, ai_risk_score: 15, ai_impact_score: 60 },
      // Implementiert
      { title: "Produktivitäts-Workflow optimiert", description: "GTD-System mit Notion + Kalender-Blocking eingeführt.", status: "implemented", priority: "medium", category: "operational", created_at: daysAgo(40), implemented_at: daysAgo(15), ...base, ai_risk_score: 5, ai_impact_score: 45, outcome_type: "successful", outcome: "Deep-Work-Stunden pro Woche von 8 auf 18 gestiegen.", actual_impact_score: 55 },
      { title: "Gesundheitsroutine etabliert", description: "Tägliche Bewegung, Schlaf-Tracking, Ernährungsplan.", status: "implemented", priority: "high", category: "operational", created_at: daysAgo(60), implemented_at: daysAgo(30), ...base, ai_risk_score: 5, ai_impact_score: 50, outcome_type: "successful", outcome: "Energielevel und Fokus deutlich verbessert.", actual_impact_score: 60 },
      { title: "Networking-Strategie LinkedIn", description: "Wöchentliches Posting, Kommentar-Routine, 3 Events/Monat.", status: "implemented", priority: "low", category: "marketing", created_at: daysAgo(50), implemented_at: daysAgo(20), ...base, ai_risk_score: 5, ai_impact_score: 35, outcome_type: "successful", outcome: "LinkedIn-Reichweite +300%. 4 Leads über Netzwerk.", actual_impact_score: 45 },
      { title: "Wissensmanagement Obsidian-Setup", description: "Second Brain mit Zettelkasten-Methode aufgebaut.", status: "implemented", priority: "medium", category: "technical", created_at: daysAgo(45), implemented_at: daysAgo(25), ...base, ai_risk_score: 5, ai_impact_score: 40, outcome_type: "successful", outcome: "Wissen schneller abrufbar. Entscheidungen besser fundiert.", actual_impact_score: 50 },
      { title: "Delegation Framework", description: "Klare Regeln definiert, welche Aufgaben delegiert werden.", status: "implemented", priority: "high", category: "operational", created_at: daysAgo(35), implemented_at: daysAgo(12), ...base, ai_risk_score: 10, ai_impact_score: 65, outcome_type: "successful", outcome: "20% mehr strategische Zeit pro Woche.", actual_impact_score: 60 },

      // ═══ TEAM-Entscheidungen ═══
      // Aktiv
      { title: "Cloud-Migration der Legacy-Systeme", description: "Migration der On-Premise-Infrastruktur zu Cloud-nativem Setup.", status: "review", priority: "critical", category: "technical", due_date: overdue(2), created_at: daysAgo(14), team_id: prod, ...base, escalation_level: 1, last_escalated_at: daysAgo(1), ai_risk_score: 72, ai_impact_score: 85, cost_per_day: 2500, ai_risk_factors: ["Komplexe DB-Migration", "Downtime-Risiko"], ai_success_factors: ["Inkrementeller Rollout", "Automatisierte Tests"], context: "Infrastrukturkosten steigen 15%/Quartal." },
      { title: "Q2 Marketing-Budget Allokation", description: "Verteilung €180k Q2-Budget auf Performance Marketing, Content und Events.", status: "approved", priority: "high", category: "budget", due_date: dueIn(5), created_at: daysAgo(10), team_id: mkt, ...base, ai_risk_score: 25, ai_impact_score: 60, cost_per_day: 800 },
      { title: "Senior Developer Hiring Pipeline", description: "Recruiting-Strategie: Interne Beförderung vs. Headhunter vs. Freelancer.", status: "proposed", priority: "high", category: "hr", due_date: dueIn(14), created_at: daysAgo(5), team_id: prod, ...base, ai_risk_score: 40, ai_impact_score: 70, cost_per_day: 1200 },
      { title: "Vendor Lock-in Bewertung AWS", description: "Risikobewertung AWS-Abhängigkeit. Multi-Cloud vs. Single-Cloud.", status: "review", priority: "medium", category: "technical", due_date: dueIn(10), created_at: daysAgo(8), team_id: prod, ...base, ai_risk_score: 55, ai_impact_score: 65 },
      { title: "Datenschutz-Folgenabschätzung KI-Module", description: "DPIA für alle KI-gestützten Features gemäß Art. 35 DSGVO.", status: "proposed", priority: "critical", category: "operational", due_date: dueIn(7), created_at: daysAgo(3), team_id: fin, ...base, ai_risk_score: 60, ai_impact_score: 80 },
      { title: "Remote Work Policy Update", description: "3 Tage Home-Office, 2 Tage Office. Auswirkung auf Produktivität.", status: "draft", priority: "medium", category: "operational", due_date: dueIn(21), created_at: daysAgo(2), team_id: fin, ...base, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "Feature-Flag-Architektur", description: "Schrittweise Feature-Releases mit Flag-basierter Steuerung.", status: "draft", priority: "medium", category: "technical", due_date: dueIn(18), created_at: daysAgo(1), team_id: prod, ...base, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "Partner-Programm Konzept", description: "Reseller- und Integrations-Partnerprogramm.", status: "proposed", priority: "high", category: "strategic", due_date: dueIn(30), created_at: daysAgo(4), team_id: mkt, ...base, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "Content-Strategie Q2/Q3", description: "Blog, Whitepaper und Case Studies.", status: "approved", priority: "medium", category: "marketing", due_date: dueIn(12), created_at: daysAgo(7), team_id: mkt, ...base, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "SOC 2 Type II Zertifizierung", description: "Zertifizierung für Enterprise-Kunden.", status: "proposed", priority: "critical", category: "operational", due_date: dueIn(60), created_at: daysAgo(6), team_id: fin, ...base, ai_risk_score: 45, ai_impact_score: 90 },
      { title: "A/B Testing Framework", description: "Systematische A/B Tests für Conversion-Optimierung.", status: "approved", priority: "medium", category: "technical", due_date: dueIn(15), created_at: daysAgo(6), team_id: prod, ...base, ai_risk_score: 15, ai_impact_score: 55 },
      { title: "SLA-Framework für Enterprise", description: "SLAs mit Uptime-Garantien und Response-Times.", status: "review", priority: "high", category: "operational", due_date: dueIn(8), created_at: daysAgo(7), team_id: fin, ...base, ai_risk_score: 30, ai_impact_score: 75 },
      { title: "Backup & Disaster Recovery Plan", description: "RTO/RPO Definition und automatisierte Backup-Strategie.", status: "approved", priority: "critical", category: "technical", due_date: dueIn(10), created_at: daysAgo(8), team_id: prod, ...base, ai_risk_score: 60, ai_impact_score: 85 },
      { title: "Security Penetration Test", description: "Externer Pentest durch zertifizierten Anbieter.", status: "review", priority: "critical", category: "operational", due_date: dueIn(5), created_at: daysAgo(10), team_id: prod, ...base, ai_risk_score: 55, ai_impact_score: 85 },
      { title: "Technical Debt Sprint", description: "Dedizierter Sprint für kritische technische Schulden.", status: "review", priority: "high", category: "technical", due_date: dueIn(3), created_at: daysAgo(9), team_id: prod, ...base, ai_risk_score: 30, ai_impact_score: 60, cost_per_day: 1800 },
      { title: "Kosten-Optimierung Cloud", description: "Reserved Instances, Spot-Instances und Auto-Scaling.", status: "approved", priority: "high", category: "budget", due_date: dueIn(12), created_at: daysAgo(7), team_id: fin, ...base, ai_risk_score: 20, ai_impact_score: 65 },

      // Implementiert (Team)
      { title: "Pricing-Modell für Enterprise", description: "Tiered-Pricing mit Volumenrabatten.", status: "implemented", priority: "critical", category: "strategic", created_at: daysAgo(30), implemented_at: daysAgo(3), team_id: fin, ...base, ai_risk_score: 55, ai_impact_score: 95, outcome_type: "successful", outcome: "Revenue pro Enterprise-Kunde +32%.", actual_impact_score: 90 },
      { title: "API Rate-Limiting Strategie", description: "Rate-Limiting für öffentliche API-Endpunkte.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(20), implemented_at: daysAgo(8), team_id: prod, ...base, ai_risk_score: 30, ai_impact_score: 65, outcome_type: "successful", outcome: "API-Stabilität 99.8%.", actual_impact_score: 75 },
      { title: "Customer Success Team Aufbau", description: "Dediziertes CS-Team mit 3 FTEs.", status: "implemented", priority: "high", category: "hr", created_at: daysAgo(45), implemented_at: daysAgo(12), team_id: mkt, ...base, ai_risk_score: 35, ai_impact_score: 80, outcome_type: "successful", outcome: "Churn-Rate -22%. NPS von 42 auf 67.", actual_impact_score: 85 },
      { title: "CI/CD Pipeline Modernisierung", description: "Migration von Jenkins zu GitHub Actions.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(35), implemented_at: daysAgo(15), team_id: prod, ...base, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "Deploy-Zeit von 45min auf 8min.", actual_impact_score: 70 },
      { title: "Onboarding-Flow Redesign", description: "Guided Tour und Checkliste für neue Nutzer.", status: "implemented", priority: "high", category: "product", created_at: daysAgo(25), implemented_at: daysAgo(10), team_id: prod, ...base, ai_risk_score: 15, ai_impact_score: 70, outcome_type: "successful", outcome: "Activation Rate von 35% auf 58%.", actual_impact_score: 80 },
      { title: "DSGVO-Audit Q1", description: "Vollständiges Audit aller Datenverarbeitungsprozesse.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(40), implemented_at: daysAgo(18), team_id: fin, ...base, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Audit bestanden. 3 Minor Findings behoben.", actual_impact_score: 80 },
      { title: "Design System v2", description: "Token-basiertes Theming und Komponenten-Bibliothek.", status: "implemented", priority: "medium", category: "technical", created_at: daysAgo(50), implemented_at: daysAgo(22), team_id: prod, ...base, ai_risk_score: 10, ai_impact_score: 55, outcome_type: "successful", outcome: "UI-Konsistenz +40%. Dev-Zeit -25%.", actual_impact_score: 60 },
      { title: "Compliance-Audit ISO 27001", description: "ISO 27001 Zertifizierung.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(120), implemented_at: daysAgo(92), team_id: fin, ...base, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Zertifizierung erhalten.", actual_impact_score: 85 },
      { title: "Monitoring & Alerting Stack", description: "Grafana Cloud für Observability.", status: "implemented", priority: "high", category: "technical", created_at: daysAgo(125), implemented_at: daysAgo(100), team_id: prod, ...base, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "MTTR von 2h auf 15min.", actual_impact_score: 70 },
      { title: "OKR Framework Einführung", description: "Objectives & Key Results für alle Teams.", status: "implemented", priority: "high", category: "strategic", created_at: daysAgo(55), implemented_at: daysAgo(25), team_id: fin, ...base, ai_risk_score: 25, ai_impact_score: 70, outcome_type: "successful", outcome: "Cross-Team Projekte +35%.", actual_impact_score: 65 },
      { title: "Incident Response Playbook", description: "Standardisierte Prozesse für Incidents.", status: "implemented", priority: "critical", category: "operational", created_at: daysAgo(42), implemented_at: daysAgo(20), team_id: prod, ...base, ai_risk_score: 40, ai_impact_score: 80, outcome_type: "successful", outcome: "MTTR bei Incidents von 4h auf 30min.", actual_impact_score: 75 },

      // Rejected / Partial (Team)
      { title: "Office-Standort Expansion München", description: "Zweiter Bürostandort.", status: "rejected", priority: "medium", category: "strategic", created_at: daysAgo(140), team_id: fin, ...base, ai_risk_score: 65, ai_impact_score: 50 },
      { title: "Datenbank-Refactoring (Legacy)", description: "Umstellung auf Microservices.", status: "implemented", priority: "critical", category: "technical", created_at: daysAgo(160), implemented_at: daysAgo(110), team_id: prod, ...base, escalation_level: 2, ai_risk_score: 80, ai_impact_score: 75, outcome_type: "partial", outcome: "Migration abgeschlossen, aber 2 Wochen Verzögerung.", actual_impact_score: 50 },
    ];

    const { data: insertedDecisions } = await supabase.from("decisions").insert(decisions as any[]).select("id, title, status, created_at, team_id");

    // ── 3. Tasks — Mix Persönlich + Team ──
    const tasks = [
      // Persönliche Tasks
      { title: "MBA-Programme recherchieren", status: "in_progress", priority: "high", category: "hr", due_date: dueIn(7), created_by: u },
      { title: "Standing Desk bestellen", status: "open", priority: "medium", category: "operational", due_date: dueIn(3), created_by: u },
      { title: "Quartals-OKRs definieren", status: "open", priority: "medium", category: "strategic", due_date: dueIn(5), created_by: u },
      { title: "LinkedIn-Artikel schreiben", status: "backlog", priority: "low", category: "marketing", created_by: u },
      { title: "Versicherungen vergleichen", status: "open", priority: "high", category: "budget", due_date: dueIn(14), created_by: u },
      { title: "Mentoring Kick-off vorbereiten", status: "open", priority: "medium", category: "hr", due_date: dueIn(10), created_by: u },
      { title: "Obsidian Templates anlegen", status: "done", priority: "medium", category: "technical", created_by: u, completed_at: daysAgo(20) },
      { title: "Delegations-Matrix erstellen", status: "done", priority: "high", category: "operational", created_by: u, completed_at: daysAgo(10) },
      // Team Tasks
      { title: "Cloud-Provider Vergleichsmatrix", status: "in_progress", priority: "high", category: "technical", due_date: dueIn(3), created_by: u, team_id: prod },
      { title: "Migrationstimeline erstellen", status: "open", priority: "critical", category: "technical", due_date: dueIn(7), created_by: u, team_id: prod },
      { title: "Budget-Proposal Q2 finalisieren", status: "done", priority: "high", category: "budget", due_date: overdue(1), created_by: u, team_id: fin, completed_at: daysAgo(1) },
      { title: "Stellenausschreibung Senior Dev", status: "open", priority: "medium", category: "hr", due_date: dueIn(10), created_by: u, team_id: prod },
      { title: "Pricing-Tabelle für Sales", status: "done", priority: "high", category: "strategic", created_by: u, team_id: fin, completed_at: daysAgo(5) },
      { title: "Pentest-Anbieter evaluieren", status: "in_progress", priority: "critical", category: "operational", due_date: dueIn(3), created_by: u, team_id: prod },
      { title: "Content-Kalender Q2", status: "open", priority: "medium", category: "marketing", due_date: dueIn(8), created_by: u, team_id: mkt },
      { title: "SLA-Dokument für Enterprise", status: "in_progress", priority: "high", category: "operational", due_date: dueIn(5), created_by: u, team_id: fin },
      { title: "Backup-Skripte automatisieren", status: "open", priority: "high", category: "technical", due_date: dueIn(6), created_by: u, team_id: prod },
      { title: "Competitor Feature Matrix", status: "done", priority: "medium", category: "strategic", created_by: u, team_id: mkt, completed_at: daysAgo(3) },
      { title: "Cost-Optimization Report AWS", status: "open", priority: "high", category: "budget", due_date: dueIn(10), created_by: u, team_id: fin },
      { title: "GitHub Actions Pipeline", status: "done", priority: "high", category: "technical", created_by: u, team_id: prod, completed_at: daysAgo(16) },
    ];
    await supabase.from("tasks").insert(tasks as any[]);

    // ── 4. Risks — Mix ──
    await supabase.from("risks").insert([
      // Persönlich
      { title: "Burnout-Risiko durch Überarbeitung", description: "Hohe Arbeitslast seit 3 Monaten.", likelihood: 3, impact: 4, risk_score: 12, status: "open", created_by: u, mitigation_plan: "Strikte Arbeitszeiten, delegieren, wöchentlicher Check-in." },
      { title: "Wissensverlust ohne Dokumentation", description: "Kritisches Wissen nur im Kopf.", likelihood: 3, impact: 3, risk_score: 9, status: "open", created_by: u, mitigation_plan: "Obsidian Knowledge Base kontinuierlich pflegen." },
      // Team
      { title: "Datenverlust bei Cloud-Migration", description: "Partieller Datenverlust während Migrationsphase.", likelihood: 3, impact: 5, risk_score: 15, status: "open", created_by: u, team_id: prod, mitigation_plan: "Inkrementelle Migration mit Rollback und 3x Backup." },
      { title: "Key-Person Dependency Engineering", description: "Kritisches Wissen bei 2 Senior Engineers.", likelihood: 4, impact: 4, risk_score: 16, status: "open", created_by: u, team_id: prod, mitigation_plan: "Knowledge-Sharing und Dokumentation." },
      { title: "DSGVO-Verstoß durch KI-Module", description: "Unbeabsichtigte Verarbeitung personenbezogener Daten.", likelihood: 2, impact: 5, risk_score: 10, status: "open", created_by: u, team_id: fin, mitigation_plan: "DPIA durchführen, Anonymisierung implementieren." },
      { title: "Churn bei Pricing-Umstellung", description: "Kunden könnten bei Preiserhöhung abwandern.", likelihood: 3, impact: 3, risk_score: 9, status: "mitigated", created_by: u, team_id: mkt, mitigation_plan: "Bestandskundenpreise 12 Monate grandfathered." },
    ]);

    // ── 5. Lessons Learned ──
    const implementedDecs = insertedDecisions?.filter(d => d.status === "implemented") || [];
    const lessonsData = [
      { key_takeaway: "Persönliche Systeme brauchen 3 Wochen bis sie zur Gewohnheit werden.", what_went_well: "Produktivität messbar gestiegen.", what_went_wrong: "Anfangs zu viel auf einmal geändert.", recommendations: "Eine Gewohnheit nach der anderen einführen." },
      { key_takeaway: "Tiered Pricing funktioniert mit klaren Feature-Grenzen.", what_went_well: "Revenue-Impact höher als prognostiziert.", what_went_wrong: "Sales brauchte Training.", recommendations: "Sales-Enablement parallel erstellen." },
      { key_takeaway: "Rate-Limiting früh einführen.", what_went_well: "Schnelle Implementierung.", what_went_wrong: "Interne Services anfangs betroffen.", recommendations: "Interne und externe Endpunkte trennen." },
      { key_takeaway: "CS-Team braucht Eskalationspfade vom ersten Tag.", what_went_well: "Churn-Reduktion übertraf Erwartungen.", what_went_wrong: "CRM-Integration dauerte 3 Wochen.", recommendations: "Tooling VOR Team-Aufbau definieren." },
      { key_takeaway: "CI/CD Modernisierung zahlt sich sofort aus.", what_went_well: "Team-Produktivität spürbar gestiegen.", what_went_wrong: "Legacy-Tests brauchten Anpassung.", recommendations: "Test-Migration als eigenes Workstream." },
      { key_takeaway: "Gutes Onboarding ist der stärkste Growth-Hebel.", what_went_well: "Activation Rate fast verdoppelt.", what_went_wrong: "Demo-Daten anfangs nicht realistisch.", recommendations: "Demo-Daten regelmäßig aktualisieren." },
      { key_takeaway: "Delegation erfordert Vertrauen UND Struktur.", what_went_well: "Strategische Zeit gewonnen.", what_went_wrong: "Erste Woche Kontrollverlust-Gefühl.", recommendations: "Check-in-Rhythmus vereinbaren." },
      { key_takeaway: "Netzwerken ist ein Langzeit-Investment.", what_went_well: "Unerwartete Opportunities.", what_went_wrong: "Konsistenz schwer durchzuhalten.", recommendations: "Feste Slots im Kalender blocken." },
    ];
    const lessons = implementedDecs.slice(0, 8).map((d, i) => ({
      decision_id: d.id, created_by: u, ...lessonsData[i % lessonsData.length],
    }));
    if (lessons.length > 0) await supabase.from("lessons_learned").insert(lessons);

    // ── 6. Strategic Goals ──
    const currentYear = now.getFullYear();
    await supabase.from("strategic_goals").insert([
      // Persönlich
      { title: "50 Deep-Work-Blöcke pro Quartal", description: "Fokussierte Arbeit ohne Unterbrechungen.", goal_type: "kpi", target_value: 50, current_value: 32, unit: "Blöcke", year: currentYear, quarter: "Q2", status: "active", created_by: u },
      { title: "12 Networking-Events besuchen", description: "Mindestens 1 Event pro Monat.", goal_type: "okr", target_value: 12, current_value: 5, unit: "Events", year: currentYear, quarter: "Q4", status: "active", created_by: u },
      // Team
      { title: "ARR auf €2M steigern", description: "Annual Recurring Revenue.", goal_type: "okr", target_value: 2000000, current_value: 1350000, unit: "€", year: currentYear, quarter: "Q4", status: "active", created_by: u, team_id: fin },
      { title: "Ø Entscheidungszeit unter 5 Tage", description: "Draft → Implementierung.", goal_type: "kpi", target_value: 5, current_value: 7.2, unit: "Tage", year: currentYear, quarter: "Q2", status: "active", created_by: u, team_id: prod },
      { title: "NPS über 60", description: "Net Promoter Score Enterprise.", goal_type: "kpi", target_value: 60, current_value: 67, unit: "Score", year: currentYear, quarter: "Q2", status: "active", created_by: u, team_id: mkt },
    ]);

    // ── 7. Audit Logs ──
    if (insertedDecisions && insertedDecisions.length >= 10) {
      const auditLogs = [
        { decision_id: insertedDecisions[0].id, user_id: u, action: "created", created_at: daysAgo(3) },
        ...insertedDecisions.filter(d => d.status === "implemented").slice(0, 8).flatMap(d => [
          { decision_id: d.id, user_id: u, action: "created", created_at: d.created_at },
          { decision_id: d.id, user_id: u, action: "status_changed", field_name: "status", old_value: "draft", new_value: "implemented", created_at: daysAgo(5) },
        ]),
      ];
      await supabase.from("audit_logs").insert(auditLogs);
    }

    // ── 8. Reviews ──
    if (insertedDecisions) {
      const reviews = insertedDecisions
        .filter(d => d.status === "review" || d.status === "approved")
        .slice(0, 6)
        .map(d => ({
          decision_id: d.id, reviewer_id: u, step_order: 1,
          status: d.status === "approved" ? "approved" : "review",
          feedback: d.status === "approved" ? "Freigabe erteilt." : null,
          reviewed_at: d.status === "approved" ? daysAgo(2) : null,
        }));
      if (reviews.length > 0) await supabase.from("decision_reviews").insert(reviews as any[]);
    }

    const personalCount = insertedDecisions?.filter(d => !d.team_id).length || 0;
    const teamCount = insertedDecisions?.filter(d => d.team_id).length || 0;

    return new Response(JSON.stringify({
      success: true,
      message: `Demo-Daten erstellt — ${personalCount} persönliche + ${teamCount} Team-Entscheidungen, 20 Tasks, 6 Risiken, 5 Ziele, 3 Teams`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

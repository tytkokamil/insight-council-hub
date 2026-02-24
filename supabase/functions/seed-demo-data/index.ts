import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Team templates that cycle on each click ──
const teamTemplates = [
  {
    name: "Produktteam",
    description: "Cross-funktionales Produktteam für Plattform-Entwicklung",
    hourly_rate: 85,
    decisions: [
      { title: "Cloud-Migration der Legacy-Systeme", description: "Migration der On-Premise-Infrastruktur zu Cloud-nativem Setup.", status: "review", priority: "critical", category: "technical", dueInDays: -2, createdDaysAgo: 14, escalation_level: 1, ai_risk_score: 72, ai_impact_score: 85, cost_per_day: 2500 },
      { title: "Senior Developer Hiring Pipeline", description: "Recruiting-Strategie: Interne Beförderung vs. Headhunter vs. Freelancer.", status: "proposed", priority: "high", category: "hr", dueInDays: 14, createdDaysAgo: 5, ai_risk_score: 40, ai_impact_score: 70, cost_per_day: 1200 },
      { title: "Vendor Lock-in Bewertung AWS", description: "Risikobewertung AWS-Abhängigkeit. Multi-Cloud vs. Single-Cloud.", status: "review", priority: "medium", category: "technical", dueInDays: 10, createdDaysAgo: 8, ai_risk_score: 55, ai_impact_score: 65 },
      { title: "Feature-Flag-Architektur", description: "Schrittweise Feature-Releases mit Flag-basierter Steuerung.", status: "draft", priority: "medium", category: "technical", dueInDays: 18, createdDaysAgo: 1, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "A/B Testing Framework", description: "Systematische A/B Tests für Conversion-Optimierung.", status: "approved", priority: "medium", category: "technical", dueInDays: 15, createdDaysAgo: 6, ai_risk_score: 15, ai_impact_score: 55 },
      { title: "Backup & Disaster Recovery Plan", description: "RTO/RPO Definition und automatisierte Backup-Strategie.", status: "approved", priority: "critical", category: "technical", dueInDays: 10, createdDaysAgo: 8, ai_risk_score: 60, ai_impact_score: 85 },
      { title: "Security Penetration Test", description: "Externer Pentest durch zertifizierten Anbieter.", status: "review", priority: "critical", category: "operational", dueInDays: 5, createdDaysAgo: 10, ai_risk_score: 55, ai_impact_score: 85 },
      { title: "Technical Debt Sprint", description: "Dedizierter Sprint für kritische technische Schulden.", status: "review", priority: "high", category: "technical", dueInDays: 3, createdDaysAgo: 9, ai_risk_score: 30, ai_impact_score: 60, cost_per_day: 1800 },
      { title: "CI/CD Pipeline Modernisierung", description: "Migration von Jenkins zu GitHub Actions.", status: "implemented", priority: "high", category: "technical", createdDaysAgo: 35, implementedDaysAgo: 15, ai_risk_score: 20, ai_impact_score: 60, outcome_type: "successful", outcome: "Deploy-Zeit von 45min auf 8min.", actual_impact_score: 70 },
      { title: "Onboarding-Flow Redesign", description: "Guided Tour und Checkliste für neue Nutzer.", status: "implemented", priority: "high", category: "product", createdDaysAgo: 25, implementedDaysAgo: 10, ai_risk_score: 15, ai_impact_score: 70, outcome_type: "successful", outcome: "Activation Rate von 35% auf 58%.", actual_impact_score: 80 },
    ],
    tasks: [
      { title: "Cloud-Provider Vergleichsmatrix", status: "in_progress", priority: "high", category: "technical", dueInDays: 3 },
      { title: "Migrationstimeline erstellen", status: "open", priority: "critical", category: "technical", dueInDays: 7 },
      { title: "Stellenausschreibung Senior Dev", status: "open", priority: "medium", category: "hr", dueInDays: 10 },
      { title: "Pentest-Anbieter evaluieren", status: "in_progress", priority: "critical", category: "operational", dueInDays: 3 },
      { title: "Backup-Skripte automatisieren", status: "open", priority: "high", category: "technical", dueInDays: 6 },
      { title: "GitHub Actions Pipeline", status: "done", priority: "high", category: "technical", completedDaysAgo: 16 },
    ],
    risks: [
      { title: "Datenverlust bei Cloud-Migration", description: "Partieller Datenverlust während Migrationsphase.", likelihood: 3, impact: 5, risk_score: 15, status: "open", mitigation_plan: "Inkrementelle Migration mit Rollback und 3x Backup." },
      { title: "Key-Person Dependency Engineering", description: "Kritisches Wissen bei 2 Senior Engineers.", likelihood: 4, impact: 4, risk_score: 16, status: "open", mitigation_plan: "Knowledge-Sharing und Dokumentation." },
    ],
    goals: [
      { title: "Ø Entscheidungszeit unter 5 Tage", description: "Draft → Implementierung.", goal_type: "kpi", target_value: 5, current_value: 7.2, unit: "Tage", quarter: "Q2" },
    ],
  },
  {
    name: "Marketing & Growth",
    description: "Wachstumsstrategie, Kampagnen und Content",
    hourly_rate: 70,
    decisions: [
      { title: "Q2 Marketing-Budget Allokation", description: "Verteilung €180k Q2-Budget auf Performance Marketing, Content und Events.", status: "approved", priority: "high", category: "budget", dueInDays: 5, createdDaysAgo: 10, ai_risk_score: 25, ai_impact_score: 60, cost_per_day: 800 },
      { title: "Partner-Programm Konzept", description: "Reseller- und Integrations-Partnerprogramm.", status: "proposed", priority: "high", category: "strategic", dueInDays: 30, createdDaysAgo: 4, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "Content-Strategie Q2/Q3", description: "Blog, Whitepaper und Case Studies.", status: "approved", priority: "medium", category: "marketing", dueInDays: 12, createdDaysAgo: 7, ai_risk_score: 10, ai_impact_score: 50 },
      { title: "Social Media Rebranding", description: "Einheitliches Brand-Design über alle Kanäle.", status: "draft", priority: "medium", category: "marketing", dueInDays: 21, createdDaysAgo: 3, ai_risk_score: 10, ai_impact_score: 45 },
      { title: "Influencer-Kooperationsprogramm", description: "Zusammenarbeit mit B2B-Influencern für Lead-Generierung.", status: "proposed", priority: "medium", category: "marketing", dueInDays: 25, createdDaysAgo: 5, ai_risk_score: 20, ai_impact_score: 55 },
      { title: "Customer Success Team Aufbau", description: "Dediziertes CS-Team mit 3 FTEs.", status: "implemented", priority: "high", category: "hr", createdDaysAgo: 45, implementedDaysAgo: 12, ai_risk_score: 35, ai_impact_score: 80, outcome_type: "successful", outcome: "Churn-Rate -22%. NPS von 42 auf 67.", actual_impact_score: 85 },
      { title: "Webinar-Serie für Enterprise Leads", description: "Monatliche Webinare mit Branchenexperten.", status: "review", priority: "high", category: "marketing", dueInDays: 8, createdDaysAgo: 6, ai_risk_score: 15, ai_impact_score: 60 },
    ],
    tasks: [
      { title: "Content-Kalender Q2", status: "open", priority: "medium", category: "marketing", dueInDays: 8 },
      { title: "Competitor Feature Matrix", status: "done", priority: "medium", category: "strategic", completedDaysAgo: 3 },
      { title: "Landing Page für Partner-Programm", status: "open", priority: "high", category: "marketing", dueInDays: 14 },
      { title: "Case Study Kunde X schreiben", status: "in_progress", priority: "medium", category: "marketing", dueInDays: 5 },
      { title: "Webinar-Einladungen versenden", status: "open", priority: "high", category: "marketing", dueInDays: 6 },
    ],
    risks: [
      { title: "Churn bei Pricing-Umstellung", description: "Kunden könnten bei Preiserhöhung abwandern.", likelihood: 3, impact: 3, risk_score: 9, status: "mitigated", mitigation_plan: "Bestandskundenpreise 12 Monate grandfathered." },
    ],
    goals: [
      { title: "NPS über 60", description: "Net Promoter Score Enterprise.", goal_type: "kpi", target_value: 60, current_value: 67, unit: "Score", quarter: "Q2" },
    ],
  },
  {
    name: "Finance & Operations",
    description: "Budgetplanung, Controlling und operative Prozesse",
    hourly_rate: 95,
    decisions: [
      { title: "Datenschutz-Folgenabschätzung KI-Module", description: "DPIA für alle KI-gestützten Features gemäß Art. 35 DSGVO.", status: "proposed", priority: "critical", category: "operational", dueInDays: 7, createdDaysAgo: 3, ai_risk_score: 60, ai_impact_score: 80 },
      { title: "Remote Work Policy Update", description: "3 Tage Home-Office, 2 Tage Office. Auswirkung auf Produktivität.", status: "draft", priority: "medium", category: "operational", dueInDays: 21, createdDaysAgo: 2, ai_risk_score: 15, ai_impact_score: 45 },
      { title: "SOC 2 Type II Zertifizierung", description: "Zertifizierung für Enterprise-Kunden.", status: "proposed", priority: "critical", category: "operational", dueInDays: 60, createdDaysAgo: 6, ai_risk_score: 45, ai_impact_score: 90 },
      { title: "SLA-Framework für Enterprise", description: "SLAs mit Uptime-Garantien und Response-Times.", status: "review", priority: "high", category: "operational", dueInDays: 8, createdDaysAgo: 7, ai_risk_score: 30, ai_impact_score: 75 },
      { title: "Kosten-Optimierung Cloud", description: "Reserved Instances, Spot-Instances und Auto-Scaling.", status: "approved", priority: "high", category: "budget", dueInDays: 12, createdDaysAgo: 7, ai_risk_score: 20, ai_impact_score: 65 },
      { title: "Pricing-Modell für Enterprise", description: "Tiered-Pricing mit Volumenrabatten.", status: "implemented", priority: "critical", category: "strategic", createdDaysAgo: 30, implementedDaysAgo: 3, ai_risk_score: 55, ai_impact_score: 95, outcome_type: "successful", outcome: "Revenue pro Enterprise-Kunde +32%.", actual_impact_score: 90 },
      { title: "DSGVO-Audit Q1", description: "Vollständiges Audit aller Datenverarbeitungsprozesse.", status: "implemented", priority: "critical", category: "operational", createdDaysAgo: 40, implementedDaysAgo: 18, ai_risk_score: 70, ai_impact_score: 90, outcome_type: "successful", outcome: "Audit bestanden. 3 Minor Findings behoben.", actual_impact_score: 80 },
      { title: "OKR Framework Einführung", description: "Objectives & Key Results für alle Teams.", status: "implemented", priority: "high", category: "strategic", createdDaysAgo: 55, implementedDaysAgo: 25, ai_risk_score: 25, ai_impact_score: 70, outcome_type: "successful", outcome: "Cross-Team Projekte +35%.", actual_impact_score: 65 },
    ],
    tasks: [
      { title: "Budget-Proposal Q2 finalisieren", status: "done", priority: "high", category: "budget", dueInDays: -1, completedDaysAgo: 1 },
      { title: "Pricing-Tabelle für Sales", status: "done", priority: "high", category: "strategic", completedDaysAgo: 5 },
      { title: "SLA-Dokument für Enterprise", status: "in_progress", priority: "high", category: "operational", dueInDays: 5 },
      { title: "Cost-Optimization Report AWS", status: "open", priority: "high", category: "budget", dueInDays: 10 },
      { title: "Compliance-Checkliste aktualisieren", status: "open", priority: "critical", category: "operational", dueInDays: 7 },
    ],
    risks: [
      { title: "DSGVO-Verstoß durch KI-Module", description: "Unbeabsichtigte Verarbeitung personenbezogener Daten.", likelihood: 2, impact: 5, risk_score: 10, status: "open", mitigation_plan: "DPIA durchführen, Anonymisierung implementieren." },
    ],
    goals: [
      { title: "ARR auf €2M steigern", description: "Annual Recurring Revenue.", goal_type: "okr", target_value: 2000000, current_value: 1350000, unit: "€", quarter: "Q4" },
    ],
  },
  {
    name: "People & Culture",
    description: "HR, Employer Branding und Teamkultur",
    hourly_rate: 75,
    decisions: [
      { title: "Employer Branding Kampagne", description: "Arbeitgebermarke stärken über LinkedIn, Glassdoor und Karriereseite.", status: "approved", priority: "high", category: "marketing", dueInDays: 20, createdDaysAgo: 8, ai_risk_score: 15, ai_impact_score: 60 },
      { title: "Gehaltsstruktur-Überarbeitung", description: "Marktgerechte Vergütung mit transparenten Bändern.", status: "review", priority: "critical", category: "hr", dueInDays: 14, createdDaysAgo: 12, ai_risk_score: 45, ai_impact_score: 80 },
      { title: "Learning & Development Budget", description: "€2k pro Mitarbeiter für Weiterbildung.", status: "proposed", priority: "medium", category: "budget", dueInDays: 30, createdDaysAgo: 5, ai_risk_score: 10, ai_impact_score: 55 },
      { title: "Onboarding-Prozess Standardisierung", description: "30-60-90 Tage Plan für alle Neuzugänge.", status: "draft", priority: "high", category: "hr", dueInDays: 21, createdDaysAgo: 3, ai_risk_score: 10, ai_impact_score: 65 },
      { title: "Diversity & Inclusion Initiative", description: "Workshops, Mentoring und Recruiting-Ziele.", status: "approved", priority: "high", category: "hr", dueInDays: 45, createdDaysAgo: 15, ai_risk_score: 15, ai_impact_score: 70 },
      { title: "Mitarbeiter-Zufriedenheitsumfrage Q1", description: "Anonyme Umfrage mit eNPS.", status: "implemented", priority: "high", category: "hr", createdDaysAgo: 30, implementedDaysAgo: 10, ai_risk_score: 5, ai_impact_score: 60, outcome_type: "successful", outcome: "eNPS von 28 auf 45 gestiegen.", actual_impact_score: 65 },
    ],
    tasks: [
      { title: "Gehaltsbänder recherchieren", status: "in_progress", priority: "high", category: "hr", dueInDays: 7 },
      { title: "Onboarding-Checkliste erstellen", status: "open", priority: "medium", category: "hr", dueInDays: 14 },
      { title: "D&I Workshop planen", status: "open", priority: "medium", category: "hr", dueInDays: 21 },
      { title: "Karriereseite aktualisieren", status: "in_progress", priority: "high", category: "marketing", dueInDays: 10 },
    ],
    risks: [
      { title: "Fluktuation Schlüsselpositionen", description: "3 Senior-Rollen offen seit >6 Wochen.", likelihood: 3, impact: 4, risk_score: 12, status: "open", mitigation_plan: "Retention-Bonus und Entwicklungspläne." },
    ],
    goals: [
      { title: "eNPS über 50", description: "Employee Net Promoter Score.", goal_type: "kpi", target_value: 50, current_value: 45, unit: "Score", quarter: "Q3" },
    ],
  },
  {
    name: "Data & Analytics",
    description: "Business Intelligence, Dateninfrastruktur und Reporting",
    hourly_rate: 90,
    decisions: [
      { title: "Data Warehouse Migration zu Snowflake", description: "Migration von Redshift zu Snowflake für bessere Skalierung.", status: "review", priority: "critical", category: "technical", dueInDays: 14, createdDaysAgo: 10, ai_risk_score: 50, ai_impact_score: 80, cost_per_day: 2000 },
      { title: "Self-Service BI Tool Auswahl", description: "Metabase vs. Looker vs. PowerBI für nicht-technische Teams.", status: "proposed", priority: "high", category: "technical", dueInDays: 21, createdDaysAgo: 7, ai_risk_score: 25, ai_impact_score: 65 },
      { title: "Data Governance Framework", description: "Datenqualität, Ownership und Zugriffsrechte definieren.", status: "draft", priority: "high", category: "operational", dueInDays: 30, createdDaysAgo: 4, ai_risk_score: 35, ai_impact_score: 75 },
      { title: "ML Pipeline für Churn-Prediction", description: "Predictive Analytics für Kundenabwanderung.", status: "approved", priority: "medium", category: "technical", dueInDays: 25, createdDaysAgo: 6, ai_risk_score: 30, ai_impact_score: 70 },
      { title: "ETL-Automatisierung", description: "dbt + Airflow für automatisierte Datenpipelines.", status: "implemented", priority: "high", category: "technical", createdDaysAgo: 40, implementedDaysAgo: 15, ai_risk_score: 20, ai_impact_score: 65, outcome_type: "successful", outcome: "Manuelle Datenaufbereitung um 90% reduziert.", actual_impact_score: 75 },
      { title: "Dashboard-Konsolidierung", description: "Von 25 auf 8 Standard-Dashboards.", status: "implemented", priority: "medium", category: "operational", createdDaysAgo: 35, implementedDaysAgo: 12, ai_risk_score: 10, ai_impact_score: 50, outcome_type: "successful", outcome: "Datengetriebene Entscheidungen +40%.", actual_impact_score: 55 },
    ],
    tasks: [
      { title: "Snowflake POC aufsetzen", status: "in_progress", priority: "critical", category: "technical", dueInDays: 5 },
      { title: "BI-Tool Demo Sessions planen", status: "open", priority: "high", category: "technical", dueInDays: 10 },
      { title: "Data Quality Audit durchführen", status: "open", priority: "high", category: "operational", dueInDays: 14 },
      { title: "ML-Modell Prototyp trainieren", status: "in_progress", priority: "medium", category: "technical", dueInDays: 18 },
      { title: "ETL-Monitoring Dashboard", status: "done", priority: "high", category: "technical", completedDaysAgo: 10 },
    ],
    risks: [
      { title: "Datenqualität unter Schwellenwert", description: "Inkonsistente Daten in 3 kritischen Tabellen.", likelihood: 4, impact: 3, risk_score: 12, status: "open", mitigation_plan: "Data Quality Checks in Pipeline integrieren." },
    ],
    goals: [
      { title: "Data Quality Score >95%", description: "Automatisierte Qualitätsprüfung.", goal_type: "kpi", target_value: 95, current_value: 82, unit: "%", quarter: "Q3" },
    ],
  },
];

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

    // ── Determine which team to create next ──
    const { data: existingTeams } = await supabase.from("teams").select("name").eq("created_by", userId);
    const existingNames = new Set((existingTeams || []).map((t: any) => t.name));

    // Find first template not yet used
    let template = teamTemplates.find(t => !existingNames.has(t.name));

    // If all used, add a numbered suffix
    if (!template) {
      const baseTpl = teamTemplates[existingTeams!.length % teamTemplates.length];
      const count = (existingTeams || []).filter((t: any) => t.name.startsWith(baseTpl.name)).length;
      template = { ...baseTpl, name: `${baseTpl.name} ${count + 1}` };
    }

    // ── Helpers ──
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueDate = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().split("T")[0];
    const currentYear = now.getFullYear();

    // ── 1. Create Team ──
    const { data: newTeam, error: teamErr } = await supabase.from("teams").insert({
      name: template.name,
      description: template.description,
      created_by: userId,
      hourly_rate: template.hourly_rate,
    }).select("id, name").single();

    if (teamErr || !newTeam) throw new Error(teamErr?.message || "Team creation failed");

    // Add user as team lead
    await supabase.from("team_members").insert({ team_id: newTeam.id, user_id: userId, role: "lead" });

    // ── 2. Create Decisions ──
    const decisionsToInsert = template.decisions.map(d => ({
      title: d.title,
      description: d.description,
      status: d.status,
      priority: d.priority,
      category: d.category,
      due_date: d.dueInDays !== undefined ? dueDate(d.dueInDays) : undefined,
      created_at: daysAgo(d.createdDaysAgo),
      created_by: userId,
      owner_id: userId,
      team_id: newTeam.id,
      ai_risk_score: d.ai_risk_score || 0,
      ai_impact_score: d.ai_impact_score || 0,
      cost_per_day: d.cost_per_day || 0,
      escalation_level: d.escalation_level || 0,
      last_escalated_at: d.escalation_level ? daysAgo(1) : undefined,
      implemented_at: d.implementedDaysAgo ? daysAgo(d.implementedDaysAgo) : undefined,
      outcome_type: d.outcome_type || undefined,
      outcome: d.outcome || undefined,
      actual_impact_score: d.actual_impact_score || undefined,
    }));

    const { data: insertedDecisions } = await supabase.from("decisions").insert(decisionsToInsert as any[]).select("id, title, status, created_at");

    // ── 3. Create Tasks ──
    const tasksToInsert = template.tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      due_date: t.dueInDays !== undefined ? dueDate(t.dueInDays) : undefined,
      created_by: userId,
      team_id: newTeam.id,
      completed_at: t.completedDaysAgo ? daysAgo(t.completedDaysAgo) : undefined,
    }));

    await supabase.from("tasks").insert(tasksToInsert as any[]);

    // ── 4. Create Risks ──
    const risksToInsert = template.risks.map(r => ({
      ...r,
      created_by: userId,
      team_id: newTeam.id,
    }));

    await supabase.from("risks").insert(risksToInsert);

    // ── 5. Create Strategic Goals ──
    const goalsToInsert = template.goals.map(g => ({
      ...g,
      created_by: userId,
      team_id: newTeam.id,
      year: currentYear,
      status: "active",
    }));

    await supabase.from("strategic_goals").insert(goalsToInsert);

    // ── 6. Create Lessons Learned for implemented decisions ──
    const implementedDecs = insertedDecisions?.filter(d => d.status === "implemented") || [];
    const lessonTemplates = [
      { key_takeaway: "Frühzeitige Planung reduziert Risiken signifikant.", what_went_well: "Termingerecht umgesetzt.", what_went_wrong: "Scope anfangs nicht klar definiert.", recommendations: "Scope-Dokument vor Kickoff erstellen." },
      { key_takeaway: "Automatisierung spart langfristig enorme Ressourcen.", what_went_well: "ROI höher als erwartet.", what_went_wrong: "Einarbeitungszeit unterschätzt.", recommendations: "Training-Budget einplanen." },
      { key_takeaway: "Cross-funktionale Zusammenarbeit beschleunigt Entscheidungen.", what_went_well: "Team-Alignment verbessert.", what_went_wrong: "Zu viele Stakeholder anfangs.", recommendations: "RACI-Matrix vorab definieren." },
    ];

    const lessons = implementedDecs.map((d, i) => ({
      decision_id: d.id,
      created_by: userId,
      ...lessonTemplates[i % lessonTemplates.length],
    }));
    if (lessons.length > 0) await supabase.from("lessons_learned").insert(lessons);

    // ── 7. Create Reviews for review/approved decisions ──
    const reviewDecs = insertedDecisions?.filter(d => d.status === "review" || d.status === "approved") || [];
    const reviews = reviewDecs.slice(0, 4).map(d => ({
      decision_id: d.id,
      reviewer_id: userId,
      step_order: 1,
      status: d.status === "approved" ? "approved" : "review",
      feedback: d.status === "approved" ? "Freigabe erteilt." : null,
      reviewed_at: d.status === "approved" ? daysAgo(2) : null,
    }));
    if (reviews.length > 0) await supabase.from("decision_reviews").insert(reviews as any[]);

    // ── 8. Create Audit Logs ──
    if (insertedDecisions && insertedDecisions.length > 0) {
      const auditLogs = insertedDecisions.slice(0, 5).map(d => ({
        decision_id: d.id,
        user_id: userId,
        action: "created",
        created_at: d.created_at,
      }));
      await supabase.from("audit_logs").insert(auditLogs);
    }

    const decCount = insertedDecisions?.length || 0;
    const taskCount = template.tasks.length;
    const riskCount = template.risks.length;

    return new Response(JSON.stringify({
      success: true,
      message: `Team "${newTeam.name}" erstellt mit ${decCount} Entscheidungen, ${taskCount} Aufgaben, ${riskCount} Risiken und ${template.goals.length} Zielen.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

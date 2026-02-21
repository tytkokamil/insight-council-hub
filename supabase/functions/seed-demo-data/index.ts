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

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = user.id;

    // Check if user already has data
    const { count } = await supabase.from("decisions").select("id", { count: "exact", head: true }).eq("created_by", userId);
    if ((count || 0) > 0) {
      return new Response(JSON.stringify({ error: "Du hast bereits Entscheidungen. Demo-Daten sind nur für neue Accounts." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Create demo team
    const { data: team } = await supabase.from("teams").insert({ name: "Produktteam (Demo)", description: "Beispielteam zur Demonstration", created_by: userId }).select().single();
    const teamId = team?.id;

    if (teamId) {
      await supabase.from("team_members").insert({ team_id: teamId, user_id: userId, role: "lead" });
    }

    // 2. Create 5 decisions with different statuses
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    const dueIn = (d: number) => { const dt = new Date(now.getTime() + d * 86400000); return dt.toISOString().split("T")[0]; };
    const overdue = (d: number) => { const dt = new Date(now.getTime() - d * 86400000); return dt.toISOString().split("T")[0]; };

    const decisions = [
      {
        title: "Cloud-Migration der Legacy-Systeme",
        description: "Migration der bestehenden On-Premise-Infrastruktur zu einem Cloud-nativen Setup. Betrifft 12 Services und 3 Datenbanken.",
        status: "review" as const, priority: "critical" as const, category: "technical" as const,
        due_date: overdue(2), created_at: daysAgo(14), team_id: teamId, created_by: userId, owner_id: userId,
        escalation_level: 1, last_escalated_at: daysAgo(1),
        ai_risk_score: 72, ai_impact_score: 85,
        context: "Aktuelle Infrastrukturkosten steigen um 15% pro Quartal.",
      },
      {
        title: "Q2 Marketing-Budget Allokation",
        description: "Verteilung des Q2-Budgets auf Performance Marketing, Content und Events.",
        status: "approved" as const, priority: "high" as const, category: "budget" as const,
        due_date: dueIn(5), created_at: daysAgo(10), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 25, ai_impact_score: 60,
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
      },
      {
        title: "Remote Work Policy Update",
        description: "Aktualisierung der Remote-Work-Richtlinie: 3 Tage Home-Office, 2 Tage Office.",
        status: "draft" as const, priority: "medium" as const, category: "operational" as const,
        due_date: dueIn(21), created_at: daysAgo(2), team_id: teamId, created_by: userId, owner_id: userId,
        ai_risk_score: 15, ai_impact_score: 45,
      },
    ];

    const { data: insertedDecisions } = await supabase.from("decisions").insert(decisions).select("id, title, status");

    // 3. Create tasks linked to decisions
    if (insertedDecisions && insertedDecisions.length > 0) {
      const tasks = [
        { title: "Cloud-Provider vergleichen (AWS vs. Azure vs. GCP)", status: "in_progress" as const, priority: "high" as const, category: "technical" as const, due_date: dueIn(3), created_by: userId, team_id: teamId },
        { title: "Migrationstimeline erstellen", status: "open" as const, priority: "critical" as const, category: "technical" as const, due_date: dueIn(7), created_by: userId, team_id: teamId },
        { title: "Budget-Proposal finalisieren", status: "done" as const, priority: "high" as const, category: "budget" as const, due_date: overdue(1), created_by: userId, team_id: teamId, completed_at: daysAgo(1) },
        { title: "Stellenausschreibung formulieren", status: "open" as const, priority: "medium" as const, category: "hr" as const, due_date: dueIn(10), created_by: userId, team_id: teamId },
        { title: "Pricing-Tabelle für Sales erstellen", status: "done" as const, priority: "high" as const, category: "strategic" as const, created_by: userId, team_id: teamId, completed_at: daysAgo(5) },
        { title: "Feedback-Umfrage an Mitarbeiter senden", status: "backlog" as const, priority: "low" as const, category: "operational" as const, created_by: userId, team_id: teamId },
      ];
      await supabase.from("tasks").insert(tasks);
    }

    // 4. Create a risk
    await supabase.from("risks").insert({
      title: "Datenverlust bei Cloud-Migration",
      description: "Risiko eines partiellen Datenverlusts während der Migrationsphase ohne ausreichende Backup-Strategie.",
      likelihood: 3, impact: 5, risk_score: 15,
      status: "open", created_by: userId, team_id: teamId,
      mitigation_plan: "Inkrementelle Migration mit Rollback-Plan und dreifacher Backup-Strategie.",
    });

    // 5. Create a lesson learned for the implemented decision
    const implementedDec = insertedDecisions?.find(d => d.status === "implemented");
    if (implementedDec) {
      await supabase.from("lessons_learned").insert({
        decision_id: implementedDec.id, created_by: userId,
        key_takeaway: "Tiered Pricing funktioniert am besten mit klaren Feature-Grenzen zwischen den Stufen.",
        what_went_well: "Schnelle Adoption durch bestehende Kunden. Revenue-Impact war höher als prognostiziert.",
        what_went_wrong: "Initiale Kommunikation war zu technisch. Sales-Team brauchte zusätzliches Training.",
        recommendations: "Immer Sales-Enablement Material parallel zum Pricing erstellen.",
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Demo-Daten erstellt",
      created: { team: 1, decisions: insertedDecisions?.length || 0, tasks: 6, risks: 1, lessons: 1 }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

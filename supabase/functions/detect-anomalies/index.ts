import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 86400000).toISOString();

    // Fetch decisions (active + recent)
    const { data: decisions = [] } = await supabase
      .from("decisions")
      .select("id, title, status, category, priority, created_at, updated_at, due_date, implemented_at, escalation_level, cost_per_day, team_id")
      .is("deleted_at", null);

    // Fetch reviews from last 30 days
    const { data: reviews = [] } = await supabase
      .from("decision_reviews")
      .select("id, decision_id, reviewer_id, status, created_at, reviewed_at, step_order")
      .gte("created_at", thirtyDaysAgo);

    // Fetch profiles for names
    const { data: profiles = [] } = await supabase
      .from("profiles")
      .select("user_id, full_name");

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.full_name || p.user_id.slice(0, 8); });

    const anomalies: any[] = [];

    // ═══ PATTERN 1: Blocking Reviewer ═══
    const reviewerDelays: Record<string, { count: number; totalDelay: number; decisions: string[] }> = {};
    (reviews || []).forEach((r: any) => {
      if (!r.reviewed_at && !r.reviewer_id) return;
      const reviewDate = r.reviewed_at ? new Date(r.reviewed_at).getTime() : now;
      const created = new Date(r.created_at).getTime();
      const delayDays = (reviewDate - created) / 86400000;
      if (delayDays > 3) {
        if (!reviewerDelays[r.reviewer_id]) reviewerDelays[r.reviewer_id] = { count: 0, totalDelay: 0, decisions: [] };
        reviewerDelays[r.reviewer_id].count++;
        reviewerDelays[r.reviewer_id].totalDelay += delayDays;
        reviewerDelays[r.reviewer_id].decisions.push(r.decision_id);
      }
    });

    Object.entries(reviewerDelays).forEach(([userId, data]) => {
      if (data.count >= 5) {
        // Estimate CoD: count * avg_delay * 85€/h * 8h * 1.5 overhead
        const avgDelay = data.totalDelay / data.count;
        const estimatedCod = Math.round(data.count * avgDelay * 85 * 8 * 1.5);
        anomalies.push({
          type: "blocking_reviewer",
          severity: "critical",
          title: `Blockierender Reviewer: ${nameMap[userId] || "Unbekannt"}`,
          description: `${nameMap[userId] || "Ein Reviewer"} hat in 30 Tagen ${data.count} Entscheidungen mit mehr als 3 Tagen Verzögerung bearbeitet — verursachter Cost-of-Delay: €${estimatedCod.toLocaleString("de-DE")}.`,
          recommendation: "Kapazitätsprüfung durchführen oder Vertretung einrichten.",
          action: { label: "Vertretung einrichten", route: "/settings" },
          meta: { userId, count: data.count, costOfDelay: estimatedCod },
        });
      }
    });

    // ═══ PATTERN 2: Problem Category ═══
    const industryBenchmarks: Record<string, number> = {
      strategic: 10, budget: 8, hr: 5, technical: 7, operational: 4, marketing: 5, general: 5,
    };
    const catDurations: Record<string, { totalDays: number; count: number; reviewerCounts: number[] }> = {};
    (decisions || []).forEach((d: any) => {
      if (!d.implemented_at) return;
      const days = (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000;
      if (!catDurations[d.category]) catDurations[d.category] = { totalDays: 0, count: 0, reviewerCounts: [] };
      catDurations[d.category].totalDays += days;
      catDurations[d.category].count++;
    });
    // Count reviewers per decision per category
    (reviews || []).forEach((r: any) => {
      const dec = (decisions || []).find((d: any) => d.id === r.decision_id);
      if (dec && catDurations[dec.category]) {
        // Approximate: we'll calculate average later
      }
    });
    const catReviewerCount: Record<string, number[]> = {};
    const decReviewerMap: Record<string, Set<string>> = {};
    (reviews || []).forEach((r: any) => {
      if (!decReviewerMap[r.decision_id]) decReviewerMap[r.decision_id] = new Set();
      decReviewerMap[r.decision_id].add(r.reviewer_id);
    });
    (decisions || []).forEach((d: any) => {
      if (!catReviewerCount[d.category]) catReviewerCount[d.category] = [];
      const reviewerCount = decReviewerMap[d.id]?.size || 0;
      if (reviewerCount > 0) catReviewerCount[d.category].push(reviewerCount);
    });

    Object.entries(catDurations).forEach(([cat, data]) => {
      if (data.count < 3) return;
      const avgDays = Math.round(data.totalDays / data.count);
      const benchmark = industryBenchmarks[cat] || 7;
      if (avgDays >= benchmark * 2) {
        const avgReviewers = catReviewerCount[cat]?.length > 0
          ? (catReviewerCount[cat].reduce((a, b) => a + b, 0) / catReviewerCount[cat].length).toFixed(1)
          : "?";
        const catLabel: Record<string, string> = {
          strategic: "Strategische Entscheidungen", budget: "Investitionsfreigaben", hr: "HR-Entscheidungen",
          technical: "Technische Entscheidungen", operational: "Operative Entscheidungen",
          marketing: "Marketing-Entscheidungen", general: "Allgemeine Entscheidungen",
        };
        anomalies.push({
          type: "problem_category",
          severity: "high",
          title: `Problemkategorie: ${catLabel[cat] || cat}`,
          description: `${catLabel[cat] || cat} dauern bei Ihnen ${avgDays} Tage — Branchenstandard: ${benchmark} Tage. Mögliche Ursache: Zu viele Reviewer (Ø ${avgReviewers} statt empfohlene 3).`,
          recommendation: "Template mit reduzierter Review-Kette erstellen.",
          action: { label: "Templates anpassen", route: "/templates" },
          meta: { category: cat, avgDays, benchmark, avgReviewers },
        });
      }
    });

    // ═══ PATTERN 3: Escalating Costs ═══
    const activeDecisions = (decisions || []).filter((d: any) =>
      !["implemented", "rejected", "archived", "cancelled"].includes(d.status)
    );
    // Calculate current total CoD
    let currentTotalCod = 0;
    activeDecisions.forEach((d: any) => {
      const daysOpen = (now - new Date(d.created_at).getTime()) / 86400000;
      currentTotalCod += Math.round(daysOpen * (d.cost_per_day || 85 * 8 * 3 * 1.5 / 1));
    });
    // Approximate 14-day-ago CoD (same decisions, 14 fewer days each)
    let pastTotalCod = 0;
    activeDecisions.forEach((d: any) => {
      const created = new Date(d.created_at).getTime();
      const fourteenAgo = now - 14 * 86400000;
      if (created < fourteenAgo) {
        const daysOpenThen = (fourteenAgo - created) / 86400000;
        pastTotalCod += Math.round(daysOpenThen * (d.cost_per_day || 85 * 8 * 3 * 1.5 / 1));
      }
    });

    if (pastTotalCod > 0) {
      const pctIncrease = Math.round(((currentTotalCod - pastTotalCod) / pastTotalCod) * 100);
      if (pctIncrease >= 200) {
        // Find main driver category
        const catCosts: Record<string, number> = {};
        activeDecisions.forEach((d: any) => {
          const daysOpen = (now - new Date(d.created_at).getTime()) / 86400000;
          const cost = Math.round(daysOpen * (d.cost_per_day || 85 * 8 * 3 * 1.5));
          catCosts[d.category] = (catCosts[d.category] || 0) + cost;
        });
        const topDriver = Object.entries(catCosts).sort((a, b) => b[1] - a[1])[0];
        const catLabel: Record<string, string> = {
          strategic: "Strategische Entscheidungen", budget: "IT-Investitionen", hr: "HR",
          technical: "Technische Entscheidungen", operational: "Operative Entscheidungen",
          marketing: "Marketing", general: "Allgemein",
        };
        anomalies.push({
          type: "escalating_costs",
          severity: "critical",
          title: "Eskalierende Verzögerungskosten",
          description: `Ihre Verzögerungskosten sind um ${pctIncrease}% gestiegen — Haupttreiber: ${catLabel[topDriver?.[0]] || topDriver?.[0] || "Unbekannt"}.`,
          recommendation: "Kritische Entscheidungen priorisieren und offene Blockaden lösen.",
          action: { label: "Cost-of-Delay prüfen", route: "/analytics" },
          meta: { pctIncrease, currentCod: currentTotalCod, previousCod: pastTotalCod, mainDriver: topDriver?.[0] },
          isBanner: true,
        });
      }
    }

    // ═══ PATTERN 4: Seasonal Dips ═══
    const currentMonth = new Date().getMonth(); // 0-indexed
    if (currentMonth >= 5 && currentMonth <= 7) {
      // Check if there's historical data showing August dips
      const lastYearDecisions = (decisions || []).filter((d: any) => {
        const created = new Date(d.created_at);
        return created.getFullYear() < new Date().getFullYear();
      });
      if (lastYearDecisions.length > 10) {
        const lastYearAugust = lastYearDecisions.filter((d: any) => new Date(d.created_at).getMonth() === 7);
        const lastYearJuly = lastYearDecisions.filter((d: any) => new Date(d.created_at).getMonth() === 6);
        if (lastYearJuly.length > 0 && lastYearAugust.length < lastYearJuly.length * 0.6) {
          anomalies.push({
            type: "seasonal_dip",
            severity: "medium",
            title: "Saisonaler Governance-Einbruch erwartet",
            description: "Historisches Muster erkannt: Urlaubssaison verursacht jährlichen Governance-Einbruch. Letztes Jahr sank die Aktivität im August um über 40%.",
            recommendation: "Vertretungsregeln jetzt aktivieren und kritische Entscheidungen vorziehen.",
            action: { label: "Vertretungen konfigurieren", route: "/settings" },
            meta: { augustCount: lastYearAugust.length, julyCount: lastYearJuly.length },
          });
        }
      }
    }

    return new Response(JSON.stringify({ anomalies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-anomalies error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

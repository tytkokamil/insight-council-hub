import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AiInsightPanel from "@/components/shared/AiInsightPanel";
import { Card, CardContent } from "@/components/ui/card";
import {
  Radar, Flame, Activity, Shield, Users, Clock, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Lightbulb, ArrowRight, CheckSquare, User, FolderOpen,
  BarChart3, Settings, FileText,
} from "lucide-react";
import {
  useDecisions, useTeams, useFilteredDependencies, useFilteredReviews,
  useProfiles, useFilteredNotifications, buildProfileMap,
} from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { useNavigate } from "react-router-dom";

// ── Types ──
interface StatusBottleneck { status: string; avgDays: number; expectedDays: number; delta: number; slaRisk: "ok" | "watch" | "critical"; count: number; }
interface PersonCapacity { userId: string; name: string; openReviews: number; avgDelay: number; capacityUtil: number; recommendation: string; }
interface FrictionMetric { category: string; reworkRate: number; rejectionRate: number; stakeholderConflict: number; count: number; }
interface TeamInteraction { teamA: string; teamB: string; teamAName: string; teamBName: string; handoffTime: number; orgAvgHandoff: number; sharedCount: number; }
interface ActionableRec { title: string; description: string; impact: "hoch" | "mittel" | "niedrig"; timeSaved: string; costSaved: string; route?: string; severity: string; }

const statusLabels: Record<string, string> = { draft: "Draft", proposed: "Proposed", review: "Review", approved: "Approved", implemented: "Implementiert" };
const categoryLabels: Record<string, string> = { strategic: "Strategisch", budget: "Budget", hr: "HR", technical: "Technisch", operational: "Operativ", marketing: "Marketing", general: "Allgemein" };

const ProcessHub = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: profiles = [], isLoading: profLoading } = useProfiles();
  const { data: notifications = [] } = useFilteredNotifications();
  const loading = decLoading || taskLoading || teamLoading || depLoading || revLoading || profLoading;

  // ── Computed state ──
  const [statusBottlenecks, setStatusBottlenecks] = useState<StatusBottleneck[]>([]);
  const [personCapacity, setPersonCapacity] = useState<PersonCapacity[]>([]);
  const [frictionMetrics, setFrictionMetrics] = useState<FrictionMetric[]>([]);
  const [teamInteractions, setTeamInteractions] = useState<TeamInteraction[]>([]);
  const [recommendations, setRecommendations] = useState<ActionableRec[]>([]);
  const [processHealthScore, setProcessHealthScore] = useState(0);
  const [slaViolations, setSlaViolations] = useState({ total: 0, thisWeek: 0, topCategory: "", predictedNext5d: 0 });
  const [snapshotLines, setSnapshotLines] = useState<string[]>([]);

  useEffect(() => {
    if (loading || decisions.length === 0) return;
    const now = Date.now();
    const oneWeekAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;
    const nameMap = buildProfileMap(profiles);
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

    // ═══════════════════════════════════════
    // 1) STATUS BOTTLENECKS
    // ═══════════════════════════════════════
    const expectedDays: Record<string, number> = { draft: 3, proposed: 2, review: 5, approved: 3, implemented: 0 };
    const statusStats: Record<string, { totalDays: number; count: number }> = {};
    const activeStatuses = ["draft", "proposed", "review", "approved"];
    decisions.forEach(d => {
      if (!activeStatuses.includes(d.status) && d.status !== "implemented") return;
      const s = d.status === "implemented" ? "implemented" : d.status;
      if (!statusStats[s]) statusStats[s] = { totalDays: 0, count: 0 };
      const days = d.implemented_at
        ? (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000
        : (now - new Date(d.created_at).getTime()) / 86400000;
      statusStats[s].totalDays += days;
      statusStats[s].count++;
    });
    // Track per-step durations by looking at status + review steps
    const reviewStepStats: Record<string, { totalDays: number; count: number }> = {};
    reviews.forEach(r => {
      const stepKey = `Review Step ${r.step_order}`;
      if (!reviewStepStats[stepKey]) reviewStepStats[stepKey] = { totalDays: 0, count: 0 };
      const days = r.reviewed_at
        ? (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / 86400000
        : (now - new Date(r.created_at).getTime()) / 86400000;
      reviewStepStats[stepKey].totalDays += days;
      reviewStepStats[stepKey].count++;
    });

    const sBottlenecks: StatusBottleneck[] = [];
    activeStatuses.forEach(s => {
      const stat = statusStats[s];
      if (!stat || stat.count === 0) return;
      const avg = Math.round(stat.totalDays / stat.count * 10) / 10;
      const exp = expectedDays[s] || 5;
      const delta = Math.round((avg - exp) * 10) / 10;
      sBottlenecks.push({ status: statusLabels[s] || s, avgDays: avg, expectedDays: exp, delta, slaRisk: delta > exp ? "critical" : delta > exp * 0.5 ? "watch" : "ok", count: stat.count });
    });
    // Add review steps
    Object.entries(reviewStepStats).forEach(([stepKey, stat]) => {
      if (stat.count === 0) return;
      const avg = Math.round(stat.totalDays / stat.count * 10) / 10;
      const exp = 5;
      const delta = Math.round((avg - exp) * 10) / 10;
      sBottlenecks.push({ status: stepKey, avgDays: avg, expectedDays: exp, delta, slaRisk: delta > exp ? "critical" : delta > exp * 0.5 ? "watch" : "ok", count: stat.count });
    });
    setStatusBottlenecks(sBottlenecks.sort((a, b) => b.delta - a.delta));

    // ═══════════════════════════════════════
    // 2) PERSON CAPACITY (not blame)
    // ═══════════════════════════════════════
    const personReviews: Record<string, { openCount: number; delays: number[] }> = {};
    reviews.forEach(r => {
      if (!personReviews[r.reviewer_id]) personReviews[r.reviewer_id] = { openCount: 0, delays: [] };
      if (!r.reviewed_at) {
        personReviews[r.reviewer_id].openCount++;
        personReviews[r.reviewer_id].delays.push((now - new Date(r.created_at).getTime()) / 86400000);
      } else {
        personReviews[r.reviewer_id].delays.push((new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / 86400000);
      }
    });
    const allAvgDelays = Object.values(personReviews).map(p => p.delays.length > 0 ? p.delays.reduce((a, b) => a + b, 0) / p.delays.length : 0);
    const orgAvgDelay = allAvgDelays.length > 0 ? allAvgDelays.reduce((a, b) => a + b, 0) / allAvgDelays.length : 5;

    const pCapacity: PersonCapacity[] = Object.entries(personReviews)
      .filter(([, p]) => p.openCount > 0 || p.delays.some(d => d > orgAvgDelay * 1.3))
      .map(([uid, p]) => {
        const avgDelay = p.delays.length > 0 ? Math.round(p.delays.reduce((a, b) => a + b, 0) / p.delays.length) : 0;
        const capacityUtil = Math.round((p.openCount / Math.max(5, p.openCount)) * 100);
        let recommendation = "Im Normbereich";
        if (capacityUtil > 100) recommendation = "Review-Delegation prüfen";
        else if (capacityUtil > 80) recommendation = "Kapazität beobachten";
        return { userId: uid, name: nameMap[uid] || uid.slice(0, 8), openReviews: p.openCount, avgDelay, capacityUtil, recommendation };
      })
      .sort((a, b) => b.openReviews - a.openReviews)
      .slice(0, 8);
    setPersonCapacity(pCapacity);

    // ═══════════════════════════════════════
    // 3) FRICTION (Rework, Rejections, Conflicts)
    // ═══════════════════════════════════════
    const catFriction: Record<string, { total: number; rejected: number; reworked: number; conflictSignals: number }> = {};
    decisions.forEach(d => {
      if (!catFriction[d.category]) catFriction[d.category] = { total: 0, rejected: 0, reworked: 0, conflictSignals: 0 };
      catFriction[d.category].total++;
      if (d.status === "rejected") catFriction[d.category].rejected++;
      // Rework = approved/implemented decisions that went back to review/draft
      if ((d.escalation_level || 0) > 1) catFriction[d.category].reworked++;
    });
    // Stakeholder conflict signals from reviews
    const decisionReviewMap: Record<string, any[]> = {};
    reviews.forEach(r => { if (!decisionReviewMap[r.decision_id]) decisionReviewMap[r.decision_id] = []; decisionReviewMap[r.decision_id].push(r); });
    Object.entries(decisionReviewMap).forEach(([decId, revs]) => {
      const dec = decisions.find(d => d.id === decId);
      if (!dec) return;
      const hasConflict = revs.length > 2 || revs.some(r => r.status === "rejected");
      if (hasConflict && catFriction[dec.category]) catFriction[dec.category].conflictSignals++;
    });
    const fMetrics: FrictionMetric[] = Object.entries(catFriction)
      .filter(([, f]) => f.total >= 2)
      .map(([cat, f]) => ({
        category: cat,
        reworkRate: Math.round((f.reworked / f.total) * 100),
        rejectionRate: Math.round((f.rejected / f.total) * 100),
        stakeholderConflict: Math.round((f.conflictSignals / f.total) * 100),
        count: f.total,
      }))
      .sort((a, b) => (b.rejectionRate + b.reworkRate + b.stakeholderConflict) - (a.rejectionRate + a.reworkRate + a.stakeholderConflict));
    setFrictionMetrics(fMetrics);

    // ═══════════════════════════════════════
    // 4) SLA & GOVERNANCE
    // ═══════════════════════════════════════
    const escalatedDecs = decisions.filter(d => (d.escalation_level ?? 0) > 0);
    const recentEsc = escalatedDecs.filter(d => new Date(d.last_escalated_at || d.updated_at).getTime() > oneWeekAgo);
    const catViolationCounts: Record<string, number> = {};
    escalatedDecs.forEach(d => { catViolationCounts[d.category] = (catViolationCounts[d.category] || 0) + 1; });
    const topCat = Object.entries(catViolationCounts).sort((a, b) => b[1] - a[1])[0];
    // Predict: decisions approaching due_date without resolution
    const predicted = decisions.filter(d => {
      if (!d.due_date || d.status === "implemented" || d.status === "rejected") return false;
      const dueMs = new Date(d.due_date).getTime();
      return dueMs > now && dueMs < now + 5 * 86400000 && !["approved", "implemented"].includes(d.status);
    }).length;
    setSlaViolations({ total: escalatedDecs.length, thisWeek: recentEsc.length, topCategory: topCat ? (categoryLabels[topCat[0]] || topCat[0]) : "—", predictedNext5d: predicted });

    // SLA compliance by category for heatmap
    const slaByCat: Record<string, { total: number; violated: number; avgResponse: number[] }> = {};
    decisions.forEach(d => {
      if (!slaByCat[d.category]) slaByCat[d.category] = { total: 0, violated: 0, avgResponse: [] };
      slaByCat[d.category].total++;
      if ((d.escalation_level ?? 0) > 0) slaByCat[d.category].violated++;
    });

    // ═══════════════════════════════════════
    // 5) TEAM INTERACTIONS
    // ═══════════════════════════════════════
    const crossMap: Record<string, { sharedIds: Set<string>; delays: number[] }> = {};
    deps.forEach(dep => {
      const src = decisions.find(d => d.id === dep.source_decision_id);
      const tgt = decisions.find(d => d.id === dep.target_decision_id);
      if (!src?.team_id || !tgt?.team_id || src.team_id === tgt.team_id) return;
      const key = [src.team_id, tgt.team_id].sort().join("|");
      if (!crossMap[key]) crossMap[key] = { sharedIds: new Set(), delays: [] };
      crossMap[key].sharedIds.add(dep.source_decision_id!);
      crossMap[key].sharedIds.add(dep.target_decision_id!);
      crossMap[key].delays.push(Math.abs(new Date(tgt.created_at).getTime() - new Date(src.updated_at).getTime()) / 86400000);
    });
    const allHandoffs = Object.values(crossMap).flatMap(c => c.delays);
    const orgAvgHandoff = allHandoffs.length > 0 ? allHandoffs.reduce((a, b) => a + b, 0) / allHandoffs.length : 2;

    const tInteractions: TeamInteraction[] = Object.entries(crossMap).map(([key, data]) => {
      const [a, b] = key.split("|");
      const avgHandoff = data.delays.length > 0 ? Math.round(data.delays.reduce((x, y) => x + y, 0) / data.delays.length * 10) / 10 : 0;
      return { teamA: a, teamB: b, teamAName: teamMap[a] || "?", teamBName: teamMap[b] || "?", handoffTime: avgHandoff, orgAvgHandoff: Math.round(orgAvgHandoff * 10) / 10, sharedCount: data.sharedIds.size };
    }).sort((a, b) => b.handoffTime - a.handoffTime);
    setTeamInteractions(tInteractions);

    // ═══════════════════════════════════════
    // 6) PROCESS HEALTH SCORE
    // ═══════════════════════════════════════
    const overdueCount = decisions.filter(d => d.due_date && new Date(d.due_date).getTime() < now && !["implemented", "rejected"].includes(d.status)).length;
    const overdueRate = decisions.length > 0 ? overdueCount / decisions.length : 0;
    const slaComplianceRate = decisions.length > 0 ? 1 - (escalatedDecs.length / decisions.length) : 1;
    const worstDelta = sBottlenecks.length > 0 ? Math.max(...sBottlenecks.map(s => s.delta)) : 0;
    const bottleneckPenalty = Math.min(30, worstDelta * 3);
    const health = Math.max(0, Math.min(100, Math.round(
      (slaComplianceRate * 35) +
      ((1 - overdueRate) * 30) +
      (Math.max(0, 35 - bottleneckPenalty))
    )));
    setProcessHealthScore(health);

    // Snapshot lines
    const slowCats = fMetrics.filter(f => f.rejectionRate > 20 || f.reworkRate > 15);
    const slowPersons = pCapacity.filter(p => p.capacityUtil > 100);
    const biggestBottleneck = sBottlenecks[0];
    const lines: string[] = [];
    lines.push(`${recentEsc.length} SLA-Verletzungen (${recentEsc.length > 1 ? "↑" : "—"})`);
    lines.push(`${slowCats.length} Kategorie${slowCats.length !== 1 ? "n" : ""} mit hoher Reibung`);
    lines.push(`${slowPersons.length} Reviewer über Kapazität`);
    if (biggestBottleneck) lines.push(`${biggestBottleneck.status} = größter Engpass (+${biggestBottleneck.delta}d)`);
    // Review duration trend (simple: compare recent 30d reviews vs older)
    const recentReviews = reviews.filter(r => r.reviewed_at && new Date(r.reviewed_at).getTime() > thirtyDaysAgo);
    const olderReviews = reviews.filter(r => r.reviewed_at && new Date(r.reviewed_at).getTime() <= thirtyDaysAgo && new Date(r.reviewed_at).getTime() > thirtyDaysAgo - 30 * 86400000);
    if (recentReviews.length > 0 && olderReviews.length > 0) {
      const recentAvg = recentReviews.reduce((s, r) => s + (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000, 0) / recentReviews.length;
      const olderAvg = olderReviews.reduce((s, r) => s + (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 86400000, 0) / olderReviews.length;
      const pctChange = Math.round(((recentAvg - olderAvg) / Math.max(olderAvg, 1)) * 100);
      if (Math.abs(pctChange) > 5) lines.push(`Ø Review-Dauer ${pctChange > 0 ? "+" : ""}${pctChange}% vs Vormonat`);
    }
    setSnapshotLines(lines);

    // ═══════════════════════════════════════
    // 7) RECOMMENDATIONS
    // ═══════════════════════════════════════
    const recs: ActionableRec[] = [];
    if (biggestBottleneck && biggestBottleneck.delta > 2) {
      recs.push({ title: `${biggestBottleneck.status} SLA anpassen`, description: `+${biggestBottleneck.delta}d über Erwartung. SLA-Konfiguration überprüfen.`, impact: "hoch", timeSaved: `${Math.round(biggestBottleneck.delta * biggestBottleneck.count)}d kumuliert`, costSaved: `${Math.round(biggestBottleneck.delta * biggestBottleneck.count * 150)}€`, route: "/settings", severity: "high" });
    }
    if (slowCats.length > 0) {
      const worst = slowCats[0];
      recs.push({ title: `${categoryLabels[worst.category] || worst.category}-Template optimieren`, description: `${worst.rejectionRate}% Ablehnungsrate, ${worst.reworkRate}% Rework.`, impact: "hoch", timeSaved: "~20% Review-Reduktion", costSaved: "Schätzung bei Umsetzung", route: "/templates", severity: "high" });
    }
    if (slowPersons.length > 0) {
      recs.push({ title: "Review-Delegation aktivieren", description: `${slowPersons.length} Reviewer über Kapazität. Delegation einrichten.`, impact: "mittel", timeSaved: `${slowPersons.reduce((s, p) => s + p.avgDelay, 0)}d Delay-Reduktion`, costSaved: "Prozessbeschleunigung", route: "/settings", severity: "medium" });
    }
    if (predicted > 0) {
      recs.push({ title: `${predicted} SLA-Verletzungen verhindern`, description: `${predicted} Entscheidungen drohen in 5 Tagen zu verfallen.`, impact: "hoch", timeSaved: "Sofortige Intervention", costSaved: `~${predicted * 800}€ vermeidbarer Delay`, route: "/decisions", severity: "high" });
    }
    if (tInteractions.some(t => t.handoffTime > orgAvgHandoff * 2)) {
      const worstHandoff = tInteractions[0];
      recs.push({ title: `${worstHandoff.teamAName} ↔ ${worstHandoff.teamBName} beschleunigen`, description: `Ø ${worstHandoff.handoffTime}d Übergabe (Org Ø = ${worstHandoff.orgAvgHandoff}d).`, impact: "mittel", timeSaved: `${Math.round((worstHandoff.handoffTime - worstHandoff.orgAvgHandoff) * worstHandoff.sharedCount)}d`, costSaved: "Prozessoptimierung", severity: "medium" });
    }

    // ═══════════════════════════════════════
    // 7b) AUTO-GENERATE AUTOMATION SUGGESTIONS
    // ═══════════════════════════════════════
    // High-risk decisions without automation
    const highRiskDecs = decisions.filter(d => (d.ai_risk_score ?? 0) > 60 && !["implemented", "rejected", "archived"].includes(d.status));
    if (highRiskDecs.length >= 2) {
      recs.push({
        title: "Risk-Automation erstellen",
        description: `${highRiskDecs.length} High-Risk-Entscheidungen ohne automatische Eskalation. Empfehlung: Automation-Regel für Risk Score > 60.`,
        impact: "hoch",
        timeSaved: "Automatische Eskalation",
        costSaved: `~${highRiskDecs.length * 2100}€ Risk-Mitigation`,
        route: "/automation",
        severity: "high",
      });
    }
    // Categories with high rejection but no automation
    const highRejectionCats = fMetrics.filter(f => f.rejectionRate > 25);
    if (highRejectionCats.length > 0) {
      const cat = highRejectionCats[0];
      recs.push({
        title: `${categoryLabels[cat.category] || cat.category}: Auto-Review einrichten`,
        description: `${cat.rejectionRate}% Ablehnungsrate. Empfehlung: Automatische Review-Zuweisung bei ${categoryLabels[cat.category] || cat.category}-Entscheidungen.`,
        impact: "hoch",
        timeSaved: "~30% weniger Ablehnungen",
        costSaved: "Qualitätssteigerung",
        route: "/automation",
        severity: "high",
      });
    }
    // SLA gaps that could be automated
    const catsWithoutSla = fMetrics.filter(f => {
      const catDecs = decisions.filter(d => d.category === f.category && !d.due_date);
      return catDecs.length >= 3;
    });
    if (catsWithoutSla.length > 0) {
      recs.push({
        title: "SLA-Automation für fehlende Deadlines",
        description: `${catsWithoutSla.length} Kategorie(n) mit Entscheidungen ohne SLA. Automation kann automatisch Deadlines setzen.`,
        impact: "mittel",
        timeSaved: "Governance-Compliance",
        costSaved: "Vermeidbare Delays",
        route: "/automation",
        severity: "medium",
      });
    }

    if (recs.length === 0) recs.push({ title: "Keine kritischen Engpässe", description: "Prozesse laufen im Normbereich.", impact: "niedrig", timeSaved: "—", costSaved: "—", severity: "low" });
    setRecommendations(recs.slice(0, 7));
  }, [loading, decisions, tasks, teams, deps, reviews, profiles, notifications]);

  if (loading) return <AppLayout><AnalysisPageSkeleton cards={4} sections={4} /></AppLayout>;

  if (decisions.length < 5) {
    return (
      <AppLayout>
        <PageHeader title={t("process.title")} subtitle={t("process.subtitle")} role="intelligence" />
        <EmptyAnalysisState
          icon={Radar}
          title={t("process.emptyTitle")}
          description={t("process.emptyDesc", { current: decisions.length })}
          ctaLabel={t("process.createDecisions")}
          ctaRoute="/decisions"
          motivation={t("process.emptyMotivation")}
          hint={t("process.emptyHint")}
          features={[
            { icon: AlertTriangle, label: t("process.bottlenecks"), desc: t("process.bottlenecksDesc") },
            { icon: Flame, label: t("process.friction"), desc: t("process.frictionDesc") },
            { icon: Shield, label: t("process.sla"), desc: t("process.slaDesc") },
          ]}
        />
      </AppLayout>
    );
  }

  const healthColor = processHealthScore >= 70 ? "text-success" : processHealthScore >= 45 ? "text-warning" : "text-destructive";
  const healthBg = processHealthScore >= 70 ? "bg-success/10 border-success/20" : processHealthScore >= 45 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20";
  const healthLabel = processHealthScore >= 70 ? t("process.healthStable") : processHealthScore >= 45 ? t("process.healthWatch") : t("process.healthCritical");
  const riskIcon = (r: "ok" | "watch" | "critical") => r === "critical" ? "🔴" : r === "watch" ? "🟡" : "🟢";

  return (
    <AppLayout>
      <PageHeader
        title={t("process.title")}
        subtitle={t("process.subtitleFull")}
        role="intelligence"
        help={{ title: t("process.title"), description: t("process.help") }}
      />

      {/* ═══════════════════════════════════════ */}
      {/* 1) EXECUTIVE PROCESS SNAPSHOT */}
      {/* ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 mb-8">
        {/* Snapshot summary */}
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("process.processHealth")}</h3>
            </div>
            <ul className="space-y-1.5">
              {snapshotLines.map((line, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-foreground mt-0.5">•</span> {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Health Score Gauge */}
        <Card className={`border ${healthBg} min-w-[180px]`}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">{t("process.healthLabel")}</p>
            <p className={`text-4xl font-bold tabular-nums ${healthColor}`}>{processHealthScore}</p>
            <p className={`text-xs font-medium mt-1 ${healthColor}`}>{healthLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Shield, label: t("process.slaViolations"), value: slaViolations.thisWeek, suffix: t("process.thisWeek"), color: slaViolations.thisWeek > 0 ? "text-destructive" : "text-success" },
          { icon: AlertTriangle, label: t("process.earlyWarning"), value: slaViolations.predictedNext5d, suffix: t("process.in5Days"), color: slaViolations.predictedNext5d > 0 ? "text-warning" : "text-success" },
          { icon: User, label: t("process.reviewerOverCapacity"), value: personCapacity.filter(p => p.capacityUtil > 100).length, color: "text-foreground" },
          { icon: Flame, label: t("process.categoriesWithFriction"), value: frictionMetrics.filter(f => f.rejectionRate > 15 || f.reworkRate > 10).length, color: "text-warning" },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{card.value}<span className="text-xs font-normal text-muted-foreground">{card.suffix || ""}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 2) BOTTLENECK INTELLIGENCE */}
      {/* ═══════════════════════════════════════ */}
      <CollapsibleSection
        title={t("process.bottleneckIntelligence")}
        subtitle={t("process.bottleneckSubtitle")}
        icon={<Radar className="w-4 h-4 text-destructive" />}
        defaultOpen={true}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-5">
            {statusBottlenecks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("process.noBottlenecks")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("process.thStatus")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thAvgDuration")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thVsExpected")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thCount")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thSlaRisk")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusBottlenecks.map(s => (
                      <tr key={s.status} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{s.status}</td>
                        <td className="text-center py-2.5 px-3 tabular-nums">{s.avgDays}d</td>
                        <td className="text-center py-2.5 px-3">
                          <span className={`text-xs font-medium tabular-nums ${s.delta > 0 ? "text-destructive" : "text-success"}`}>
                            {s.delta > 0 ? "+" : ""}{s.delta}d
                          </span>
                        </td>
                        <td className="text-center py-2.5 px-3 text-muted-foreground">{s.count}</td>
                        <td className="text-center py-2.5 px-3">{riskIcon(s.slaRisk)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Person Capacity */}
        {personCapacity.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("process.reviewLoad")}</h4>
            <div className="space-y-2">
              {personCapacity.map(p => (
                <Card key={p.userId}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center text-[10px] font-medium shrink-0">
                        {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.openReviews} offene Reviews · Ø {p.avgDelay}d Delay · Auslastung: {p.capacityUtil}%
                        </p>
                      </div>
                      <div className="shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.capacityUtil > 100 ? "bg-destructive/10 text-destructive" :
                          p.capacityUtil > 80 ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        }`}>{p.recommendation}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ═══════════════════════════════════════ */}
      {/* 3) FRICTION MAP */}
      {/* ═══════════════════════════════════════ */}
      <CollapsibleSection
        title={t("process.frictionMap")}
        subtitle={t("process.frictionSubtitle")}
        icon={<Flame className="w-4 h-4 text-warning" />}
        defaultOpen={true}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-5">
            {frictionMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("process.noFriction")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("process.thCategory")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thReworkRate")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thRejections")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thStakeholderConflicts")}</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("process.thCount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frictionMetrics.map(f => (
                      <tr key={f.category} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{categoryLabels[f.category] || f.category}</td>
                        <td className="text-center py-2.5 px-3">
                          <span className={`text-xs font-medium tabular-nums ${f.reworkRate > 15 ? "text-destructive" : f.reworkRate > 5 ? "text-warning" : "text-success"}`}>{f.reworkRate}%</span>
                        </td>
                        <td className="text-center py-2.5 px-3">
                          <span className={`text-xs font-medium tabular-nums ${f.rejectionRate > 20 ? "text-destructive" : f.rejectionRate > 10 ? "text-warning" : "text-success"}`}>{f.rejectionRate}%</span>
                        </td>
                        <td className="text-center py-2.5 px-3">
                          <span className={`text-xs font-medium tabular-nums ${f.stakeholderConflict > 30 ? "text-destructive" : f.stakeholderConflict > 15 ? "text-warning" : "text-muted-foreground"}`}>{f.stakeholderConflict}%</span>
                        </td>
                        <td className="text-center py-2.5 px-3 text-muted-foreground">{f.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* ═══════════════════════════════════════ */}
      {/* 4) SLA & GOVERNANCE HEATMAP */}
      {/* ═══════════════════════════════════════ */}
      <CollapsibleSection
        title={t("process.slaGovernance")}
        subtitle={`${slaViolations.total} Verletzungen gesamt · Top: ${slaViolations.topCategory}`}
        icon={<Shield className="w-4 h-4 text-destructive" />}
        defaultOpen={slaViolations.thisWeek > 0}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("process.violationsThisWeek")}</p>
              <p className="text-2xl font-bold tabular-nums text-destructive">{slaViolations.thisWeek}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("process.mostFrequentCause")}</p>
              <p className="text-sm font-semibold">{slaViolations.topCategory}</p>
            </CardContent>
          </Card>
          <Card className={slaViolations.predictedNext5d > 0 ? "border-warning/20" : ""}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("process.earlyWarning5d")}</p>
              <p className={`text-2xl font-bold tabular-nums ${slaViolations.predictedNext5d > 0 ? "text-warning" : "text-success"}`}>{slaViolations.predictedNext5d}</p>
              <p className="text-[10px] text-muted-foreground">{t("process.expectedViolations")}</p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* ═══════════════════════════════════════ */}
      {/* 5) TEAM INTERACTIONS */}
      {/* ═══════════════════════════════════════ */}
      {teamInteractions.length > 0 && (
        <CollapsibleSection
          title={t("process.teamInteractions")}
          subtitle={t("process.teamInteractionsSub")}
          icon={<Users className="w-4 h-4 text-muted-foreground" />}
          defaultOpen={false}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-5 space-y-2">
              {teamInteractions.map(ti => {
                const isSlow = ti.handoffTime > ti.orgAvgHandoff * 1.5;
                return (
                  <div key={`${ti.teamA}-${ti.teamB}`} className={`flex items-center gap-4 p-3 rounded-lg border ${isSlow ? "border-warning/30 bg-warning/5" : "border-border"}`}>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-semibold">{ti.teamAName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold">{ti.teamBName}</span>
                    </div>
                    <div className="text-right text-xs">
                      <p className={`font-medium tabular-nums ${isSlow ? "text-warning" : "text-muted-foreground"}`}>
                        Ø {ti.handoffTime}d <span className="text-muted-foreground">(Org Ø = {ti.orgAvgHandoff}d)</span>
                      </p>
                      <p className="text-muted-foreground">{ti.sharedCount} {t("process.sharedDecisions")}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </CollapsibleSection>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* 6) KI-TIEFENANALYSE */}
      {/* ═══════════════════════════════════════ */}
      <AiInsightPanel
        type="bottleneck"
        context={{
          processHealthScore,
          statusBottlenecks: statusBottlenecks.slice(0, 5),
          personCapacity: personCapacity.slice(0, 5).map(p => ({ name: p.name, openReviews: p.openReviews, avgDelay: p.avgDelay, capacityUtil: p.capacityUtil })),
          frictionMetrics: frictionMetrics.slice(0, 5),
          slaViolations,
          teamInteractions: teamInteractions.slice(0, 3).map(t => ({ teams: `${t.teamAName} ↔ ${t.teamBName}`, handoffTime: t.handoffTime, orgAvg: t.orgAvgHandoff })),
        }}
        className="mb-6"
      />

      {/* ═══════════════════════════════════════ */}
      {/* 7) TOP MAßNAHMEN */}
      {/* ═══════════════════════════════════════ */}
      <CollapsibleSection
        title={t("process.topActions")}
        subtitle={t("process.topActionsSub")}
        icon={<Lightbulb className="w-4 h-4 text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <Card
              key={i}
              className={`cursor-pointer transition-colors hover:border-foreground/20 ${
                rec.severity === "high" ? "border-destructive/25" : rec.severity === "medium" ? "border-warning/25" : ""
              }`}
              onClick={() => rec.route && navigate(rec.route)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${
                    rec.severity === "high" ? "bg-destructive/15 text-destructive" :
                    rec.severity === "medium" ? "bg-warning/15 text-warning" :
                    "bg-success/15 text-success"
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold">{rec.title}</p>
                      <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${
                        rec.impact === "hoch" ? "bg-destructive/10 text-destructive" :
                        rec.impact === "mittel" ? "bg-warning/10 text-warning" :
                        "bg-muted/30 text-muted-foreground"
                      }`}>Impact: {rec.impact}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rec.timeSaved}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> {rec.costSaved}
                      </span>
                      {rec.route && (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> {t("process.open")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>
    </AppLayout>
  );
};

export default ProcessHub;

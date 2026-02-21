import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dna, ShieldAlert, Zap, Clock, Users, GitBranch, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, ArrowRight, BarChart3, ListChecks,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import { useDecisions, useTeams, useFilteredDependencies, useFilteredReviews } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";
import AiInsightPanel from "@/components/shared/AiInsightPanel";

interface Trait { id: string; label: string; description: string; score: number; sentiment: "positive" | "negative" | "neutral"; icon: any; insight: string; }
interface CategoryProfile { category: string; label: string; avgDays: number; total: number; implementRate: number; escalationRate: number; }

const DecisionDNA = () => {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [categoryProfiles, setCategoryProfiles] = useState<CategoryProfile[]>([]);
  const [overallArchetype, setOverallArchetype] = useState("");
  const [archetypeDescription, setArchetypeDescription] = useState("");

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: reviews = [], isLoading: revLoading } = useFilteredReviews();
  const { data: deps = [], isLoading: depLoading } = useFilteredDependencies();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const { data: tasks = [], isLoading: taskLoading } = useTasks();
  const loading = decLoading || revLoading || depLoading || teamLoading || taskLoading;

  useEffect(() => {
    if (loading || decisions.length === 0) return;
    const now = Date.now();
    const total = decisions.length;
    const implemented = decisions.filter(d => d.status === "implemented");
    const open = decisions.filter(d => !["implemented", "rejected"].includes(d.status));

    const avgRisk = decisions.filter(d => d.ai_risk_score).reduce((s, d) => s + (d.ai_risk_score || 0), 0) / Math.max(1, decisions.filter(d => d.ai_risk_score).length);
    const highRiskApproved = decisions.filter(d => (d.ai_risk_score || 0) > 60 && (d.status === "approved" || d.status === "implemented")).length;
    const highRiskTotal = decisions.filter(d => (d.ai_risk_score || 0) > 60).length;
    const riskAppetite = highRiskTotal > 0 ? Math.round((highRiskApproved / highRiskTotal) * 100) : 50;
    const isRiskAverse = riskAppetite < 40;

    const durations = implemented.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const velocityScore = Math.max(0, Math.min(100, Math.round(100 - avgDuration * 2)));

    const escalated = decisions.filter(d => (d.escalation_level || 0) > 0).length;
    const escalationRate = Math.round((escalated / total) * 100);
    const implRate = total > 0 ? Math.round((implemented.length / total) * 100) : 0;

    const withDueDate = decisions.filter(d => d.due_date);
    const overdue = withDueDate.filter(d => new Date(d.due_date!).getTime() < now && !["implemented", "rejected"].includes(d.status)).length;
    const overdueRate = withDueDate.length > 0 ? Math.round((overdue / withDueDate.length) * 100) : 0;

    const crossTeamDeps = deps.filter(dep => { const src = decisions.find(d => d.id === dep.source_decision_id); const tgt = decisions.find(d => d.id === dep.target_decision_id); return src?.team_id && tgt?.team_id && src.team_id !== tgt.team_id; });
    const crossTeamScore = Math.min(100, Math.round((crossTeamDeps.length / Math.max(1, deps.length)) * 100));

    const reviewedDecisions = new Set(reviews.map(r => r.decision_id));
    const reviewCoverage = total > 0 ? Math.round((reviewedDecisions.size / total) * 100) : 0;

    const withOutcome = decisions.filter(d => d.ai_impact_score && d.actual_impact_score);
    const predAccuracy = withOutcome.length > 0 ? Math.round(withOutcome.reduce((s, d) => s + (100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0))), 0) / withOutcome.length) : null;

    const computedTraits: Trait[] = [
      { id: "risk_appetite", label: isRiskAverse ? "Risikoavers" : riskAppetite > 70 ? "Risikofreudig" : "Risiko-Balanciert", description: "Umgang mit Hochrisiko-Entscheidungen", score: riskAppetite, sentiment: riskAppetite > 30 && riskAppetite < 80 ? "positive" : "neutral", icon: ShieldAlert, insight: isRiskAverse ? `Nur ${riskAppetite}% der Hochrisiko-Entscheidungen werden umgesetzt.` : `${riskAppetite}% Umsetzung bei Hochrisiko.` },
      { id: "velocity", label: velocityScore > 70 ? "Schnell-Entscheider" : velocityScore > 40 ? "Moderate Geschwindigkeit" : "Langsam-Entscheider", description: "Geschwindigkeit von Draft bis Implementierung", score: velocityScore, sentiment: velocityScore > 50 ? "positive" : "negative", icon: Zap, insight: `Ø ${Math.round(avgDuration)} Tage.` },
      { id: "escalation", label: escalationRate > 30 ? "Eskalations-lastig" : escalationRate > 15 ? "Moderate Eskalation" : "Selbstlösend", description: "Eskalationshäufigkeit", score: 100 - escalationRate, sentiment: escalationRate < 20 ? "positive" : escalationRate < 40 ? "neutral" : "negative", icon: AlertTriangle, insight: `${escalationRate}% aller Entscheidungen werden eskaliert.` },
      { id: "followthrough", label: implRate > 60 ? "Hohe Umsetzungskraft" : implRate > 35 ? "Mittlere Umsetzung" : "Umsetzungsschwach", description: "Implementierungsrate", score: implRate, sentiment: implRate > 50 ? "positive" : implRate > 30 ? "neutral" : "negative", icon: CheckCircle2, insight: `${implRate}% Umsetzungsrate.` },
      { id: "deadline_discipline", label: overdueRate < 15 ? "Deadline-Disziplin" : overdueRate < 35 ? "Deadline-Herausforderungen" : "Chronisch überfällig", description: "Deadline-Einhaltung", score: 100 - overdueRate, sentiment: overdueRate < 20 ? "positive" : "negative", icon: Clock, insight: `${overdueRate}% überfällig.` },
      { id: "cross_team", label: crossTeamScore > 40 ? "Starke Vernetzung" : crossTeamScore > 15 ? "Moderate Vernetzung" : "Silo-Organisation", description: "Cross-Team Vernetzung", score: crossTeamScore, sentiment: crossTeamScore > 20 ? "positive" : "negative", icon: GitBranch, insight: `${crossTeamScore}% cross-team Abhängigkeiten.` },
      { id: "review_culture", label: reviewCoverage > 60 ? "Starke Review-Kultur" : reviewCoverage > 30 ? "Partielle Reviews" : "Schwache Review-Kultur", description: "Review-Abdeckung", score: reviewCoverage, sentiment: reviewCoverage > 50 ? "positive" : reviewCoverage > 25 ? "neutral" : "negative", icon: Users, insight: `${reviewCoverage}% mit Review.` },
    ];
    if (predAccuracy !== null) computedTraits.push({ id: "prediction_accuracy", label: predAccuracy > 75 ? "Präzise Prognosen" : "Moderate Vorhersagequalität", description: "KI vs. tatsächliche Ergebnisse", score: predAccuracy, sentiment: predAccuracy > 60 ? "positive" : "neutral", icon: BarChart3, insight: `${predAccuracy}% Genauigkeit.` });

    // Task Execution Trait
    const doneTasks = tasks.filter(t => t.status === "done");
    const openTasks = tasks.filter(t => t.status !== "done");
    const taskRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 50;
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date!).getTime() < now && t.status !== "done");
    const taskOverdueRate = openTasks.length > 0 ? Math.round((overdueTasks.length / openTasks.length) * 100) : 0;
    const taskScore = Math.round(taskRate * 0.6 + (100 - taskOverdueRate) * 0.4);
    computedTraits.push({ id: "task_execution", label: taskScore > 70 ? "Starke Task-Execution" : taskScore > 45 ? "Moderate Task-Execution" : "Schwache Task-Execution", description: "Aufgaben-Abschluss & Termintreue", score: taskScore, sentiment: taskScore > 60 ? "positive" : taskScore > 40 ? "neutral" : "negative", icon: ListChecks, insight: `${taskRate}% Abschlussrate, ${overdueTasks.length} überfällig.` });

    setTraits(computedTraits);

    const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
    const catLabels: Record<string, string> = { strategic: "Strategisch", budget: "Budget", hr: "HR", technical: "Technisch", operational: "Operativ", marketing: "Marketing" };
    const profiles: CategoryProfile[] = categories.map(cat => {
      const catDecs = decisions.filter(d => d.category === cat); const catImpl = catDecs.filter(d => d.status === "implemented");
      const catDurations = catImpl.filter(d => d.implemented_at).map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
      const catEsc = catDecs.filter(d => (d.escalation_level || 0) > 0).length;
      return { category: cat, label: catLabels[cat] || cat, avgDays: catDurations.length > 0 ? Math.round(catDurations.reduce((a, b) => a + b, 0) / catDurations.length) : 0, total: catDecs.length, implementRate: catDecs.length > 0 ? Math.round((catImpl.length / catDecs.length) * 100) : 0, escalationRate: catDecs.length > 0 ? Math.round((catEsc / catDecs.length) * 100) : 0 };
    }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);
    setCategoryProfiles(profiles);

    const negTraits = computedTraits.filter(t => t.sentiment === "negative");
    const posTraits = computedTraits.filter(t => t.sentiment === "positive");
    if (posTraits.length >= 6) { setOverallArchetype("High-Performance Organisation"); setArchetypeDescription("Schnelle Entscheidungen, starke Umsetzung, gute Vernetzung und hoher Task-Durchsatz."); }
    else if (isRiskAverse && velocityScore < 50) { setOverallArchetype("Konservativ-Analytisch"); setArchetypeDescription("Gründlich aber langsam."); }
    else if (escalationRate > 30 && overdueRate > 30) { setOverallArchetype("Unter Druck"); setArchetypeDescription("Hohe Eskalation und überfällige Entscheidungen."); }
    else if (crossTeamScore < 15 && reviewCoverage < 30) { setOverallArchetype("Silo-getrieben"); setArchetypeDescription("Teams arbeiten isoliert."); }
    else if (velocityScore > 70 && implRate > 60 && taskScore > 60) { setOverallArchetype("Agil & Umsetzungsstark"); setArchetypeDescription("Schnell mit hoher Umsetzungsrate und solidem Task-Durchsatz."); }
    else if (taskScore < 40 && implRate > 50) { setOverallArchetype("Entscheidungsstark, Umsetzungsschwach"); setArchetypeDescription("Gute Entscheidungsrate, aber schwache Aufgaben-Execution."); }
    else { setOverallArchetype("In Entwicklung"); setArchetypeDescription("Gemischte Muster – Fokus auf Schwachstellen."); }
  }, [loading, decisions, reviews, deps, teams, tasks]);

  const sentimentColor = (s: string) => s === "positive" ? "text-success" : s === "negative" ? "text-destructive" : "text-warning";
  const sentimentBg = (s: string) => s === "positive" ? "bg-success/15 border-success/25" : s === "negative" ? "bg-destructive/15 border-destructive/25" : "bg-warning/15 border-warning/25";
  const scoreBarColor = (score: number) => score >= 70 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive";

  if (loading) return <AnalysisPageSkeleton cards={3} sections={2} />;

  if (traits.length === 0) {
    return (
      <AppLayout>
        <div className="mb-6"><p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Diagnostik</p><h1 className="text-xl font-semibold tracking-tight">Decision DNA</h1></div>
        <EmptyAnalysisState icon={Dna} title="Noch keine DNA-Daten" description="Erstelle Entscheidungen für die DNA-Analyse." hint="Mindestens eine Entscheidung benötigt" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Diagnostik</p>
          <h1 className="text-xl font-semibold tracking-tight">Decision DNA</h1>
        </div>
        <PageHelpButton title="Decision DNA" description="Tiefenanalyse deiner Entscheidungsmuster mit konkreten Handlungsempfehlungen." />
      </div>

      {/* Archetype – always visible */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><Dna className="w-6 h-6 text-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Organisations-Archetyp</p>
              <h2 className="text-2xl font-semibold tracking-tight">{overallArchetype}</h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{archetypeDescription}</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-success"><TrendingUp className="w-3 h-3" />{traits.filter(t => t.sentiment === "positive").length} Stärken</span>
            <span className="flex items-center gap-1 text-destructive"><TrendingDown className="w-3 h-3" />{traits.filter(t => t.sentiment === "negative").length} Schwächen</span>
          </div>
        </CardContent>
      </Card>

      {/* DNA Traits – collapsible */}
      <CollapsibleSection title="Organisations-Merkmale" subtitle={`${traits.length} Dimensionen analysiert`} icon={<Dna className="w-4 h-4 text-muted-foreground" />} defaultOpen={true} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {traits.map((trait) => (
            <Card key={trait.id} className={`border ${sentimentBg(trait.sentiment)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30 ${sentimentColor(trait.sentiment)}`}><trait.icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{trait.label}</p>
                    <p className="text-[10px] text-muted-foreground">{trait.description}</p>
                  </div>
                  <span className={`text-xl font-bold tabular-nums ${sentimentColor(trait.sentiment)}`}>{trait.score}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${scoreBarColor(trait.score)}`} style={{ width: `${trait.score}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{trait.insight}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>

      {/* Category Speed Profile – collapsible, default closed */}
      <CollapsibleSection title="Geschwindigkeitsprofil nach Kategorie" icon={<Clock className="w-4 h-4 text-muted-foreground" />} defaultOpen={false} className="mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="space-y-3">
              {categoryProfiles.map((cat) => {
                const maxDays = Math.max(...categoryProfiles.map(c => c.avgDays), 1);
                return (
                  <div key={cat.category} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-24 shrink-0">{cat.label}</span>
                    <div className="flex-1 h-6 rounded-lg bg-muted/30 overflow-hidden relative">
                      <div className={`h-full rounded-lg ${cat.avgDays > 20 ? "bg-destructive/60" : cat.avgDays > 10 ? "bg-warning/50" : "bg-success/40"}`} style={{ width: `${(cat.avgDays / maxDays) * 100}%` }} />
                      <span className="absolute inset-0 flex items-center px-3 text-[10px] font-medium">Ø {cat.avgDays}d • {cat.implementRate}% umgesetzt • {cat.total} total</span>
                    </div>
                    {cat.escalationRate > 25 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium shrink-0">{cat.escalationRate}% eskaliert</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </CollapsibleSection>

      {/* AI Deep Analysis */}
      <AiInsightPanel
        type="dna"
        context={{
          archetype: overallArchetype,
          archetypeDescription,
          traits: traits.map(t => ({ label: t.label, score: t.score, sentiment: t.sentiment, insight: t.insight })),
          categoryProfiles,
          strengths: traits.filter(t => t.sentiment === "positive").length,
          weaknesses: traits.filter(t => t.sentiment === "negative").length,
        }}
        className="mb-8"
      />

      {/* Recommendations – collapsible, default closed */}
      <CollapsibleSection title="Empfehlungen" subtitle="Basierend auf Schwachstellen" icon={<ArrowRight className="w-4 h-4 text-muted-foreground" />} defaultOpen={false}>
        <div className="space-y-2">
          {traits.filter(t => t.sentiment === "negative").map((trait) => (
            <Card key={trait.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{trait.label} verbessern</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{trait.insight}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {traits.filter(t => t.sentiment === "negative").length === 0 && (
            <Card><CardContent className="p-4 text-center text-sm text-success"><CheckCircle2 className="w-5 h-5 mx-auto mb-1" />Keine kritischen Schwächen identifiziert.</CardContent></Card>
          )}
        </div>
      </CollapsibleSection>
    </AppLayout>
  );
};

export default DecisionDNA;

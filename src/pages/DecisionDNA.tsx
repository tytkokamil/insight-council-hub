import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import {
  Dna, ShieldAlert, Zap, Clock, Users, GitBranch, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, ArrowRight, BarChart3,
} from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import { useDecisions, useTeams, useDependencies, useReviews } from "@/hooks/useDecisions";

interface Trait {
  id: string;
  label: string;
  description: string;
  score: number; // 0-100, higher = more of this trait
  sentiment: "positive" | "negative" | "neutral";
  icon: any;
  insight: string;
}

interface CategoryProfile {
  category: string;
  label: string;
  avgDays: number;
  total: number;
  implementRate: number;
  escalationRate: number;
}

const DecisionDNA = () => {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [categoryProfiles, setCategoryProfiles] = useState<CategoryProfile[]>([]);
  const [overallArchetype, setOverallArchetype] = useState("");
  const [archetypeDescription, setArchetypeDescription] = useState("");

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: reviews = [], isLoading: revLoading } = useReviews();
  const { data: deps = [], isLoading: depLoading } = useDependencies();
  const { data: teams = [], isLoading: teamLoading } = useTeams();

  const loading = decLoading || revLoading || depLoading || teamLoading;

  useEffect(() => {
    if (loading || decisions.length === 0) return;

      const now = Date.now();
      const total = decisions.length;
      const implemented = decisions.filter(d => d.status === "implemented");
      const rejected = decisions.filter(d => d.status === "rejected");
      const open = decisions.filter(d => !["implemented", "rejected"].includes(d.status));

      // === TRAIT 1: Risk Appetite ===
      const avgRisk = decisions.filter(d => d.ai_risk_score).reduce((s, d) => s + (d.ai_risk_score || 0), 0) / Math.max(1, decisions.filter(d => d.ai_risk_score).length);
      const highRiskApproved = decisions.filter(d => (d.ai_risk_score || 0) > 60 && (d.status === "approved" || d.status === "implemented")).length;
      const highRiskTotal = decisions.filter(d => (d.ai_risk_score || 0) > 60).length;
      const riskAppetite = highRiskTotal > 0 ? Math.round((highRiskApproved / highRiskTotal) * 100) : 50;
      const isRiskAverse = riskAppetite < 40;

      // === TRAIT 2: Decision Velocity ===
      const durations = implemented
        .filter(d => d.implemented_at)
        .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const velocityScore = Math.max(0, Math.min(100, Math.round(100 - avgDuration * 2)));

      // === TRAIT 3: Escalation Tendency ===
      const escalated = decisions.filter(d => (d.escalation_level || 0) > 0).length;
      const escalationRate = Math.round((escalated / total) * 100);

      // === TRAIT 4: Follow-Through (Implementation Rate) ===
      const implRate = total > 0 ? Math.round((implemented.length / total) * 100) : 0;

      // === TRAIT 5: Overdue Tolerance ===
      const withDueDate = decisions.filter(d => d.due_date);
      const overdue = withDueDate.filter(d =>
        new Date(d.due_date!).getTime() < now && !["implemented", "rejected"].includes(d.status)
      ).length;
      const overdueRate = withDueDate.length > 0 ? Math.round((overdue / withDueDate.length) * 100) : 0;

      // === TRAIT 6: Cross-Team Collaboration ===
      const crossTeamDeps = deps.filter(dep => {
        const src = decisions.find(d => d.id === dep.source_decision_id);
        const tgt = decisions.find(d => d.id === dep.target_decision_id);
        return src?.team_id && tgt?.team_id && src.team_id !== tgt.team_id;
      });
      const crossTeamScore = Math.min(100, Math.round((crossTeamDeps.length / Math.max(1, deps.length)) * 100));

      // === TRAIT 7: Review Thoroughness ===
      const reviewedDecisions = new Set(reviews.map(r => r.decision_id));
      const reviewCoverage = total > 0 ? Math.round((reviewedDecisions.size / total) * 100) : 0;

      // === TRAIT 8: Prediction Accuracy ===
      const withOutcome = decisions.filter(d => d.ai_impact_score && d.actual_impact_score);
      const predAccuracy = withOutcome.length > 0
        ? Math.round(withOutcome.reduce((s, d) => s + (100 - Math.abs((d.ai_impact_score || 0) - (d.actual_impact_score || 0))), 0) / withOutcome.length)
        : null;

      // Build traits
      const computedTraits: Trait[] = [
        {
          id: "risk_appetite",
          label: isRiskAverse ? "Risikoavers" : riskAppetite > 70 ? "Risikofreudig" : "Risiko-Balanciert",
          description: "Wie geht die Organisation mit Hochrisiko-Entscheidungen um?",
          score: riskAppetite,
          sentiment: riskAppetite > 30 && riskAppetite < 80 ? "positive" : "neutral",
          icon: ShieldAlert,
          insight: isRiskAverse
            ? `Nur ${riskAppetite}% der Hochrisiko-Entscheidungen werden umgesetzt. Die Organisation vermeidet systematisch Risiken.`
            : riskAppetite > 70
            ? `${riskAppetite}% der Hochrisiko-Entscheidungen werden umgesetzt. Hohe Risikobereitschaft — Kontrolle prüfen.`
            : `Ausgewogener Umgang mit Risiko (${riskAppetite}% Umsetzung bei Hochrisiko).`,
        },
        {
          id: "velocity",
          label: velocityScore > 70 ? "Schnell-Entscheider" : velocityScore > 40 ? "Moderate Geschwindigkeit" : "Langsam-Entscheider",
          description: "Wie schnell werden Entscheidungen von Draft bis Implementierung gebracht?",
          score: velocityScore,
          sentiment: velocityScore > 50 ? "positive" : "negative",
          icon: Zap,
          insight: `Ø ${Math.round(avgDuration)} Tage von Erstellung bis Umsetzung. ${velocityScore > 70 ? "Exzellente Geschwindigkeit." : velocityScore > 40 ? "Im akzeptablen Bereich." : "Deutlich zu langsam — Prozesse optimieren."}`,
        },
        {
          id: "escalation",
          label: escalationRate > 30 ? "Eskalations-lastig" : escalationRate > 15 ? "Moderate Eskalation" : "Selbstlösend",
          description: "Wie oft müssen Entscheidungen eskaliert werden?",
          score: 100 - escalationRate,
          sentiment: escalationRate < 20 ? "positive" : escalationRate < 40 ? "neutral" : "negative",
          icon: AlertTriangle,
          insight: `${escalationRate}% aller Entscheidungen werden eskaliert. ${escalationRate > 30 ? "Strukturelles Problem — Entscheidungskompetenz dezentralisieren." : "Im gesunden Bereich."}`,
        },
        {
          id: "followthrough",
          label: implRate > 60 ? "Hohe Umsetzungskraft" : implRate > 35 ? "Mittlere Umsetzung" : "Umsetzungsschwach",
          description: "Wie viele Entscheidungen werden tatsächlich implementiert?",
          score: implRate,
          sentiment: implRate > 50 ? "positive" : implRate > 30 ? "neutral" : "negative",
          icon: CheckCircle2,
          insight: `${implRate}% Umsetzungsrate. ${implRate < 35 ? "Viele Entscheidungen versanden — Follow-Up-Prozess einführen." : `${implemented.length} von ${total} Entscheidungen umgesetzt.`}`,
        },
        {
          id: "deadline_discipline",
          label: overdueRate < 15 ? "Deadline-Disziplin" : overdueRate < 35 ? "Deadline-Herausforderungen" : "Chronisch überfällig",
          description: "Werden Deadlines eingehalten?",
          score: 100 - overdueRate,
          sentiment: overdueRate < 20 ? "positive" : "negative",
          icon: Clock,
          insight: `${overdueRate}% der Entscheidungen mit Deadline sind überfällig. ${overdueRate > 35 ? "Systematisches Deadline-Problem — realistische Zeitplanung nötig." : "Akzeptable Deadline-Treue."}`,
        },
        {
          id: "cross_team",
          label: crossTeamScore > 40 ? "Starke Vernetzung" : crossTeamScore > 15 ? "Moderate Vernetzung" : "Silo-Organisation",
          description: "Wie stark sind Teams bei Entscheidungen vernetzt?",
          score: crossTeamScore,
          sentiment: crossTeamScore > 20 ? "positive" : "negative",
          icon: GitBranch,
          insight: `${crossTeamScore}% der Abhängigkeiten sind cross-team. ${crossTeamScore < 15 ? "Teams arbeiten isoliert — mehr cross-funktionale Entscheidungen fördern." : "Gute teamübergreifende Zusammenarbeit."}`,
        },
        {
          id: "review_culture",
          label: reviewCoverage > 60 ? "Starke Review-Kultur" : reviewCoverage > 30 ? "Partielle Reviews" : "Schwache Review-Kultur",
          description: "Wie viele Entscheidungen durchlaufen ein Review?",
          score: reviewCoverage,
          sentiment: reviewCoverage > 50 ? "positive" : reviewCoverage > 25 ? "neutral" : "negative",
          icon: Users,
          insight: `${reviewCoverage}% der Entscheidungen haben mindestens ein Review. ${reviewCoverage < 30 ? "Die meisten Entscheidungen werden ohne Peer-Review getroffen." : "Solide Review-Praxis."}`,
        },
      ];

      if (predAccuracy !== null) {
        computedTraits.push({
          id: "prediction_accuracy",
          label: predAccuracy > 75 ? "Präzise Prognosen" : predAccuracy > 50 ? "Moderate Vorhersagequalität" : "Ungenaue Prognosen",
          description: "Wie genau sind die KI-Vorhersagen vs. tatsächliche Ergebnisse?",
          score: predAccuracy,
          sentiment: predAccuracy > 60 ? "positive" : "neutral",
          icon: BarChart3,
          insight: `${predAccuracy}% Vorhersage-Genauigkeit basierend auf ${withOutcome.length} abgeschlossenen Entscheidungen.`,
        });
      }

      setTraits(computedTraits);

      // Category profiles
      const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"];
      const catLabels: Record<string, string> = {
        strategic: "Strategisch", budget: "Budget", hr: "HR",
        technical: "Technisch", operational: "Operativ", marketing: "Marketing",
      };

      const profiles: CategoryProfile[] = categories.map(cat => {
        const catDecs = decisions.filter(d => d.category === cat);
        const catImpl = catDecs.filter(d => d.status === "implemented");
        const catDurations = catImpl
          .filter(d => d.implemented_at)
          .map(d => (new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime()) / 86400000);
        const catEsc = catDecs.filter(d => (d.escalation_level || 0) > 0).length;

        return {
          category: cat,
          label: catLabels[cat] || cat,
          avgDays: catDurations.length > 0 ? Math.round(catDurations.reduce((a, b) => a + b, 0) / catDurations.length) : 0,
          total: catDecs.length,
          implementRate: catDecs.length > 0 ? Math.round((catImpl.length / catDecs.length) * 100) : 0,
          escalationRate: catDecs.length > 0 ? Math.round((catEsc / catDecs.length) * 100) : 0,
        };
      }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

      setCategoryProfiles(profiles);

      // Determine archetype
      const negTraits = computedTraits.filter(t => t.sentiment === "negative");
      const posTraits = computedTraits.filter(t => t.sentiment === "positive");

      if (posTraits.length >= 5) {
        setOverallArchetype("High-Performance Organisation");
        setArchetypeDescription("Schnelle Entscheidungen, starke Umsetzung, gute Vernetzung. Weiter so.");
      } else if (isRiskAverse && velocityScore < 50) {
        setOverallArchetype("Konservativ-Analytisch");
        setArchetypeDescription("Gründlich aber langsam. Risiken werden vermieden, was Chancen kosten kann.");
      } else if (escalationRate > 30 && overdueRate > 30) {
        setOverallArchetype("Unter Druck");
        setArchetypeDescription("Hohe Eskalationsrate und viele überfällige Entscheidungen deuten auf strukturelle Überlastung hin.");
      } else if (crossTeamScore < 15 && reviewCoverage < 30) {
        setOverallArchetype("Silo-getrieben");
        setArchetypeDescription("Teams arbeiten isoliert mit wenig Reviews. Cross-funktionale Zusammenarbeit stärken.");
      } else if (velocityScore > 70 && implRate > 60) {
        setOverallArchetype("Agil & Umsetzungsstark");
        setArchetypeDescription("Schnelle Entscheidungsfindung mit hoher Umsetzungsrate. Achte auf Qualitätskontrolle.");
      } else {
        setOverallArchetype("In Entwicklung");
        setArchetypeDescription("Die Organisation zeigt gemischte Muster. Fokus auf die identifizierten Schwachstellen legen.");
      }

  }, [loading, decisions, reviews, deps, teams]);

  const sentimentColor = (s: string) =>
    s === "positive" ? "text-success" : s === "negative" ? "text-destructive" : "text-warning";

  const sentimentBg = (s: string) =>
    s === "positive" ? "bg-success/15 border-success/25" : s === "negative" ? "bg-destructive/15 border-destructive/25" : "bg-warning/15 border-warning/25";

  const scoreBarColor = (score: number) =>
    score >= 70 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive";

  if (loading) return <AnalysisPageSkeleton cards={3} sections={2} />;

  if (traits.length === 0) {
    return (
      <AppLayout>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Decision DNA™</h1>
          <p className="text-muted-foreground">Organisations-Diagnostik</p>
        </div>
        <EmptyAnalysisState
          icon={Dna}
          title="Noch keine DNA-Daten"
          description="Erstelle Entscheidungen, damit die DNA-Analyse deiner Organisation starten kann."
          hint="Die DNA-Analyse braucht mindestens eine Entscheidung"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Decision DNA™</h1>
        <p className="text-muted-foreground">Das genetische Profil deiner Organisation</p>
      </div>

      {/* Archetype Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6 border border-primary/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dna className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Organisations-Archetyp</p>
            <h2 className="font-display text-2xl font-bold">{overallArchetype}</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{archetypeDescription}</p>
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1 text-success">
            <TrendingUp className="w-3 h-3" />
            {traits.filter(t => t.sentiment === "positive").length} Stärken
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <TrendingDown className="w-3 h-3" />
            {traits.filter(t => t.sentiment === "negative").length} Schwächen
          </span>
          <span className="flex items-center gap-1 text-warning">
            {traits.filter(t => t.sentiment === "neutral").length} Neutral
          </span>
        </div>
      </motion.div>

      {/* DNA Traits */}
      <h2 className="font-display text-lg font-semibold mb-3">Organisations-Merkmale</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {traits.map((trait, i) => (
          <motion.div
            key={trait.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 border ${sentimentBg(trait.sentiment)}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30 ${sentimentColor(trait.sentiment)}`}>
                <trait.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{trait.label}</p>
                <p className="text-[10px] text-muted-foreground">{trait.description}</p>
              </div>
              <span className={`font-display text-xl font-bold ${sentimentColor(trait.sentiment)}`}>
                {trait.score}
              </span>
            </div>

            {/* Score bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <motion.div
                className={`h-full rounded-full ${scoreBarColor(trait.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${trait.score}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 + 0.2 }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{trait.insight}</p>
          </motion.div>
        ))}
      </div>

      {/* Category Speed Profile */}
      <h2 className="font-display text-lg font-semibold mb-3">Geschwindigkeitsprofil nach Kategorie</h2>
      <div className="glass-card p-5 mb-6">
        <div className="space-y-3">
          {categoryProfiles.map((cat, i) => {
            const maxDays = Math.max(...categoryProfiles.map(c => c.avgDays), 1);
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4"
              >
                <span className="text-sm font-medium w-24 shrink-0">{cat.label}</span>
                <div className="flex-1 h-6 rounded-lg bg-muted/30 overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-lg ${cat.avgDays > 20 ? "bg-destructive/60" : cat.avgDays > 10 ? "bg-warning/50" : "bg-success/40"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.avgDays / maxDays) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-[10px] font-medium">
                    Ø {cat.avgDays}d • {cat.implementRate}% umgesetzt • {cat.total} total
                  </span>
                </div>
                {cat.escalationRate > 25 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium shrink-0">
                    {cat.escalationRate}% eskaliert
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <h2 className="font-display text-lg font-semibold mb-3">Empfehlungen</h2>
      <div className="space-y-2">
        {traits.filter(t => t.sentiment === "negative").map((trait, i) => (
          <motion.div
            key={trait.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="glass-card p-4 flex items-start gap-3"
          >
            <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{trait.label} verbessern</p>
              <p className="text-xs text-muted-foreground mt-0.5">{trait.insight}</p>
            </div>
          </motion.div>
        ))}
        {traits.filter(t => t.sentiment === "negative").length === 0 && (
          <div className="glass-card p-4 text-center text-sm text-success">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
            Keine kritischen Schwächen identifiziert. Weiter so!
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DecisionDNA;

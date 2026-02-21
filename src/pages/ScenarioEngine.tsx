import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FlaskConical, AlertTriangle, Clock, DollarSign, TrendingDown,
  Play, Loader2, Users, GitBranch, Zap, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AiInsightPanel from "@/components/shared/AiInsightPanel";
import { useDecisions, useFilteredDependencies, useTeams } from "@/hooks/useDecisions";

type DelayImpact = {
  decision: any;
  delayWeeks: number;
  costPerWeek: number;
  totalCost: number;
  riskIncrease: number;
  cascadeCount: number;
  cascadeDecisions: string[];
  severity: "low" | "medium" | "high" | "critical";
};

type SimulationResult = {
  impacts: DelayImpact[];
  totalCost: number;
  avgRiskIncrease: number;
  criticalCount: number;
  timelineData: { week: number; cumulativeCost: number; riskLevel: number }[];
  aiInsights: string | null;
  monteCarlo: { percentile: string; cost: number; risk: number }[];
};

const ScenarioEngine = ({ embedded }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingDec || loadingDeps || loadingTeams;
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Simulation parameters
  const [delayWeeks, setDelayWeeks] = useState(4);
  const [scope, setScope] = useState<"all" | "overdue" | "critical">("overdue");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  const getTargetDecisions = () => {
    let pool = decisions.filter(d => d.status !== "implemented");
    if (scope === "overdue") pool = pool.filter(d => d.due_date && new Date(d.due_date) < new Date());
    if (scope === "critical") pool = pool.filter(d => d.priority === "critical" || d.priority === "high");
    if (selectedTeam !== "all") pool = pool.filter(d => d.team_id === selectedTeam);
    return pool;
  };

  const getCascade = (decisionId: string, visited = new Set<string>()): string[] => {
    if (visited.has(decisionId)) return [];
    visited.add(decisionId);
    const downstream = deps
      .filter(d => d.source_decision_id === decisionId)
      .map(d => d.target_decision_id);
    const all: string[] = [...downstream];
    downstream.forEach(id => all.push(...getCascade(id, visited)));
    return [...new Set(all)];
  };

  const runSimulation = async () => {
    setSimulating(true);
    const targets = getTargetDecisions();
    if (targets.length === 0) {
      toast({ title: "Keine Entscheidungen", description: "Keine offenen Entscheidungen für diese Filter gefunden.", variant: "destructive" });
      setSimulating(false);
      return;
    }

    const priorityMultiplier: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const baseHourlyRate = 75;

    const impacts: DelayImpact[] = targets.map(d => {
      const team = teams.find(t => t.id === d.team_id);
      const rate = team?.hourly_rate || baseHourlyRate;
      const mult = priorityMultiplier[d.priority] || 1;
      const riskBase = (d.ai_risk_score ?? 30) / 100;
      const impactBase = (d.ai_impact_score ?? 50) / 100;

      const costPerWeek = Math.round(rate * 8 * mult * impactBase); // 8h/week opportunity cost
      const totalCost = costPerWeek * delayWeeks;
      const riskIncrease = Math.min(100, Math.round(riskBase * 100 + delayWeeks * 5 * mult));
      const cascade = getCascade(d.id);
      const cascadeTitles = cascade.map(id => decisions.find(x => x.id === id)?.title || "Unbekannt");

      let severity: DelayImpact["severity"] = "low";
      if (totalCost > 5000 || riskIncrease > 80) severity = "critical";
      else if (totalCost > 2000 || riskIncrease > 60) severity = "high";
      else if (totalCost > 800 || riskIncrease > 40) severity = "medium";

      return {
        decision: d,
        delayWeeks,
        costPerWeek,
        totalCost,
        riskIncrease,
        cascadeCount: cascade.length,
        cascadeDecisions: cascadeTitles,
        severity,
      };
    });

    impacts.sort((a, b) => b.totalCost - a.totalCost);

    const totalCost = impacts.reduce((s, i) => s + i.totalCost, 0);
    const avgRiskIncrease = Math.round(impacts.reduce((s, i) => s + i.riskIncrease, 0) / (impacts.length || 1));
    const criticalCount = impacts.filter(i => i.severity === "critical" || i.severity === "high").length;

    // Monte Carlo simulation (1000 iterations with random variance)
    const monteCarloRuns = 1000;
    const costResults: number[] = [];
    const riskResults: number[] = [];
    for (let i = 0; i < monteCarloRuns; i++) {
      let runCost = 0; let runRisk = 0;
      impacts.forEach(imp => {
        const variance = 0.5 + Math.random() * 1.0; // 50%-150% variance
        runCost += imp.totalCost * variance;
        runRisk += imp.riskIncrease * (0.7 + Math.random() * 0.6);
      });
      costResults.push(runCost);
      riskResults.push(runRisk / (impacts.length || 1));
    }
    costResults.sort((a, b) => a - b);
    riskResults.sort((a, b) => a - b);
    const monteCarlo = [
      { percentile: "Best Case (P10)", cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.1)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.1)]) },
      { percentile: "Wahrscheinlich (P50)", cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.5)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.5)]) },
      { percentile: "Pessimistisch (P75)", cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.75)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.75)]) },
      { percentile: "Worst Case (P95)", cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.95)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.95)]) },
    ];

    const timelineData = Array.from({ length: delayWeeks + 1 }, (_, w) => ({
      week: w,
      cumulativeCost: impacts.reduce((s, i) => s + i.costPerWeek * w, 0),
      riskLevel: Math.min(100, Math.round(impacts.reduce((s, i) => s + ((i.decision.ai_risk_score ?? 30) / 100 * 100 + w * 5), 0) / (impacts.length || 1))),
    }));

    // AI insights
    let aiInsights: string | null = null;
    try {
      const top3 = impacts.slice(0, 3).map(i => `${i.decision.title} (${i.decision.priority}, Kosten: €${i.totalCost}, Kaskade: ${i.cascadeCount})`);
      const { data } = await supabase.functions.invoke("simulate-scenarios", {
        body: {
          decision: { title: "Unternehmensweite Verzögerungsanalyse", description: `${targets.length} offene Entscheidungen werden um ${delayWeeks} Wochen verzögert. Gesamtkosten: €${totalCost}`, category: "strategic", priority: "high" },
          scenarios: [
            { title: "Aktueller Kurs", probability: 70, description: `Top-3 Risiken: ${top3.join("; ")}` },
            { title: "Sofortiges Handeln", probability: 30, description: `Alle ${criticalCount} kritischen Entscheidungen werden sofort bearbeitet.` },
          ],
        },
      });
      if (data?.overall_recommendation) aiInsights = data.overall_recommendation;
    } catch {
      // AI optional
    }

    setResult({ impacts, totalCost, avgRiskIncrease, criticalCount, timelineData, aiInsights, monteCarlo });
    setSimulating(false);
  };

  const severityColors: Record<string, string> = {
    critical: "bg-destructive", high: "bg-warning", medium: "bg-accent", low: "bg-success",
  };

  const targetCount = getTargetDecisions().length;

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Simulation</p>
            <h1 className="text-xl font-semibold tracking-tight">Scenario Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">Simuliere unternehmensweite Auswirkungen wenn Entscheidungen verschoben werden.</p>
          </div>
          <PageHelpButton title="Scenario Engine" description="Simuliere, was passiert wenn Entscheidungen verschoben werden. Wähle einzelne oder alle Entscheidungen und passe die Verzögerung an, um Kaskadeneffekte und Kosten zu berechnen." />
        </div>

        {loading ? (
          <AnalysisPageSkeleton cards={4} sections={1} />
        ) : decisions.length === 0 ? (
          <EmptyAnalysisState
            icon={FlaskConical}
            title="Keine Entscheidungen vorhanden"
            description="Erstelle Entscheidungen, um Delay-Szenarien und Kaskadeneffekte zu simulieren."
            hint="Die Simulation analysiert Kosten und Risiken bei Verzögerungen"
          />
        ) : (
          <>
            {/* Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Simulationsparameter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Verzögerung: {delayWeeks} Wochen</label>
                    <Slider value={[delayWeeks]} onValueChange={v => setDelayWeeks(v[0])} min={1} max={16} step={1} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scope</label>
                    <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle offenen</SelectItem>
                        <SelectItem value="overdue">Nur überfällige</SelectItem>
                        <SelectItem value="critical">Nur kritische/hohe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team</label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Teams</SelectItem>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={runSimulation} disabled={simulating || targetCount === 0} className="w-full">
                      {simulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      Simulation starten ({targetCount})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="w-6 h-6 mx-auto text-destructive mb-1" />
                      <div className="text-2xl font-bold text-destructive">€{result.totalCost.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Geschätzte Gesamtkosten</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <AlertTriangle className="w-6 h-6 mx-auto text-warning mb-1" />
                      <div className="text-2xl font-bold">{result.avgRiskIncrease}%</div>
                      <p className="text-xs text-muted-foreground">Ø Risikoanstieg</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Zap className="w-6 h-6 mx-auto text-destructive mb-1" />
                      <div className="text-2xl font-bold">{result.criticalCount}</div>
                      <p className="text-xs text-muted-foreground">Kritische Auswirkungen</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <GitBranch className="w-6 h-6 mx-auto text-primary mb-1" />
                      <div className="text-2xl font-bold">{result.impacts.reduce((s, i) => s + i.cascadeCount, 0)}</div>
                      <p className="text-xs text-muted-foreground">Kaskadeneffekte</p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insight */}
                {result.aiInsights && (
                  <Card className="border-border bg-muted/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <FlaskConical className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium mb-1">KI-Empfehlung</p>
                          <p className="text-sm text-muted-foreground">{result.aiInsights}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <CollapsibleSection
                  title="Detailanalyse"
                  subtitle="Charts & Kaskadeneffekte"
                  icon={<GitBranch className="w-4 h-4 text-muted-foreground" />}
                >
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">Kosten-Timeline</TabsTrigger>
                    <TabsTrigger value="impact">Impact-Ranking</TabsTrigger>
                    <TabsTrigger value="cascade">Kaskadenanalyse</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={result.timelineData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="week" label={{ value: "Wochen Verzögerung", position: "bottom", offset: -5 }} />
                              <YAxis yAxisId="cost" label={{ value: "Kosten (€)", angle: -90, position: "insideLeft" }} />
                              <YAxis yAxisId="risk" orientation="right" domain={[0, 100]} label={{ value: "Risiko %", angle: 90, position: "insideRight" }} />
                              <Tooltip formatter={(val: number, name: string) => [name.includes("Cost") || name.includes("Kosten") ? `€${val.toLocaleString()}` : `${val}%`, name]} />
                              <Legend />
                              <Line yAxisId="cost" type="monotone" dataKey="cumulativeCost" stroke="hsl(var(--primary))" strokeWidth={2} name="Kumulative Kosten" dot={false} />
                              <Line yAxisId="risk" type="monotone" dataKey="riskLevel" stroke="hsl(var(--destructive))" strokeWidth={2} name="Risikoniveau" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="impact">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={result.impacts.slice(0, 10)} layout="vertical" margin={{ left: 160 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis type="number" />
                              <YAxis dataKey="decision.title" type="category" width={150} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(val: number) => [`€${val.toLocaleString()}`, "Kosten"]} />
                              <Bar dataKey="totalCost" name="Gesamtkosten" radius={[0, 4, 4, 0]}>
                                 {result.impacts.slice(0, 10).map((entry, i) => (
                                   <Cell key={i} fill={entry.severity === "critical" ? "hsl(var(--destructive))" : entry.severity === "high" ? "hsl(var(--warning))" : entry.severity === "medium" ? "hsl(var(--muted-foreground))" : "hsl(var(--success))"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="cascade">
                    <div className="space-y-3">
                      {result.impacts.filter(i => i.cascadeCount > 0).slice(0, 8).map(impact => (
                        <Card key={impact.decision.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${severityColors[impact.severity]}`} />
                                  <span className="font-medium text-sm truncate">{impact.decision.title}</span>
                                  <Badge variant="outline" className="shrink-0">{impact.decision.priority}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />€{impact.totalCost.toLocaleString()}</span>
                                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Risiko +{impact.riskIncrease}%</span>
                                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{impact.cascadeCount} abhängige</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {impact.cascadeDecisions.slice(0, 5).map((title, i) => (
                                    <div key={i} className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-0.5">
                                      <ChevronRight className="w-3 h-3" />{title}
                                    </div>
                                  ))}
                                  {impact.cascadeDecisions.length > 5 && (
                                    <span className="text-xs text-muted-foreground">+{impact.cascadeDecisions.length - 5} weitere</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {result.impacts.filter(i => i.cascadeCount > 0).length === 0 && (
                        <Card><CardContent className="pt-4 text-center text-sm text-muted-foreground">Keine Kaskadeneffekte gefunden – erstellen Sie Abhängigkeiten im Decision Graph.</CardContent></Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                </CollapsibleSection>

                {/* Monte Carlo Simulation Results */}
                <CollapsibleSection
                  title="Monte Carlo Simulation"
                  subtitle="1.000 Iterationen mit Varianzanalyse"
                  icon={<FlaskConical className="w-4 h-4 text-primary" />}
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {result.monteCarlo.map((mc, i) => (
                      <Card key={i} className={i === 3 ? "border-destructive/30" : i === 0 ? "border-success/30" : ""}>
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{mc.percentile}</p>
                          <p className={`text-xl font-bold tabular-nums ${i >= 3 ? "text-destructive" : i >= 2 ? "text-warning" : ""}`}>
                            €{mc.cost.toLocaleString("de-DE")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">Risiko: {mc.risk}%</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-success/60 h-full" style={{ width: "10%" }} />
                      <div className="bg-primary/40 h-full" style={{ width: "40%" }} />
                      <div className="bg-warning/50 h-full" style={{ width: "25%" }} />
                      <div className="bg-destructive/50 h-full" style={{ width: "25%" }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Best Case</span>
                      <span>Wahrscheinlich</span>
                      <span>Pessimistisch</span>
                      <span>Worst Case</span>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* AI Deep Analysis */}
                <AiInsightPanel
                  type="bottleneck"
                  context={{
                    analysisType: "scenario_simulation",
                    delayWeeks,
                    totalCost: result.totalCost,
                    avgRiskIncrease: result.avgRiskIncrease,
                    criticalCount: result.criticalCount,
                    cascadeTotal: result.impacts.reduce((s, i) => s + i.cascadeCount, 0),
                    monteCarlo: result.monteCarlo,
                    topImpacts: result.impacts.slice(0, 5).map(i => ({
                      title: i.decision.title, priority: i.decision.priority, totalCost: i.totalCost, riskIncrease: i.riskIncrease, cascadeCount: i.cascadeCount
                    })),
                  }}
                />
              </>
            )}
          </>
        )}
      </div>
    </Wrap>
  );
};

export default ScenarioEngine;

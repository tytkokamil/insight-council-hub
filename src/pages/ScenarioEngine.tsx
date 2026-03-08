import { useState, useMemo } from "react";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { useTranslation } from "react-i18next";
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
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FlaskConical, AlertTriangle, Clock, DollarSign, TrendingDown,
  Play, Loader2, Users, GitBranch, Zap, ChevronRight, Download, Info, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: decisions = [], isLoading: loadingDec } = useDecisions();
  const { data: deps = [], isLoading: loadingDeps } = useFilteredDependencies();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingDec || loadingDeps || loadingTeams;
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

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
      toast({ title: t("scenarioEngine.noTargets"), description: t("scenarioEngine.noTargetsDesc"), variant: "destructive" });
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

      const costPerWeek = Math.round(rate * 8 * mult * impactBase);
      const totalCost = costPerWeek * delayWeeks;
      const riskIncrease = Math.min(100, Math.round(riskBase * 100 + delayWeeks * 5 * mult));
      const cascade = getCascade(d.id);
      const cascadeTitles = cascade.map(id => decisions.find(x => x.id === id)?.title || t("scenarioEngine.unknown"));

      let severity: DelayImpact["severity"] = "low";
      if (totalCost > 5000 || riskIncrease > 80) severity = "critical";
      else if (totalCost > 2000 || riskIncrease > 60) severity = "high";
      else if (totalCost > 800 || riskIncrease > 40) severity = "medium";

      return { decision: d, delayWeeks, costPerWeek, totalCost, riskIncrease, cascadeCount: cascade.length, cascadeDecisions: cascadeTitles, severity };
    });

    impacts.sort((a, b) => b.totalCost - a.totalCost);

    const totalCost = impacts.reduce((s, i) => s + i.totalCost, 0);
    const avgRiskIncrease = Math.round(impacts.reduce((s, i) => s + i.riskIncrease, 0) / (impacts.length || 1));
    const criticalCount = impacts.filter(i => i.severity === "critical" || i.severity === "high").length;

    // Monte Carlo
    const monteCarloRuns = 1000;
    const costResults: number[] = [];
    const riskResults: number[] = [];
    for (let i = 0; i < monteCarloRuns; i++) {
      let runCost = 0; let runRisk = 0;
      impacts.forEach(imp => {
        const variance = 0.5 + Math.random() * 1.0;
        runCost += imp.totalCost * variance;
        runRisk += imp.riskIncrease * (0.7 + Math.random() * 0.6);
      });
      costResults.push(runCost);
      riskResults.push(runRisk / (impacts.length || 1));
    }
    costResults.sort((a, b) => a - b);
    riskResults.sort((a, b) => a - b);
    const monteCarlo = [
      { percentile: t("scenarioEngine.bestCaseP"), cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.1)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.1)]) },
      { percentile: t("scenarioEngine.probableP"), cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.5)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.5)]) },
      { percentile: t("scenarioEngine.pessimisticP"), cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.75)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.75)]) },
      { percentile: t("scenarioEngine.worstCaseP"), cost: Math.round(costResults[Math.floor(monteCarloRuns * 0.95)]), risk: Math.round(riskResults[Math.floor(monteCarloRuns * 0.95)]) },
    ];

    const timelineData = Array.from({ length: delayWeeks + 1 }, (_, w) => ({
      week: w,
      cumulativeCost: impacts.reduce((s, i) => s + i.costPerWeek * w, 0),
      riskLevel: Math.min(100, Math.round(impacts.reduce((s, i) => s + ((i.decision.ai_risk_score ?? 30) / 100 * 100 + w * 5), 0) / (impacts.length || 1))),
    }));

    let aiInsights: string | null = null;
    try {
      const top3 = impacts.slice(0, 3).map(i => `${i.decision.title} (${i.decision.priority}, Cost: €${i.totalCost}, Cascade: ${i.cascadeCount})`);
      const { data } = await supabase.functions.invoke("simulate-scenarios", {
        body: {
          decision: { title: "Company-wide delay analysis", description: `${targets.length} open decisions delayed by ${delayWeeks} weeks. Total cost: €${totalCost}`, category: "strategic", priority: "high" },
          scenarios: [
            { title: "Current course", probability: 70, description: `Top 3 risks: ${top3.join("; ")}` },
            { title: "Immediate action", probability: 30, description: `All ${criticalCount} critical decisions addressed immediately.` },
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("scenarioEngine.label")}</p>
            <h1 className="text-xl font-semibold tracking-tight">{t("scenarioEngine.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("scenarioEngine.subtitle")}</p>
          </div>
          <PageHelpButton title={t("scenarioEngine.title")} description={t("scenarioEngine.help")} />
        </div>

        {loading ? (
          <AnalysisPageSkeleton cards={4} sections={1} />
        ) : decisions.length === 0 ? (
          <EmptyAnalysisState
            icon={FlaskConical}
            title={t("scenarioEngine.noDecisions")}
            description={t("scenarioEngine.noDecisionsDesc")}
            hint={t("scenarioEngine.noDecisionsHint")}
          />
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("scenarioEngine.simParams")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("scenarioEngine.delayWeeks", { count: delayWeeks })}</label>
                    <Slider value={[delayWeeks]} onValueChange={v => setDelayWeeks(v[0])} min={1} max={16} step={1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>1 {t("scenarioEngine.weekUnit")}</span>
                      <span>16 {t("scenarioEngine.weeksUnit")}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("scenarioEngine.scope")}</label>
                    <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("scenarioEngine.scopeAll")}</SelectItem>
                        <SelectItem value="overdue">{t("scenarioEngine.scopeOverdue")}</SelectItem>
                        <SelectItem value="critical">{t("scenarioEngine.scopeCritical")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("scenarioEngine.team")}</label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("scenarioEngine.allTeams")}</SelectItem>
                        {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={runSimulation} disabled={simulating || targetCount === 0} className="w-full">
                            {simulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                            {t("scenarioEngine.runSim", { count: targetCount })}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{t("scenarioEngine.runSimTooltip", { count: targetCount })}</p></TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t("scenarioEngine.totalCost")}</p>
                      <DollarSign className="w-5 h-5 mx-auto text-destructive mb-1" />
                      <div className="text-2xl font-bold text-destructive">{formatCurrency(result.totalCost)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t("scenarioEngine.avgRiskIncrease")}</p>
                      <AlertTriangle className="w-5 h-5 mx-auto text-warning mb-1" />
                      <div className="text-2xl font-bold">
                        {(() => {
                          const baseRisk = Math.max(0, result.avgRiskIncrease - delayWeeks * 5);
                          return `${baseRisk}% → ${result.avgRiskIncrease}%`;
                        })()}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t("scenarioEngine.riskDelayContext", { weeks: delayWeeks, defaultValue: `bei ${delayWeeks} Wochen Verzögerung` })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t("scenarioEngine.criticalImpacts")}</p>
                      <Zap className="w-5 h-5 mx-auto text-destructive mb-1" />
                      <div className="text-2xl font-bold">{result.criticalCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t("scenarioEngine.cascadeEffects")}</p>
                      <GitBranch className="w-5 h-5 mx-auto text-primary mb-1" />
                      <div className="text-2xl font-bold">{result.impacts.reduce((s, i) => s + i.cascadeCount, 0)}</div>
                    </CardContent>
                  </Card>
                </div>

                {result.aiInsights && (
                  <div className="rounded-lg p-4 border-l-4 border-l-primary bg-primary/[0.04]">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-bold mb-1 text-primary">{t("scenarioEngine.aiRecommendation")}</p>
                        <p className="text-sm text-muted-foreground">{result.aiInsights}</p>
                      </div>
                    </div>
                  </div>
                )}

                <CollapsibleSection
                  title={t("scenarioEngine.detailAnalysis")}
                  subtitle={t("scenarioEngine.detailSubtitle")}
                  icon={<GitBranch className="w-4 h-4 text-muted-foreground" />}
                >
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">{t("scenarioEngine.tabTimeline")}</TabsTrigger>
                    <TabsTrigger value="impact">{t("scenarioEngine.tabImpact")}</TabsTrigger>
                    <TabsTrigger value="cascade">{t("scenarioEngine.tabCascade")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={result.timelineData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="week" tickFormatter={(v: number) => `${t("scenarioEngine.weekShort")} ${v}`} label={{ value: t("scenarioEngine.weeksDelay"), position: "bottom", offset: -5 }} />
                              <YAxis yAxisId="cost" label={{ value: t("scenarioEngine.costLabel"), angle: -90, position: "insideLeft" }} />
                              <YAxis yAxisId="risk" orientation="right" domain={[0, 100]} label={{ value: t("scenarioEngine.riskPercent"), angle: 90, position: "insideRight" }} />
                              <Tooltip formatter={(val: number, name: string) => [name.includes("Cost") || name.includes("Kosten") ? `€${val.toLocaleString()}` : `${val}%`, name]} />
                              <Legend />
                              <Line yAxisId="cost" type="monotone" dataKey="cumulativeCost" stroke="hsl(var(--primary))" strokeWidth={2} name={t("scenarioEngine.cumulativeCost")} dot={false} />
                              <Line yAxisId="risk" type="monotone" dataKey="riskLevel" stroke="hsl(var(--destructive))" strokeWidth={2} name={t("scenarioEngine.riskLevel")} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-center mt-1 text-[11px] text-muted-foreground/60">
                          {t("scenarioEngine.chartExplanation", "Linke Achse: kumulative Kosten in € | Rechte Achse: Risikoniveau in %")}
                        </p>
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
                              <Tooltip formatter={(val: number) => [`€${val.toLocaleString()}`, t("scenarioEngine.costTooltip")]} />
                              <Bar dataKey="totalCost" name={t("scenarioEngine.totalCostBar")} radius={[0, 4, 4, 0]}>
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
                                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{t("scenarioEngine.riskPlus", { value: impact.riskIncrease })}</span>
                                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{impact.cascadeCount} {t("scenarioEngine.dependent")}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {impact.cascadeDecisions.slice(0, 5).map((title, i) => (
                                    <div key={i} className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-0.5">
                                      <ChevronRight className="w-3 h-3" />{title}
                                    </div>
                                  ))}
                                  {impact.cascadeDecisions.length > 5 && (
                                    <span className="text-xs text-muted-foreground">{t("scenarioEngine.more", { count: impact.cascadeDecisions.length - 5 })}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {result.impacts.filter(i => i.cascadeCount > 0).length === 0 && (
                        <Card><CardContent className="pt-4 text-center text-sm text-muted-foreground">{t("scenarioEngine.noCascade")}</CardContent></Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                </CollapsibleSection>

                <CollapsibleSection
                  title={t("scenarioEngine.monteCarloTitle")}
                  subtitle={t("scenarioEngine.monteCarloSub")}
                  icon={<FlaskConical className="w-4 h-4 text-primary" />}
                  defaultOpen={true}
                >
                  <TooltipProvider>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {result.monteCarlo.map((mc, i) => (
                      <Card key={i} className={i === 3 ? "border-destructive/30" : i === 0 ? "border-success/30" : ""}>
                        <CardContent className="p-4 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{mc.percentile}</p>
                          <p className={`text-xl font-bold tabular-nums ${i >= 3 ? "text-destructive" : i >= 2 ? "text-warning" : ""}`}>
                            {formatCurrency(mc.cost)}
                          </p>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-muted-foreground mt-0.5 cursor-help inline-flex items-center gap-1 mx-auto">
                                {t("scenarioEngine.riskMC", { value: mc.risk })}
                                <Info className="w-3 h-3" />
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[200px]">
                              <p className="text-xs">{t("scenarioEngine.monteCarloTooltip")}</p>
                            </TooltipContent>
                          </UITooltip>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  </TooltipProvider>
                  <div className="mt-4">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <div className="h-3 rounded-full bg-muted overflow-hidden flex cursor-help">
                            <div className="bg-success/60 h-full" style={{ width: "10%" }} />
                            <div className="bg-primary/40 h-full" style={{ width: "40%" }} />
                            <div className="bg-warning/50 h-full" style={{ width: "25%" }} />
                            <div className="bg-destructive/50 h-full" style={{ width: "25%" }} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px]">
                          <p className="text-xs">{t("scenarioEngine.riskBarTooltip")}</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{t("scenarioEngine.bestCase")}</span>
                      <span>{t("scenarioEngine.probable")}</span>
                      <span>{t("scenarioEngine.pessimistic")}</span>
                      <span>{t("scenarioEngine.worstCase")}</span>
                    </div>
                  </div>
                </CollapsibleSection>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    const lines = [
                      t("scenarioEngine.title"),
                      `${t("scenarioEngine.delayWeeks", { count: delayWeeks })}`,
                      "",
                      `${t("scenarioEngine.totalCost")}: ${formatCurrency(result.totalCost)}`,
                      `${t("scenarioEngine.avgRiskIncrease")}: ${result.avgRiskIncrease}%`,
                      `${t("scenarioEngine.criticalImpacts")}: ${result.criticalCount}`,
                      `${t("scenarioEngine.cascadeEffects")}: ${result.impacts.reduce((s, i) => s + i.cascadeCount, 0)}`,
                      "",
                      t("scenarioEngine.monteCarloTitle"),
                      ...result.monteCarlo.map(mc => `  ${mc.percentile}: ${formatCurrency(mc.cost)} (${t("scenarioEngine.riskMC", { value: mc.risk })})`),
                      "",
                      t("scenarioEngine.tabImpact"),
                      ...result.impacts.slice(0, 10).map(i => `  ${i.decision.title} — ${formatCurrency(i.totalCost)} (${i.severity})`),
                      "",
                      result.aiInsights ? `${t("scenarioEngine.aiRecommendation")}: ${result.aiInsights}` : "",
                    ];
                    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `simulation-${new Date().toISOString().slice(0, 10)}.txt`;
                    a.click(); URL.revokeObjectURL(url);
                    toast({ title: t("scenarioEngine.exported") });
                  }}>
                    <Download className="w-3.5 h-3.5" />
                    {t("scenarioEngine.exportSim")}
                  </Button>
                </div>

              </>
            )}
          </>
        )}
      </div>
    </Wrap>
  );
};

export default ScenarioEngine;

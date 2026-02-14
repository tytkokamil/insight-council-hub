import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

type Decision = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
  team_id: string | null;
  ai_risk_score: number | null;
  ai_impact_score: number | null;
  created_at: string;
  escalation_level: number | null;
};

type DelayImpact = {
  decision: Decision;
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
};

const ScenarioEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [deps, setDeps] = useState<{ source_decision_id: string; target_decision_id: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; hourly_rate: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Simulation parameters
  const [delayWeeks, setDelayWeeks] = useState(4);
  const [scope, setScope] = useState<"all" | "overdue" | "critical">("overdue");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("decisions").select("id,title,status,priority,category,due_date,team_id,ai_risk_score,ai_impact_score,created_at,escalation_level"),
      supabase.from("decision_dependencies").select("source_decision_id,target_decision_id"),
      supabase.from("teams").select("id,name,hourly_rate"),
    ]).then(([dRes, depRes, tRes]) => {
      setDecisions((dRes.data || []) as Decision[]);
      setDeps(depRes.data || []);
      setTeams((tRes.data || []) as any);
      setLoading(false);
    });
  }, [user]);

  const getTargetDecisions = (): Decision[] => {
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

    setResult({ impacts, totalCost, avgRiskIncrease, criticalCount, timelineData, aiInsights });
    setSimulating(false);
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-green-500",
  };

  const targetCount = getTargetDecisions().length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <FlaskConical className="w-8 h-8 text-primary" /> Scenario Engine 2.0™
          </h1>
          <p className="text-muted-foreground mt-1">Simulieren Sie unternehmensweite Auswirkungen wenn Entscheidungen verschoben werden.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Lade Daten…</div>
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
                      <AlertTriangle className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                      <div className="text-2xl font-bold">{result.avgRiskIncrease}%</div>
                      <p className="text-xs text-muted-foreground">Ø Risikoanstieg</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Zap className="w-6 h-6 mx-auto text-red-500 mb-1" />
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
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <FlaskConical className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium mb-1">KI-Empfehlung</p>
                          <p className="text-sm text-muted-foreground">{result.aiInsights}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                              <Line yAxisId="risk" type="monotone" dataKey="riskLevel" stroke="#ef4444" strokeWidth={2} name="Risikoniveau" dot={false} />
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
                                  <Cell key={i} fill={entry.severity === "critical" ? "#ef4444" : entry.severity === "high" ? "#f97316" : entry.severity === "medium" ? "#eab308" : "#22c55e"} />
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
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ScenarioEngine;
